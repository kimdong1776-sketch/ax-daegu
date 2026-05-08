import { motion } from "motion/react";
import { Gavel, HelpCircle, ChevronDown, AlertTriangle, ShieldCheck, FileText, Globe, Library, Wrench, Lightbulb, Target } from "lucide-react";
import { AIAnalysis } from "../types";
import { useState } from "react";

interface ResultScreenProps {
  key?: string;
  analysis: AIAnalysis;
  onRefine: () => void;
  onSubmit: () => void;
}

export function ResultScreen({ analysis, onRefine, onSubmit }: ResultScreenProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const iconMap: Record<string, any> = {
    target: Target,
    public: Globe,
    library_books: Library,
    build: Wrench,
    lightbulb: Lightbulb,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40">
        <div className="max-w-2xl mx-auto h-full flex items-center justify-between px-4">
          <div className="text-brand-blue opacity-50"><Gavel size={24} /></div>
          <h1 className="text-lg font-bold">이의 있소!</h1>
          <button className="text-brand-blue"><HelpCircle size={24} /></button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full pt-24 pb-48 px-6 flex flex-col gap-8">
        <section className="text-center space-y-2">
          <h2 className="text-3xl font-black leading-tight">
            시민님의 소중한 의견이<br />정책 제안서로 다듬어졌습니다.
          </h2>
          <p className="text-gray-500 text-sm">
            입력하신 내용을 바탕으로 분석한 정책 초안을 확인해보세요.
          </p>
        </section>

        {/* Policy Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-orange-50/50 border border-brand-orange/30 rounded-2xl p-5 flex flex-col gap-3 relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">정책 분석 결과</span>
                <h3 className="text-xl font-bold">정책 구체화 수준</h3>
              </div>
              <span className="text-3xl font-black text-brand-success">{analysis.structuringLevel}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${analysis.structuringLevel}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-brand-success h-full rounded-full" 
              />
            </div>
            <p className="text-xs text-gray-500">
              시민님의 생각이 정책의 모습을 갖춰가고 있습니다. 대화를 통해 더 멋진 제안서로 완성할 수 있어요!
            </p>
            
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white border border-brand-orange/40 rounded-full px-4 py-1.5 flex items-center gap-1 shadow-md hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-bold text-brand-orange uppercase">{isExpanded ? "접기" : "내용 보기"}</span>
              <ChevronDown size={16} className={`text-brand-orange transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          <motion.div
            initial={false}
            animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="pt-10 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">분야</label>
                  <p className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-medium">{analysis.draft.category}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">영향 대상</label>
                  <p className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-medium">{analysis.draft.target}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">핵심 문제</label>
                <p className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm leading-relaxed">{analysis.draft.problem}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">개선 방향</label>
                <p className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm leading-relaxed">{analysis.draft.direction}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900">정제 지표</h4>
                {analysis.metrics.map((m) => {
                  const Icon = iconMap[m.icon] || Target;
                  return (
                    <div key={m.label} className="flex items-center gap-4">
                      <span className="text-xs font-medium text-gray-500 w-20">{m.label}</span>
                      <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-success h-full" style={{ width: `${m.value}%` }} />
                      </div>
                      <div className="flex items-center gap-1 w-12 justify-end">
                         <Icon size={12} className="text-gray-400" />
                         <span className="text-[10px] font-bold text-gray-900">{m.value}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Diagnosis Box */}
        <div className={`border-2 rounded-2xl p-6 flex items-start gap-4 shadow-sm transition-colors duration-500 ${analysis.structuringLevel < 75 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-brand-blue/20'}`}>
          <div className={`flex-shrink-0 bg-white rounded-full p-2 shadow-sm border ${analysis.structuringLevel < 75 ? 'border-orange-100' : 'border-blue-100'}`}>
            {analysis.structuringLevel < 75 ? <AlertTriangle className="text-orange-500" /> : <ShieldCheck className="text-brand-blue" />}
          </div>
          <div className="space-y-1">
            <p className={`font-bold text-sm flex items-center gap-1 ${analysis.structuringLevel < 75 ? 'text-orange-900' : 'text-blue-900'}`}>
              진단 결과: {analysis.structuringLevel < 75 ? '성장 가능성 높음' : '완성도 높음'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              {analysis.diagnostic}
            </p>
          </div>
        </div>

        {/* Floating actions */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-brand-ivory via-brand-ivory/95 to-transparent z-40">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            <button
              onClick={onRefine}
              className="w-full bg-brand-blue text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
            >
              이의 있소!! (내 의견 보완하기)
            </button>
            <button
              onClick={onSubmit}
              className="w-full bg-white text-gray-500 border border-gray-200 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              이대로 제출하기 (시민 의견 기부하기)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
