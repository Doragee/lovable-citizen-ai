import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const openaiApiKey = Deno.env.get('chatgpt');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    console.log('Processing chatbot query:', message);

    // Generate chatbot response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `당신은 한국 정부 민원 처리 AI 어시스턴트입니다. 
담당자가 민원 처리 과정에서 궁금한 사항을 질문하면 도움이 되는 답변을 제공해주세요.

현재 처리 중인 민원 정보:
- 제목: ${context?.title || '정보 없음'}
- 내용: ${context?.request_content || '정보 없음'}
- 카테고리: ${context?.category || '정보 없음'}

친절하고 전문적인 톤으로 한국어로 답변해주세요.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    console.log('Chatbot response generated successfully');

    return new Response(JSON.stringify({
      response: botResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatbot-query:', error);
    return new Response(JSON.stringify({
      error: error.message,
      response: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});