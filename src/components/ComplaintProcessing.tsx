import { useState, useEffect } from "react";
import { MessageSquare, Bot, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ComplaintProcessing = () => {
  const [currentComplaint, setCurrentComplaint] = useState<any>(null);
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLatestComplaint();
  }, []);

  const loadLatestComplaint = async () => {
    try {
      const { data, error } = await supabase
        .from('civilcomplaint')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setCurrentComplaint(data);
    } catch (error) {
      console.error('Load complaint error:', error);
    }
  };

  const handleAIRecommendation = async () => {
    if (!currentComplaint) {
      toast({
        title: "오류",
        description: "처리할 민원이 없습니다.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-response', {
        body: {
          title: currentComplaint.title,
          content: currentComplaint.request_content,
          category: currentComplaint.category
        }
      });

      if (error) throw error;

      setAiRecommendation(data.recommendation);
      setShowAIRecommendation(true);
    } catch (error) {
      console.error('AI recommendation error:', error);
      toast({
        title: "AI 답변 생성 실패",
        description: "AI 서비스 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");

    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatbot-query', {
        body: {
          message: chatInput,
          context: currentComplaint
        }
      });

      if (error) throw error;

      const aiMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast({
        title: "챗봇 오류",
        description: "AI 서비스 연결에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (!currentComplaint) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">처리할 민원을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold">민원 처리 (담당자용)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Complaint Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                현재 처리 민원
                <Badge variant="outline">진행중</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>민원번호</Label>
                  <Input value={`2024-SJ-${currentComplaint.id}`} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>접수일</Label>
                  <Input 
                    value={new Date(currentComplaint.created_at).toLocaleDateString('ko-KR')} 
                    disabled 
                    className="bg-muted" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>민원인</Label>
                  <Input value={`김***`} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>담당부서</Label>
                  <Input value={currentComplaint.department || "미배정"} disabled className="bg-muted" />
                </div>
              </div>

              <div>
                <Label>민원 제목</Label>
                <Input value={currentComplaint.title} disabled className="bg-muted" />
              </div>

              <div>
                <Label>카테고리</Label>
                <Input value={currentComplaint.category} disabled className="bg-muted" />
              </div>

              <div>
                <Label>민원 요약</Label>
                <Textarea 
                  value={currentComplaint.summary || "요약 생성 중..."} 
                  disabled 
                  className="bg-muted min-h-20"
                />
              </div>

              <div>
                <Label>민원 내용</Label>
                <Textarea 
                  value={currentComplaint.request_content} 
                  disabled 
                  className="bg-muted min-h-32"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleAIRecommendation}
                  disabled={isLoadingAI}
                >
                  {isLoadingAI ? "생성 중..." : "상세 보기"}
                </Button>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="default"
                      className="flex-1 bg-info hover:bg-info/90"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      AI 챗봇 문의
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-96">
                    <SheetHeader>
                      <SheetTitle>AI 챗봇 상담</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col h-full mt-6">
                      <div className="flex-1 space-y-3 overflow-y-auto">
                        {chatMessages.map((message, index) => (
                          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              message.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              {message.content}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Input 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="민원 관련 질문을 입력하세요..."
                          onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                          disabled={isLoadingAI}
                        />
                        <Button onClick={handleChatSubmit} disabled={isLoadingAI}>
                          전송
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">관</span>
                </div>
                관련 법령 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-accent/10 rounded">
                  <h4 className="font-medium text-accent">주택법 제23조</h4>
                  <p className="text-xs text-muted-foreground mt-1">청년주택 공급</p>
                </div>
                
                <div className="p-3 bg-accent/10 rounded">
                  <h4 className="font-medium text-accent">주택공급 시행령 제29조</h4>
                  <p className="text-xs text-muted-foreground mt-1">청년주택 지원 기준</p>
                </div>

                <div className="p-3 bg-accent/10 rounded">
                  <h4 className="font-medium text-accent">세종시 청년도덕 조례</h4>
                  <p className="text-xs text-muted-foreground mt-1">공급 및 운영 규정</p>
                </div>

                <div className="space-y-2 mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    상세 보기
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full bg-info hover:bg-info/90"
                    onClick={() => window.open('https://law.go.kr/LSW/aai/main.do', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')}
                  >
                    AI 챗봇 문의
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">유사 민원 검색 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs">
                  <div className="flex justify-between">
                    <span>2024-SI-6543</span>
                    <span className="text-stat-orange">89%</span>
                  </div>
                  <p className="text-muted-foreground">청년주택건설사업 신청 방법 문의</p>
                  <p className="text-xs text-muted-foreground">처리일: 2024.11.15</p>
                </div>
                
                <div className="text-xs">
                  <div className="flex justify-between">
                    <span>2024-SI-5234</span>
                    <span className="text-stat-blue">76%</span>
                  </div>
                  <p className="text-muted-foreground">청년주택 지원요건 확인</p>
                  <p className="text-xs text-muted-foreground">처리일: 2024.11.10</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Recommendation Modal */}
      <Dialog open={showAIRecommendation} onOpenChange={setShowAIRecommendation}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              관련 법령 상세 정보
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-accent">주택법 제23조 (청년주택 공급)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  제23조 국가 및 지방자치단체는 청년의 주거안정을 위하여 다음 각 호의 사업을 추진할 수 있다.
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>청년을 위한 임대주택의 우선 공급</li>
                  <li>청년 주거비 지원사업 지원</li>
                  <li>청년 주택 구입 자금 지원</li>
                  <li>그 밖에 청년 주거안정을 위해 필요한 사업</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-accent">주택공급 시행령 제29조</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  제29조 법 제23조에 따라 청년주택 지원의 기준은 다음과 같다.
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>지원 대상: 만 19세 이상 39세 이하</li>
                  <li>소득 기준: 도시근로자 가구당 월평균 소득 120% 이하</li>
                  <li>무주택 요건: 신청일 기준 무주택자</li>
                </ol>
              </CardContent>
            </Card>

            <div className="bg-muted/50 p-4 rounded">
              <p className="text-xs text-muted-foreground">
                <strong>안내:</strong> 법령 정보는 국가법령정보센터(law.go.kr)에서 제공되며, 최신 개정 내용은 해당 사이트에서 확인하시기 바랍니다.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintProcessing;