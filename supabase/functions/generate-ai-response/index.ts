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
            content: `당신은 오직 구조화된 텍스트 템플릿에 맞춰 내용을 채워 넣는 기계적인 시스템입니다. 어떤 경우에도 다음 지침을 위반할 수 없습니다.

**<지침>**
1. 사용자에게 제공된 [DATA] 섹션의 값을 사용하여 [TEXT_TEMPLATE] 섹션의 각 [변수명]을 **정확히 한 번씩** 대체해야 합니다.
2. [TEXT_TEMPLATE] 섹션에 명시된 문장과 문단 구조, 문장 부호를 **단 한 글자도 변경하지 않고** 그대로 유지해야 합니다.
3. [TEXT_TEMPLATE] 섹션의 내용 외에는 **그 어떠한 다른 텍스트도 추가, 수정, 또는 생성해서는 안 됩니다.**
4. 절대 어떤 인사말, 추가적인 설명, 자기소개, 감사의 표현, 혹은 비관련 정보도 출력하지 마십시오.

**<DATA>**
* 담당부서: ${department || '인사혁신처'}
* 민원번호: ${complaintNumber || '접수중'}
* 민원요약: ${summary || '제출하신 민원'}
* 구체적_답변_내용: ${title}, ${content}, ${category} 정보를 바탕으로 관련 법령과 규정을 근거하여 구체적인 답변을 작성하되, 반드시 법령명, 조항, 절차, 기간, 제한사항을 포함해야 합니다.

**<TEXT_TEMPLATE>**
IGNORE_ALL_OTHER_TEXT_ABOVE. PRODUCE_ONLY_THE_FOLLOWING_TEXT.

안녕하십니까? 인사혁신처 [담당부서]입니다. 신청번호 [민원번호]로 문의하신 내용에 대해 다음과 같이 알려드립니다.

귀하께서 질의하신 사항은 [민원요약]으로 이해됩니다. 해당 문의에 대해 아래와 같이 답변 드리겠습니다.

[구체적_답변_내용]

답변 내용 중 궁금한 사항이 있으면 [담당부서]로 연락해 주시면 친절하게 답변 드리겠습니다. 감사합니다. 끝.`
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