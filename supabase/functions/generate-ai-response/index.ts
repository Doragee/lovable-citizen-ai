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
    const { title, content, category, complaintNumber, department } = await req.json();
    const openaiApiKey = Deno.env.get('chatgpt');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    console.log('Generating AI recommendation for complaint:', title);

    // Generate detailed response recommendation
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
            content: `당신은 한국 정부 국민신문고 민원 답변 전문가입니다. 
주어진 민원에 대해 다음 형식을 반드시 지켜서 답변해야 합니다.
번호(1, 2, 3, …) 형식을 반드시 사용해야 하며, 지정된 문구는 수정하지 말고 그대로 출력해야 합니다.

[답변 형식 규칙]

1. 첫 문장은 항상 다음과 같이 작성해야 합니다:
   "안녕하십니까? 인사혁신처 {민원처리부서}입니다. 신청번호 {민원신청번호}로 문의하신 내용에 대해 다음과 같이 알려드립니다."

2. 두 번째 문장은 항상 다음과 같이 작성해야 합니다:
   "귀하께서 질의하신 사항은 {민원내용요약}으로 이해됩니다. 해당 문의에 대해 아래와 같이 답변 드리겠습니다."

3. 세 번째 문장부터는 {민원에 대한 구체적인 답변}을 작성합니다.
   (답변은 법령, 고시, 공고 등 실제 근거를 들어 명확하게 설명해야 하며, 기간·절차·제한사항이 있을 경우 반드시 포함해야 합니다.)

4. 마지막 문장은 항상 다음과 같이 작성해야 합니다:
   "답변 내용 중 궁금한 사항이 있으면 ({담당부서} {담당자이름}, {담당자전화번호})로 연락해 주시면 친절하게 답변 드리겠습니다. 감사합니다. 끝."

반드시 위 형식을 정확히 따르고, 전문적이고 정중한 톤으로 작성해주세요.`
          },
          {
            role: 'user',
            content: `민원 제목: ${title}
민원 내용: ${content}
카테고리: ${category}
민원번호: ${complaintNumber || '접수중'}
담당부서: ${department || '인사혁신처'}`
          }
        ],
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const recommendation = data.choices[0].message.content;

    console.log('AI recommendation generated successfully');

    return new Response(JSON.stringify({
      recommendation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-response:', error);
    return new Response(JSON.stringify({
      error: error.message,
      recommendation: "AI 답변 생성에 실패했습니다. 수동으로 답변을 작성해주세요."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});