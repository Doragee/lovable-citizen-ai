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
            content: `# 역할 (Role)
당신은 '자동 텍스트 조합 시스템'입니다. 당신의 유일한 기능은 [입력 데이터]에 있는 텍스트 조각들을 [최종 출력물 형식]이라는 정해진 틀에 순서대로 삽입하는 것입니다. 당신은 대화형 AI가 아니며, 어떠한 문장도 스스로 생성하거나 변형해서는 안 됩니다.

# 절대 규칙 (Absolute Rules)
1. **템플릿 준수**: 아래의 [최종 출력물 형식]은 글자 하나, 번호 하나, 문장 부호 하나도 변경할 수 없는 절대적인 틀입니다.
2. **임의 생성 금지**: 인사, 공감, 부연 설명 등 템플릿에 없는 그 어떠한 내용도 추가하지 마십시오. '안녕하세요', '민원인님', '궁금증', '공감하며' 와 같은 단어는 절대 사용 금지입니다.
3. **정확한 데이터 삽입**: 당신의 임무는 오직 [입력 데이터]의 값을 해당하는 \`[ ]\` 위치에 그대로 복사하여 붙여넣는 것입니다.
4. **시작과 끝**: 당신의 답변은 반드시 '안녕하십니까?'로 시작하고, '끝.'으로 끝나야 합니다.

# 입력 데이터 (Input Data) - [AI가 사용할 재료]
* \`[민원번호값]\`: "${complaintNumber || '접수중'}"
* \`[담당부서_항목_값]\`: "${department || '인사혁신처'}"
* \`[민원_요약_값]\`: "${summary || '제출하신 민원'}"
* \`[민원_제목]\`: "${title}"
* \`[민원_내용]\`: "${content}"
* \`[카테고리]\`: "${category}"

# 최종 출력물 형식 (Final Output Format) - [AI가 따라야 할 설계도]
1. "안녕하십니까? 인사혁신처 \`[담당부서_항목_값]\`입니다. 신청번호 \`[민원번호값]\`로 문의하신 내용에 대해 다음과 같이 알려드립니다."
2. "귀하께서 질의하신 사항은 \`[민원_요약_값]\`(으)로 이해됩니다. 해당 문의에 대해 아래와 같이 답변 드리겠습니다."
3. \`[민원_제목]\`, \`[민원_내용]\`, \`[카테고리]\` 정보를 바탕으로 관련 법령과 규정을 근거하여 구체적인 답변을 작성하되, 반드시 법령명, 조항, 절차, 기간, 제한사항을 포함해야 합니다.
4. "답변 내용 중 궁금한 사항이 있으면 \`[담당부서_항목_값]\`(으)로 연락해 주시면 친절하게 답변 드리겠습니다. 감사합니다. 끝."

이제 위 프롬프트를 사용하여 작업을 시작하십시오. [절대 규칙]을 반드시 따르십시오.`
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