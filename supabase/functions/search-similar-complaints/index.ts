import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// 카테고리 정의
const CATEGORIES = {
  "성과∙급여": "성과평가, 급여관리, 승진심사, 여비, 출장비, 수당, 보수, 연봉, 성과금",
  "윤리∙복무": "징계, 복무, 공직윤리, 근무시간, 휴가, 병가, 청렴, 이해충돌",
  "재해∙보상": "공무원 재해보상, 안전정책, 공무상 재해, 산업재해, 사고, 재해",
  "채용∙임용": "국가공무원 채용시험, 임용제도, 시험문제, 채용제도, 국가직 시험, 공채, 경채, 면접, 필기시험"
};
// OpenAI API 호출 함수 - gpt-4o-mini 전용
async function callOpenAI(messages, model = "gpt-4o-mini", temperature = 0) {
  const rawApiKey = Deno.env.get('chatgpt') ?? Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('OPEN_AI_KEY');
  
  // API 키 유효성 검사
  if (!rawApiKey || typeof rawApiKey !== 'string') {
    console.error('OPEN_AI_KEY 환경 변수가 설정되지 않았거나 유효하지 않습니다.');
    throw new Error('OpenAI API key not found or invalid');
  }
  
  // API 키 정리 (공백, 개행 문자 제거)
  const apiKey = rawApiKey.trim();
  
  if (apiKey.length === 0) {
    console.error('OPEN_AI_KEY가 빈 문자열입니다.');
    throw new Error('OpenAI API key is empty');
  }
  
  // API 키 형식 기본 검증 (sk-로 시작하는지)
  if (!apiKey.startsWith('sk-')) {
    console.error('OPEN_AI_KEY 형식이 올바르지 않습니다.');
    throw new Error('OpenAI API key format is invalid');
  }
  const requestBody = {
    model,
    messages,
    temperature
  };
  // gpt-4o-mini는 JSON mode를 지원하므로 항상 추가
  requestBody.response_format = {
    type: "json_object"
  };
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error details:', errorText);
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  const data = await response.json();
  // 응답 검증
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Invalid OpenAI response structure:', data);
    throw new Error('Invalid response from OpenAI API');
  }
  return data;
}
// 임베딩 생성 함수
async function getEmbedding(text) {
  const rawApiKey = Deno.env.get('chatgpt') ?? Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('OPEN_AI_KEY');
  
  // API 키 유효성 검사
  if (!rawApiKey || typeof rawApiKey !== 'string') {
    console.error('OPEN_AI_KEY 환경 변수가 설정되지 않았거나 유효하지 않습니다.');
    throw new Error('OpenAI API key not found or invalid');
  }
  
  // API 키 정리 (공백, 개행 문자 제거)
  const apiKey = rawApiKey.trim();
  
  if (apiKey.length === 0) {
    console.error('OPEN_AI_KEY가 빈 문자열입니다.');
    throw new Error('OpenAI API key is empty');
  }
  
  // API 키 형식 기본 검증 (sk-로 시작하는지)
  if (!apiKey.startsWith('sk-')) {
    console.error('OPEN_AI_KEY 형식이 올바르지 않습니다.');
    throw new Error('OpenAI API key format is invalid');
  }
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small"
    })
  });
  if (!response.ok) {
    throw new Error(`OpenAI Embedding API error: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data[0].embedding;
}
// 카테고리 분류 함수 
async function classifyCategory(text) {
  const validCategories = [
    "성과∙급여",
    "윤리∙복무",
    "재해∙보상",
    "채용∙임용"
  ];
  // 더 명확한 시스템 프롬프트
  const systemPrompt = `당신은 민원 카테고리 분류 전문가입니다.
다음 질문을 정확히 4개 카테고리 중 하나로 분류하고, 반드시 아래 JSON 형식으로만 응답하세요.

카테고리:
1. 성과∙급여: 성과평가, 급여관리, 승진심사, 출장비, 수당, 보수, 연봉, 성과금
2. 윤리∙복무: 징계, 복무, 공직윤리, 근무시간, 휴가, 병가, 청렴, 이해충돌  
3. 재해∙보상: 공무원 재해보상, 안전정책, 공무상 재해, 산업재해, 사고, 재해
4. 채용∙임용: 국가공무원 채용시험, 임용제도, 시험문제, 채용제도, 국가직 시험, 공채, 경채, 면접, 필기시험

응답 형식 (이 형식을 정확히 지켜주세요):
{"category": "카테고리명", "confidence": 0.95}

중요: category는 반드시 위 4개 중 하나여야 하고, confidence는 0~1 사이 숫자입니다.`;
  try {
    const response = await callOpenAI([
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `다음 민원을 분류해주세요: "${text}"`
      }
    ]);
    // 응답 검증
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('OpenAI 응답 구조가 올바르지 않습니다');
    }
    const content = response.choices[0].message.content.trim();
    console.log('OpenAI 원본 응답:', content);
    // JSON 파싱
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      console.error('파싱 시도한 내용:', content);
      // 간단한 fallback: 기본값 반환
      return {
        category: "",
        confidence: 0
      };
    }
    // 카테고리 검증
    if (!result.category || !validCategories.includes(result.category)) {
      console.warn('유효하지 않은 카테고리:', result.category);
      return {
        category: "",
        confidence: 0
      };
    }
    // confidence 검증 및 보정
    const confidence = typeof result.confidence === 'number' ? result.confidence : 0;
    const validConfidence = Math.max(0, Math.min(1, confidence));
    console.log(`분류 결과: ${result.category} (신뢰도: ${validConfidence})`);
    return {
      category: result.category,
      confidence: validConfidence
    };
  } catch (error) {
    console.error('카테고리 분류 중 오류:', error);
    console.error('Error details:', error.message);
    return {
      category: "",
      confidence: 0
    };
  }
}
// Supabase RPC 호출 함수
async function callSupabaseRPC(supabaseClient, functionName, params) {
  try {
    const { data, error } = await supabaseClient.rpc(functionName, params);
    if (error) {
      console.error(`Supabase RPC ${functionName} 오류:`, error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error(`RPC ${functionName} 호출 중 오류:`, error);
    return [];
  }
}
// 카테고리별 모든 임베딩 타입 검색
async function searchByCategoryWithAllEmbeddings(supabaseClient, queryEmbedding, category, topK, threshold) {
  const allResults = [];
  // Title 임베딩 검색
  const titleResults = await callSupabaseRPC(supabaseClient, 'match_documents_by_category', {
    query_embedding: queryEmbedding,
    target_category: category,
    match_count: topK,
    match_threshold: threshold
  });
  titleResults.forEach((item)=>{
    item.source_type = 'title';
  });
  allResults.push(...titleResults);
  // Content 임베딩 검색 (카테고리 필터링)
  const contentResults = await callSupabaseRPC(supabaseClient, 'match_documents_by_content', {
    query_embedding: queryEmbedding,
    match_count: topK * 2,
    match_threshold: threshold
  });
  const filteredContent = contentResults.filter((item)=>item.category === category).slice(0, topK).map((item)=>({
      ...item,
      source_type: 'content'
    }));
  allResults.push(...filteredContent);
  // Summary 임베딩 검색
  const summaryResults = await callSupabaseRPC(supabaseClient, 'match_documents_by_category_summary', {
    query_embedding: queryEmbedding,
    target_category: category,
    match_count: topK,
    match_threshold: threshold
  });
  summaryResults.forEach((item)=>{
    item.source_type = 'summary';
  });
  allResults.push(...summaryResults);
  return allResults;
}
// 전체 임베딩 검색
async function searchAllEmbeddings(supabaseClient, queryEmbedding, topK, threshold) {
  const allResults = [];
  // Title 임베딩 검색
  const titleResults = await callSupabaseRPC(supabaseClient, 'match_documents_by_title', {
    query_embedding: queryEmbedding,
    match_count: topK,
    match_threshold: threshold
  });
  titleResults.forEach((item)=>{
    item.source_type = 'title';
  });
  allResults.push(...titleResults);
  // Content 임베딩 검색
  const contentResults = await callSupabaseRPC(supabaseClient, 'match_documents_by_content', {
    query_embedding: queryEmbedding,
    match_count: topK,
    match_threshold: threshold
  });
  contentResults.forEach((item)=>{
    item.source_type = 'content';
  });
  allResults.push(...contentResults);
  // Summary 임베딩 검색
  const summaryResults = await callSupabaseRPC(supabaseClient, 'match_documents_by_summary', {
    query_embedding: queryEmbedding,
    match_count: topK,
    match_threshold: threshold
  });
  summaryResults.forEach((item)=>{
    item.source_type = 'summary';
  });
  allResults.push(...summaryResults);
  return allResults;
}
// Reciprocal Rank Fusion (RRF) 리랭킹
function reciprocalRankFusion(results, topK, rrfK = 60) {
  if (!results.length) return [];
  // 소스별로 결과 분리 및 정렬
  const sourceRankings = {};
  for (const result of results){
    const sourceType = result.source_type || 'unknown';
    if (!sourceRankings[sourceType]) {
      sourceRankings[sourceType] = [];
    }
    sourceRankings[sourceType].push(result);
  }
  // 각 소스별로 유사도 순으로 정렬
  for(const source in sourceRankings){
    sourceRankings[source].sort((a, b)=>(b.similarity || 0) - (a.similarity || 0));
  }
  // RRF 점수 계산
  const rrfScores = {};
  const docData = {};
  for (const [source, ranking] of Object.entries(sourceRankings)){
    ranking.forEach((doc, index)=>{
      const rank = index + 1;
      const docId = doc.id;
      // RRF 공식: 1 / (k + rank)
      const scoreContribution = 1.0 / (rrfK + rank);
      if (!rrfScores[docId]) {
        rrfScores[docId] = {
          total_score: 0,
          source_scores: {},
          source_count: 0,
          max_similarity: 0,
          similarities: []
        };
        docData[docId] = doc;
      }
      rrfScores[docId].total_score += scoreContribution;
      rrfScores[docId].source_scores[source] = scoreContribution;
      rrfScores[docId].similarities.push(doc.similarity || 0);
      rrfScores[docId].max_similarity = Math.max(rrfScores[docId].max_similarity, doc.similarity || 0);
    });
  }
  // 추가 메트릭 계산 및 정렬
  const sortedDocs = Object.entries(rrfScores).map(([docId, scores])=>{
    const sourceCount = Object.keys(scores.source_scores).length;
    const diversityWeight = 1 + (sourceCount - 1) * 0.1; // 각 추가 소스당 10% 보너스
    const finalRrfScore = scores.total_score * diversityWeight;
    return {
      docId,
      finalRrfScore,
      sourceCount,
      maxSimilarity: scores.max_similarity,
      avgSimilarity: scores.similarities.reduce((a, b)=>a + b, 0) / scores.similarities.length,
      scoreDetails: {
        rrf_base: scores.total_score,
        sources: Object.keys(scores.source_scores),
        source_scores: scores.source_scores
      }
    };
  }).sort((a, b)=>b.finalRrfScore - a.finalRrfScore).slice(0, topK);
  // 최종 결과 구성
  return sortedDocs.map(({ docId, finalRrfScore, sourceCount, maxSimilarity, avgSimilarity, scoreDetails })=>({
      ...docData[docId],
      rrf_score: finalRrfScore,
      source_count: sourceCount,
      max_similarity: maxSimilarity,
      score_details: scoreDetails
    }));
}
// 메인 검색 함수
async function enhancedComplaintSearch(supabaseClient, text, searchType = 'category_first', matchCount = 3, matchThreshold = 0.5) {
  console.log(`검색 시작: ${text}`);
  // 1. 카테고리 분류
  const { category, confidence } = await classifyCategory(text);
  console.log(`분류된 카테고리: ${category} (신뢰도: ${confidence})`);
  // 2. 임베딩 생성
  const queryEmbedding = await getEmbedding(text);
  let rawResults = [];
  let strategy = "";
  // 3. 검색 전략 결정
  if (confidence >= 0.8 && category && searchType === 'category_first') {
    console.log(`${category} 카테고리에서 검색 중...`);
    rawResults = await searchByCategoryWithAllEmbeddings(supabaseClient, queryEmbedding, category, matchCount, matchThreshold);
    const maxSim = rawResults.length > 0 ? Math.max(...rawResults.map((r)=>r.similarity || 0)) : 0;
    if (maxSim >= 0.7) {
      strategy = "category_high_match_rrf";
    } else {
      strategy = "category_low_match_rrf";
      console.log("추가로 전체 검색 수행...");
      const additionalResults = await searchAllEmbeddings(supabaseClient, queryEmbedding, matchCount, matchThreshold);
      rawResults.push(...additionalResults);
    }
  } else {
    console.log("전체 카테고리에서 검색 중...");
    strategy = "direct_all_search_rrf";
    rawResults = await searchAllEmbeddings(supabaseClient, queryEmbedding, matchCount, matchThreshold);
  }
  console.log(`검색된 원시 결과: ${rawResults.length}건`);
  // 4. RRF 리랭킹
  const finalResults = reciprocalRankFusion(rawResults, matchCount);
  console.log(`RRF 후 최종 결과: ${finalResults.length}건`);
  return {
    category,
    confidence,
    strategy,
    similarComplaints: finalResults,
    totalFound: rawResults.length
  };
}
// 메인 서버 핸들러
serve(async (req)=>{
  console.log('=== Edge Function 시작 ===');
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const apiKey = Deno.env.get('chatgpt') ?? Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('OPEN_AI_KEY');
    console.log('환경 변수 확인:', {
      hasChatGPT: !!Deno.env.get('chatgpt'),
      hasOpenAI: !!Deno.env.get('OPENAI_API_KEY'),
      hasOpenAILegacy: !!Deno.env.get('OPEN_AI_KEY'),
      apiKeyLength: apiKey?.length || 0,
      apiKeyValid: apiKey?.trim().startsWith('sk-') || false,
      hasSupabase: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseAnon: !!Deno.env.get('SUPABASE_ANON_KEY')
    });
    // Supabase 클라이언트 초기화
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const body = await req.json();
    console.log('받은 요청 body:', JSON.stringify(body, null, 2));
    const { text, title, content, searchType = 'category_first', matchCount = 3, matchThreshold = 0.5 } = body;
    
    // text가 없으면 content나 title을 사용
    const searchText = text || content || title;
    
    if (!searchText?.trim()) {
      console.log('텍스트 없음');
      return new Response(JSON.stringify({
        error: '검색할 텍스트를 입력해주세요.'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('검색 텍스트:', searchText);
    console.log('임베딩 생성 시도...');
    // 향상된 검색 수행 - text 대신 searchText 사용
    const result = await enhancedComplaintSearch(supabaseClient, searchText, searchType, matchCount, matchThreshold);
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('검색 중 오류 발생:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      error: '검색 중 오류가 발생했습니다.',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});