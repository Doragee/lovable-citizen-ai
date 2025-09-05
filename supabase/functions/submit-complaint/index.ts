import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, category } = await req.json();
    
    if (!title || !content || !category) {
      throw new Error('Title, content, and category are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('chatgpt') || Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.warn('OpenAI API key not found. Proceeding with fallback analysis and no embeddings.');
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    console.log('Processing complaint submission:', { title, category });

    // Get the last complaint to determine next ID and complaint number
    const { data: lastComplaint } = await supabase
      .from('new_civilcomplaint')
      .select('id, complaint_number')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    // Get departments data for AI analysis
    const { data: departments } = await supabase
      .from('departments')
      .select('department_name, maintask1, Maintask2, Maintask3, Maintask4, Maintask5, Keyword1, Keyword2, Keyword3');

    // Get valid department names for validation
    const validDepartments = departments?.map(dept => dept.department_name) || [];
    const defaultDepartment = validDepartments.length > 0 ? validDepartments[0] : 'Unknown';

    // Generate summary and department assignment (fallback if AI unavailable)
    let aiAnalysis;
    if (openaiApiKey) {
      try {
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `당신은 한국 정부 민원 분석 전문가입니다. 
민원 내용을 분석하여 1줄 요약과 가장 적합한 부서를 찾아주세요.

중요: 부서명은 반드시 아래 제공된 부서 목록에서만 정확히 선택해야 합니다.

사용 가능한 부서 목록:
${validDepartments.map(name => `- ${name}`).join('\n')}

부서별 상세 정보:
${departments?.map(dept => `
부서명: ${dept.department_name}
주요업무: ${[dept.maintask1, dept.Maintask2, dept.Maintask3, dept.Maintask4, dept.Maintask5].filter(Boolean).join(', ')}
키워드: ${[dept.Keyword1, dept.Keyword2, dept.Keyword3].filter(Boolean).join(', ')}
`).join('\n')}

응답은 반드시 다음 JSON 형식으로만 답변하세요:
{"summary": "요약 내용", "department": "부서명"}
부서명은 위 목록에서 정확히 일치하는 것만 사용하세요.`
              },
              {
                role: 'user',
                content: `제목: ${title}
내용: ${content}
카테고리: ${category}`
              }
            ],
            max_tokens: 300
          }),
        });
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          try {
            const parsedAnalysis = JSON.parse(summaryData.choices[0].message.content);
            // Validate that the returned department exists in our department list
            if (validDepartments.includes(parsedAnalysis.department)) {
              aiAnalysis = parsedAnalysis;
            } else {
              console.warn(`AI returned invalid department: ${parsedAnalysis.department}. Using default.`);
              aiAnalysis = {
                summary: parsedAnalysis.summary || content.substring(0, 100) + '...',
                department: defaultDepartment
              };
            }
          } catch (parseError) {
            console.error('AI response parsing error:', parseError);
          }
        } else {
          console.warn('AI summary generation failed with status', summaryResponse.status);
        }
      } catch (err) {
        console.error('AI summary generation error:', err);
      }
    }
    if (!aiAnalysis) {
      aiAnalysis = {
        summary: content.substring(0, 100) + '...',
        department: defaultDepartment
      };
    }
    console.log('AI Analysis completed (with fallback if needed):', aiAnalysis);

    // Generate embeddings for title, content, and summary (optional)
    let titleEmbedding = null;
    let contentEmbedding = null;
    let summaryEmbedding = null;
    if (openaiApiKey) {
      try {
        const [titleEmbeddingResponse, contentEmbeddingResponse, summaryEmbeddingResponse] = await Promise.all([
          fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: title,
            }),
          }),
          fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: content,
            }),
          }),
          fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: aiAnalysis.summary,
            }),
          })
        ]);

        if (titleEmbeddingResponse.ok && contentEmbeddingResponse.ok && summaryEmbeddingResponse.ok) {
          const [titleEmbeddingData, contentEmbeddingData, summaryEmbeddingData] = await Promise.all([
            titleEmbeddingResponse.json(),
            contentEmbeddingResponse.json(),
            summaryEmbeddingResponse.json()
          ]);

          titleEmbedding = titleEmbeddingData.data[0].embedding;
          contentEmbedding = contentEmbeddingData.data[0].embedding;
          summaryEmbedding = summaryEmbeddingData.data[0].embedding;
        } else {
          console.warn('Embedding generation failed, proceeding without embeddings');
        }
      } catch (err) {
        console.error('Embedding generation error:', err);
      }
    }

    // Generate next complaint_number based on last row, preserving format if it contains digits
    const lastCn = lastComplaint?.complaint_number ?? null;
    let nextComplaintNumber: string;
    if (lastCn) {
      const lastStr = String(lastCn);
      const re = /(\d+)(?!.*\d)/;
      const m = lastStr.match(re);
      if (m) {
        const width = m[1].length;
        const inc = (parseInt(m[1], 10) + 1).toString().padStart(width, '0');
        nextComplaintNumber = lastStr.replace(re, inc);
      } else {
        const asNum = Number(lastStr);
        nextComplaintNumber = Number.isFinite(asNum) ? String(asNum + 1) : '1';
      }
    } else {
      nextComplaintNumber = '1';
    }

    // Insert into civilcomplaint table
    const { data: insertData, error: insertError } = await supabase
      .from('civilcomplaint')
      .insert({
        // id: 데이터베이스가 자동으로 생성
        civilianid: 1295,
        complaint_number: String(nextComplaintNumber),
        title: title,
        request_content: content,
        category: category,
        summary: aiAnalysis.summary,
        department: aiAnalysis.department,
        status: '0',
        request_date: new Date().toISOString().split('T')[0],
        title_embedding: titleEmbedding ? JSON.stringify(titleEmbedding) : null,
        request_content_embedding: contentEmbedding ? JSON.stringify(contentEmbedding) : null,
        summary_embedding: summaryEmbedding ? JSON.stringify(summaryEmbedding) : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Complaint submitted successfully:', insertData.id);

    return new Response(JSON.stringify({
      success: true,
      complaint: insertData,
      aiAnalysis: aiAnalysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in submit-complaint:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});