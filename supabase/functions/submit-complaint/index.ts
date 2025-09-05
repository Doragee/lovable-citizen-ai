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
    const openaiApiKey = Deno.env.get('chatgpt');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    console.log('Processing complaint submission:', { title, category });

    // Get the last complaint to determine next ID and complaint number
    const { data: lastComplaint } = await supabase
      .from('civilcomplaint')
      .select('id, complaint_number')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    // Get departments data for AI analysis
    const { data: departments } = await supabase
      .from('departments')
      .select('department_name, maintask1, Maintask2, Maintask3, Maintask4, Maintask5, Keyword1, Keyword2, Keyword3');

    // Generate summary and department assignment using ChatGPT
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

부서 정보:
${departments?.map(dept => `
부서명: ${dept.department_name}
주요업무: ${[dept.maintask1, dept.Maintask2, dept.Maintask3, dept.Maintask4, dept.Maintask5].filter(Boolean).join(', ')}
키워드: ${[dept.Keyword1, dept.Keyword2, dept.Keyword3].filter(Boolean).join(', ')}
`).join('\n')}

응답은 반드시 다음 JSON 형식으로만 답변하세요:
{"summary": "요약 내용", "department": "부서명"}`
          },
          {
            role: 'user',
            content: `제목: ${title}\n내용: ${content}\n카테고리: ${category}`
          }
        ],
        max_tokens: 300
      }),
    });

    if (!summaryResponse.ok) {
      throw new Error('Failed to generate summary');
    }

    const summaryData = await summaryResponse.json();
    let aiAnalysis;
    
    try {
      aiAnalysis = JSON.parse(summaryData.choices[0].message.content);
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      aiAnalysis = {
        summary: content.substring(0, 100) + '...',
        department: '일반행정과'
      };
    }

    console.log('AI Analysis completed:', aiAnalysis);

    // Generate embeddings for title, content, and summary
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

    if (!titleEmbeddingResponse.ok || !contentEmbeddingResponse.ok || !summaryEmbeddingResponse.ok) {
      throw new Error('Failed to generate embeddings');
    }

    const [titleEmbeddingData, contentEmbeddingData, summaryEmbeddingData] = await Promise.all([
      titleEmbeddingResponse.json(),
      contentEmbeddingResponse.json(),
      summaryEmbeddingResponse.json()
    ]);

    const titleEmbedding = titleEmbeddingData.data[0].embedding;
    const contentEmbedding = contentEmbeddingData.data[0].embedding;
    const summaryEmbedding = summaryEmbeddingData.data[0].embedding;

    // Generate next ID and complaint number
    const lastId = lastComplaint?.id ? Number(lastComplaint.id) : 0;
    const nextId = lastId + 1;
    const lastNumRaw = (lastComplaint?.complaint_number ?? 0) as number | string;
    const lastNumParsed = typeof lastNumRaw === 'number' ? lastNumRaw : Number(lastNumRaw) || 0;
    const nextComplaintNumber = lastNumParsed + 1;

    // Insert into civilcomplaint table
    const { data: insertData, error: insertError } = await supabase
      .from('civilcomplaint')
      .insert({
        id: nextId,
        civilianid: 1295,
        complaint_number: nextComplaintNumber,
        title: title,
        request_content: content,
        category: category,
        summary: aiAnalysis.summary,
        department: aiAnalysis.department,
        status: '0',
        request_date: new Date().toISOString().split('T')[0],
        title_embedding: titleEmbedding,
        request_content_embedding: contentEmbedding,
        summary_embedding: summaryEmbedding
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