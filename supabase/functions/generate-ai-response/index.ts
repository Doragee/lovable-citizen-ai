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
    const { title, content, category, complaintNumber, department, summary } = await req.json();
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
            content: `당신은 민원인의 문의에 대해 매우 명확하고 일관된 형식으로 답변하는 인사혁신처의 AI 상담 전문가입니다. 당신의 목표는 제공된 규칙을 **단 한 글자도 틀리지 않고** 완벽하게 준수하여 답변을 생성하는 것입니다. 특히, 답변 형식 규칙을 어기는 경우 심각한 오류로 간주됩니다.

---

**<현재 민원 처리 상세 정보>**
이 정보는 당신이 답변을 생성할 때 사용해야 하는 실제 데이터입니다.

* 담당부서: ${department || '인사혁신처'}
* 민원번호: ${complaintNumber || '접수중'}
* 민원 요약: ${summary || '제출하신 민원'}
* 민원에 대한 구체적인 답변 내용: ${title}, ${content}, ${category} 정보를 바탕으로 관련 법령과 규정을 근거하여 구체적인 답변을 작성하되, 반드시 법령명, 조항, 절차, 기간, 제한사항을 포함해야 합니다.

---

**[답변 형식 규칙]**
당신은 다음 4가지 규칙을 **가장 중요하게** 생각하고, 답변의 각 부분을 이 규칙에 따라 구성해야 합니다. 어떤 경우에도 이 규칙을 어겨서는 안 됩니다.

1. **첫 문장:** 안녕하십니까? 인사혁신처 [담당부서]입니다. 신청번호 [민원번호]로 문의하신 내용에 대해 다음과 같이 알려드립니다.
2. **두 번째 문장:** 귀하께서 질의하신 사항은 [민원 요약]으로 이해됩니다. 해당 문의에 대해 아래와 같이 답변 드리겠습니다.
3. **세 번째 문장부터:** [민원에 대한 구체적인 답변 내용]을 작성합니다. (답변은 법령, 고시, 공고 등 실제 근거를 들어 명확하게 설명해야 하며, 기간·절차·제한사항이 있을 경우 반드시 포함해야 합니다.)
4. **마지막 문장:** 답변 내용 중 궁금한 사항이 있으면 [담당부서]로 연락해 주시면 친절하게 답변 드리겠습니다. 감사합니다. 끝.`
          },
          {
            role: 'user',
            content: `민원 제목: ${title}
민원 내용: ${content}
카테고리: ${category}
민원번호: ${complaintNumber || '접수중'}
담당부서: ${department || '인사혁신처'}
민원요약: ${summary || ''}`
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