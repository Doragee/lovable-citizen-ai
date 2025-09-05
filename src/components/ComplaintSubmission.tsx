import { useState } from "react";
import { Search, Send, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ComplaintSubmission = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [similarComplaints, setSimilarComplaints] = useState<any[]>([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const { toast } = useToast();

  const categories = [
    "성과∙급여",
    "윤리∙복무", 
    "재해∙보상",
    "채용∙임용"
  ];

  const handleSimilarSearch = async () => {
    if (!title.trim() && !content.trim()) {
      toast({
        title: "검색 오류",
        description: "민원 제목 또는 내용을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-similar-complaints', {
        body: { title, content }
      });

      if (error) throw error;

      if (data.similar && data.similar.length > 0) {
        setSimilarComplaints(data.similar);
        setShowSimilarModal(true);
      } else {
        toast({
          title: "검색 완료",
          description: "유사한 민원이 발견되지 않았습니다.",
        });
      }
    } catch (error) {
      console.error('Similar search error:', error);
      toast({
        title: "검색 실패",
        description: "AI 서비스 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!title.trim() || !content.trim() || !category) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-complaint', {
        body: {
          title: title.trim(),
          content: content.trim(),
          category
        }
      });

      if (error) throw error;

      toast({
        title: "민원 접수 완료",
        description: "민원이 성공적으로 접수되었습니다.",
      });

      // Reset form
      setTitle("");
      setContent("");
      setCategory("");

    } catch (error) {
      console.error('Submit complaint error:', error);
      toast({
        title: "접수 실패", 
        description: "AI 서비스 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Edit className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold">민원 접수 (민원인용)</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">접</span>
            </div>
            새로운 민원 접수
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">민원 제목 *</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="민원 제목을 입력해주세요"
            />
          </div>

          <div>
            <Label htmlFor="category">카테고리 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리를 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">민원 내용 *</Label>
            <Textarea 
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="민원 내용을 자세히 입력해주세요"
              className="min-h-32"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleSimilarSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  유사 민원 검색
                </>
              )}
            </Button>
            <Button 
              variant="default"
              className="flex-1"
              onClick={handleSubmitComplaint}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  접수 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  민원 제출
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Similar Complaints Modal */}
      <Dialog open={showSimilarModal} onOpenChange={setShowSimilarModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>유사 민원 검색 결과</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {similarComplaints.map((complaint, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">{complaint.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    유사도: {Math.round(complaint.similarity * 100)}%
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">{complaint.response_content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintSubmission;