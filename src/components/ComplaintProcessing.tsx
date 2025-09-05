import { useState, useEffect } from "react";
import { MessageSquare, Bot, FileText, CheckCircle, X } from "lucide-react";
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
  const [responseContent, setResponseContent] = useState("");
  const [showChatbotPanel, setShowChatbotPanel] = useState(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLatestComplaint();
  }, []);

  const loadLatestComplaint = async () => {
    try {
      const { data, error } = await supabase
        .from('civilcomplaint')
        .select('*')
        .eq('status', '0')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - no pending complaints
          setCurrentComplaint(null);
          return;
        }
        throw error;
      }
      setCurrentComplaint(data);
    } catch (error) {
      console.error('Load complaint error:', error);
      setCurrentComplaint(null);
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
          category: currentComplaint.category,
          complaintNumber: currentComplaint.complaint_number,
          department: currentComplaint.department,
          summary: currentComplaint.summary
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

  const handleResponseSubmit = async () => {
    if (!responseContent.trim()) {
      toast({
        title: "오류",
        description: "답변 내용을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const { error } = await supabase
        .from('civilcomplaint')
        .update({
          response_content: responseContent,
          status: '1'
        })
        .eq('id', currentComplaint.id);

      if (error) throw error;

      toast({
        title: "답변 제출 완료",
        description: "민원 답변이 성공적으로 제출되었습니다.",
      });

      // Refresh the complaint data
      loadLatestComplaint();
      setResponseContent("");
    } catch (error) {
      console.error('Response submission error:', error);
      toast({
        title: "답변 제출 실패",
        description: "답변 제출 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  if (!currentComplaint) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">처리할 민원이 없습니다</p>
          <p className="text-muted-foreground">모든 민원이 처리 완료되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold">민원 처리 (담당자용)</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-3 space-y-6">
          {/* Current Complaint Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                현재 처리 민원
                <Badge variant={currentComplaint.status === '1' ? 'default' : 'outline'}>
                  {currentComplaint.status === '1' ? '처리완료' : '진행중'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>민원번호</Label>
                  <Input value={String(currentComplaint.complaint_number)} disabled className="bg-muted" />
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
            </CardContent>
          </Card>

          {/* Response Content Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                답변 내용 기재
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>답변 내용</Label>
                <Textarea 
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  placeholder="민원에 대한 답변을 입력하세요..."
                  className="min-h-32"
                  disabled={currentComplaint.status === '1'}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => setResponseContent("")}
                  variant="outline"
                  disabled={currentComplaint.status === '1' || isSubmittingResponse}
                >
                  임시저장
                </Button>
                <Button 
                  onClick={handleResponseSubmit}
                  disabled={!responseContent.trim() || currentComplaint.status === '1' || isSubmittingResponse}
                  className="flex-1"
                >
                  {isSubmittingResponse ? "제출 중..." : "답변 제출"}
                </Button>
              </div>

              {currentComplaint.response_content && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">기존 답변 내용</Label>
                  <p className="text-sm mt-2">{currentComplaint.response_content}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Related Legal Information */}
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleAIRecommendation}
                    disabled={isLoadingAI}
                  >
                    {isLoadingAI ? "생성 중..." : "AI 답변 생성"}
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full bg-info hover:bg-info/90"
                    onClick={() => setShowChatbotPanel(true)}
                  >
                    AI 챗봇 문의
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Complaints Search Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">유사 민원 검색 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-xs border-b pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">2024-SJ-6543</span>
                    <span className="text-orange-500 font-bold">89%</span>
                  </div>
                  <p className="text-muted-foreground mb-1">청년주택건설사업 신청 방법 문의</p>
                  <p className="text-xs text-muted-foreground">처리일: 2024.11.15</p>
                </div>
                
                <div className="text-xs border-b pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">2024-SJ-5234</span>
                    <span className="text-blue-500 font-bold">76%</span>
                  </div>
                  <p className="text-muted-foreground mb-1">청년주택 지원요건 확인</p>
                  <p className="text-xs text-muted-foreground">처리일: 2024.11.10</p>
                </div>

                <Button variant="outline" size="sm" className="w-full mt-3">
                  더 보기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Answer Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI 답변 추천
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {aiRecommendation ? (
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">AI 생성 답변</h4>
                    <div className="text-blue-700 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {aiRecommendation}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">추천 답변 조치</h4>
                      <p className="text-blue-700 text-xs">
                        AI 답변 생성 후 여기에 표시됩니다.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">참고 법령</h4>
                      <p className="text-green-700 text-xs">
                        AI 분석 후 관련 법령이 표시됩니다.
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowAIRecommendation(true)}
                    disabled={!aiRecommendation}
                  >
                    상세 보기
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setResponseContent(aiRecommendation || "")}
                    disabled={currentComplaint.status === '1' || !aiRecommendation}
                  >
                    답변 적용
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chatbot Side Panel */}
      {showChatbotPanel && (
        <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">AI 법령 챗봇</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChatbotPanel(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 p-0">
            <iframe
              src="https://law.go.kr/LSW/aai/main.do"
              className="w-full h-full border-0"
              title="AI 법령 챗봇"
            />
          </div>
        </div>
      )}

      {/* AI Recommendation Modal */}
      <Dialog open={showAIRecommendation} onOpenChange={setShowAIRecommendation}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI 답변 추천 - 상세 보기
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {aiRecommendation ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800">생성된 답변</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {aiRecommendation}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">AI 답변이 생성되지 않았습니다.</p>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAIRecommendation(false)}
              >
                닫기
              </Button>
              <Button 
                onClick={() => {
                  setResponseContent(aiRecommendation || "");
                  setShowAIRecommendation(false);
                }}
                disabled={!aiRecommendation || currentComplaint.status === '1'}
              >
                답변 적용
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintProcessing;