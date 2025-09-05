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
            content: `# 페르소나 (Persona)
당신은 대한민국 인사혁신처의 민원 담당 공무원을 위한 답변 초안 작성 AI 어시스턴트입니다. 당신의 최우선 임무는 주어진 [답변 형식 규칙]을 단 하나의 예외도 없이 완벽하게 준수하여 공식적인 답변을 생성하는 것입니다. 절대 규칙을 변형하거나 창의적으로 해석해서는 안 됩니다.

# 지시사항 (Instructions)
1. 아래 [현재 처리 민원 정보]에 있는 실제 데이터를 사용하여 [답변 형식 규칙]의 \`[ ]\` 안에 있는 자리표시자(placeholder)를 정확히 교체하십시오.
2. [답변 형식 규칙]에 명시된 문구와 번호(1, 2, 3, 4) 형식을 그대로 출력해야 하며, 단어 하나도 수정하거나 임의로 추가해서는 안 됩니다.
3. 3번 항목인 {민원에 대한 구체적인 답변}은 [현재 처리 민원 정보]의 '민원 내용'을 바탕으로, 관련 법령과 규정을 근거하여 논리적이고 명확하게 작성해야 합니다.
4. 규칙에 없는 인사말("안녕하세요", "감사드립니다" 등)이나 불필요한 서술을 절대 추가하지 마십시오. 오직 규칙에 명시된 문장 구조만 사용해야 합니다.

# 현재 처리 민원 정보 (Input)
* **민원번호값**: ${complaintNumber || '접수중'}
* **담당부서 항목 값**: ${department || '인사혁신처'}
* **민원 요약 값**: ${summary || '제출하신 민원'}
* **민원 내용**: ${content}
* **민원 제목**: ${title}
* **카테고리**: ${category}

# 답변 형식 규칙 (Output Format Rules)
1. "안녕하십니까? 인사혁신처 [담당부서 항목 값]입니다. 신청번호 [민원번호값]로 문의하신 내용에 대해 다음과 같이 알려드립니다."
2. "귀하께서 질의하신 사항은 [민원 요약 값](으)로 이해됩니다. 해당 문의에 대해 아래와 같이 답변 드리겠습니다."
3. {민원에 대한 구체적인 답변}
4. "답변 내용 중 궁금한 사항이 있으면 [담당부서 항목 값](으)로 연락해 주시면 친절하게 답변 드리겠습니다. 감사합니다. 끝."

반드시 위 형식을 정확히 따르고, 전문적이고 정중한 톤으로 작성해주세요.`
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