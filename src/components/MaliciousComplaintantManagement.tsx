import { useState, useEffect } from "react";
import { AlertTriangle, Users, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaliciousComplaintant {
  civilianid: number;
  complaint_count: number;
  latest_date: string;
  status: string;
}

const MaliciousComplaintantManagement = () => {
  const [maliciousComplaintants, setMaliciousComplaintants] = useState<MaliciousComplaintant[]>([]);
  const [statistics, setStatistics] = useState({
    totalMalicious: 0,
    totalRepeats: 0,
    timeSaved: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMaliciousComplaintants();
  }, []);

  const loadMaliciousComplaintants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-malicious-complainants');
      
      if (error) throw error;

      setMaliciousComplaintants(data.maliciousComplaintants || []);
      setStatistics({
        totalMalicious: data.statistics?.totalMalicious || 0,
        totalRepeats: data.statistics?.totalRepeats || 0,
        timeSaved: data.statistics?.timeSaved || 0
      });

    } catch (error) {
      console.error('Load malicious complainants error:', error);
      toast({
        title: "데이터 로드 실패",
        description: "악성 민원인 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCivilianId = (id: number) => {
    return `박***`;  // 개인정보 보호를 위한 마스킹
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '경고':
        return 'bg-stat-orange';
      case '모니터링':
        return 'bg-warning';
      default:
        return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">악성 민원인 데이터를 분석하는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-stat-red" />
        <h2 className="text-2xl font-bold">악성 민원인 관리 (총괄 담당자용)</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stat-red/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-stat-red" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">이번 달 악성 민원인</p>
                <p className="text-3xl font-bold text-stat-red">{statistics.totalMalicious}명</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stat-orange/10 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-stat-orange" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">반복 민원 건수</p>
                <p className="text-3xl font-bold text-stat-orange">{statistics.totalRepeats}건</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stat-blue/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-stat-blue" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">처리 시간 절약</p>
                <p className="text-3xl font-bold text-stat-blue">{statistics.timeSaved}시간</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Malicious Complainants List */}
      <Card>
        <CardHeader>
          <CardTitle>악성 민원인 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {maliciousComplaintants.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">아직 악성 민원으로 식별된 ID가 없습니다.</h3>
              <p className="text-muted-foreground">
                시스템이 지속적으로 민원 패턴을 분석하여 악성 민원인을 탐지합니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>민원인</TableHead>
                  <TableHead>반복 횟수</TableHead>
                  <TableHead>최근 접수일</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maliciousComplaintants.map((complainant, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {formatCivilianId(complainant.civilianid)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{complainant.complaint_count}회</span>
                    </TableCell>
                    <TableCell>
                      {new Date(complainant.latest_date).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(complainant.status)}>
                        {complainant.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>월별 반복 민원 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/30 rounded flex items-center justify-center">
            <p className="text-muted-foreground">차트 데이터 로딩 중...</p>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-info rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">실</span>
            </div>
            실시간 알림
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-warning/10 rounded">
              <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
              <div>
                <p className="font-medium">박*** 님 12번째 반복 민원 접수</p>
                <p className="text-sm text-muted-foreground">방금 전</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-info/10 rounded">
              <div className="w-2 h-2 bg-info rounded-full mt-2"></div>
              <div>
                <p className="font-medium">이*** 님 8번째 반복 민원 접수</p>
                <p className="text-sm text-muted-foreground">2분 전</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-success/10 rounded">
              <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
              <div>
                <p className="font-medium">AI 분석: 세종시 패턴 감지</p>
                <p className="text-sm text-muted-foreground">5분 전</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaliciousComplaintantManagement;