import { useState } from "react";
import { Lightbulb, Home, Edit, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ComplaintSubmission from "@/components/ComplaintSubmission";
import ComplaintProcessing from "@/components/ComplaintProcessing";
import MaliciousComplaintantManagement from "@/components/MaliciousComplaintantManagement";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-system-bg">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">AI 기반 지능형 민원 관리 시스템</h1>
              <p className="text-sm opacity-90">
                3조 팀 프로젝트 - 어인영(동계청), 곽영(교신신), 이희진(민시혁신처), 지성준(국세청)
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              onClick={() => setActiveTab("overview")}
            >
              <Home className="w-4 h-4 mr-2" />
              시스템 개요
            </Button>
            <Button
              variant={activeTab === "submit" ? "default" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              onClick={() => setActiveTab("submit")}
            >
              <Edit className="w-4 h-4 mr-2" />
              민원 접수
            </Button>
            <Button
              variant={activeTab === "process" ? "default" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              onClick={() => setActiveTab("process")}
            >
              <Search className="w-4 h-4 mr-2" />
              민원 처리
            </Button>
            <Button
              variant={activeTab === "manage" ? "default" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              onClick={() => setActiveTab("manage")}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              악성 민원인 관리
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-8 h-8 text-warning" />
              <h2 className="text-2xl font-bold text-foreground">AI 기반 지능형 민원 관리 시스템</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Composition */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">팀</span>
                  </div>
                  <h3 className="font-bold text-lg">팀 구성</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">팀 대표: 어인영 (동계청)</p>
                  </div>
                  <div>
                    <p className="font-medium">팀원:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                      <li>곽영 (교신신)</li>
                      <li>이희진 (민시혁신처)</li>
                      <li>지성준 (국세청)</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Core Issues */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-stat-red rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">!</span>
                  </div>
                  <h3 className="font-bold text-lg">핵심 문제</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• 유사 민원 반복 처리로 인한 비효율성</li>
                  <li>• 악의적 반복 민원으로 인한 행정 낭비</li>
                  <li>• 수작업 담당자 배정으로 인한 처리 지연</li>
                  <li>• 민원인의 유사 민원 검색 불가능</li>
                </ul>
              </Card>

              {/* AI Solutions */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">AI</span>
                  </div>
                  <h3 className="font-bold text-lg">AI 기반 해결방안</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">자동화 기능</h4>
                    <ul className="text-xs space-y-1">
                      <li>• AI 기반 담당자 자동 배정</li>
                      <li>• 유사 민원 즉시 검색 및 답변 제공</li>
                      <li>• 반복 민원인 자동 식별 및 추적</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">지원 기능</h4>
                    <ul className="text-xs space-y-1">
                      <li>• 국가법령정보센터 연동</li>
                      <li>• AI 답변 초안 생성</li>
                      <li>• 민원 지식 기반 확장</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* AI Game Points */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">🎯</span>
                  </div>
                  <h3 className="font-bold text-lg">AI 게임 포인트 (4단계)</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { step: "1", title: "민원 접수", desc: "유사 민원 즉시 탐색" },
                    { step: "2", title: "답변 배정", desc: "AI 기반 자동 배정" },
                    { step: "3", title: "답변 작성", desc: "가이드라인 게시" },
                    { step: "4", title: "악성 탐지", desc: "패턴 분석 및 발견" }
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-accent text-white rounded-full flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <h4 className="font-medium text-xs mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "submit" && <ComplaintSubmission />}
        {activeTab === "process" && <ComplaintProcessing />}
        {activeTab === "manage" && <MaliciousComplaintantManagement />}
      </main>
    </div>
  );
};

export default Index;