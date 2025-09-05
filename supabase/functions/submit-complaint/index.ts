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

    // Get the last complaint numbers from both tables to determine next complaint_number
    const { data: lastNew, error: lastNewError } = await supabase
      .from('new_civilcomplaint')
      .select('complaint_number')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    const { data: lastOld, error: lastOldError } = await supabase
      .from('civilcomplaint')
      .select('complaint_number')
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
                content: `당신은 한국 정부 민원 요약·분류 전문가입니다.

목표:
- request_content를 6~8단어 한 문장으로 아주 간결하게 요약
- 원문 문장/구절을 그대로 복사하지 말고 새로운 표현으로 작성
- 한국어로 작성, 마침표 없이 핵심만

부서 선택 지침:
- 작성된 요약과 아래 부서별 주요업무·키워드를 매칭
- 반드시 제공 목록에서 정확히 일치하는 부서명만 선택

사용 가능한 부서 목록:
${validDepartments.map(name => `- ${name}`).join('\n')}

부서별 상세 정보:
${departments?.map(dept => `
부서명: ${dept.department_name}
주요업무: ${[dept.maintask1, dept.Maintask2, dept.Maintask3, dept.Maintask4, dept.Maintask5].filter(Boolean).join(', ')}
키워드: ${[dept.Keyword1, dept.Keyword2, dept.Keyword3].filter(Boolean).join(', ')}
`).join('\n')}

반드시 다음 JSON만 반환:
{"summary": "6~8단어 요약(새 문장)", "department": "부서명"}`
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
                summary: parsedAnalysis.summary,
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
    
    // AI analysis is required - no fallback allowed
    if (!aiAnalysis) {
      throw new Error('AI analysis failed. Cannot process complaint without proper summary and department assignment.');
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

    // Generate next complaint_number safely across both tables, preserving numeric suffix width
    const candidates = [lastNew?.complaint_number, lastOld?.complaint_number].filter(Boolean) as string[];

    function extractTailNum(s: string): { num: number; width: number; str: string } | null {
      const m = String(s).match(/(\d+)(?!.*\d)/);
      return m ? { num: parseInt(m[1], 10), width: m[1].length, str: String(s) } : null;
    }

    let nextComplaintNumber: string;
    if (candidates.length > 0) {
      // Pick candidate with the largest numeric tail
      const parsed = candidates
        .map(extractTailNum)
        .filter(Boolean) as Array<{ num: number; width: number; str: string }>;
      if (parsed.length > 0) {
        const best = parsed.reduce((a, b) => (b.num > a.num ? b : a));
        const re = /(\d+)(?!.*\d)/;
        const inc = String(best.num + 1).padStart(best.width, '0');
        nextComplaintNumber = best.str.replace(re, inc);
      } else {
        // No numeric tail found; fallback to simple increment if numeric, else timestamp-based unique suffix
        const base = String(candidates[0]);
        const asNum = Number(base);
        nextComplaintNumber = Number.isFinite(asNum) ? String(asNum + 1) : `${base}-${Date.now()}`;
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