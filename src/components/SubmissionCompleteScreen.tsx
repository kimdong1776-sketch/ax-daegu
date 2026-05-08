import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gavel, CheckCircle2, RefreshCcw, TrendingUp, ChevronDown, Target, Globe, Library, Wrench, Lightbulb } from "lucide-react";
import { AIAnalysis } from "../types";

interface SubmissionCompleteScreenProps {
  key?: string;
  analysis: AIAnalysis;
  onReset: () => void;
}

export function SubmissionCompleteScreen({ analysis, onReset }: SubmissionCompleteScreenProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const iconMap: Record<string, any> = {
    target: Target,
    public: Globe,
    library_books: Library,
    build: Wrench,
    lightbulb: Lightbulb,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <header className="flex-shrink-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Gavel size={20} className="text-brand-blue" fill="currentColor" />
          <h1 className="text-lg font-black text-brand-blue">이의있소!</h1>
        </div>
        <div className="bg-blue-50 text-brand-blue text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
          초안 <span className="w-1.5 h-1.5 bg-brand-blue rounded-full" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6 flex flex-col items-center pt-12 pb-32">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-20 h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-500 mb-8"
        >
          <CheckCircle2 size={40} className="fill-green-50 shadow-sm" />
        </motion.div>

        <section className="text-center mb-10">
          <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
            당신의 제안이<br />당당한 정책이 되었습니다!
          </h2>
          <p className="text-sm text-gray-400">시민님의 목소리가 대구를 바꿉니다.</p>
        </section>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6 flex flex-col gap-6 relative"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-brand-success">
              <TrendingUp size={16} />
              <span className="text-xs font-bold">정책 구조화 수준</span>
            </div>
            <span className="text-xl font-black text-brand-blue">{analysis.structuringLevel}%</span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-brand-blue uppercase tracking-tighter">
              {analysis.draft.category} (분석 완료)
            </span>
            <h3 className="text-lg font-black text-gray-900 leading-snug">
              {analysis.draft.problem}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400">타겟 대상</span>
              <p className="text-xs font-bold text-gray-700">{analysis.draft.target}</p>
            </div>
            <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-brand-blue">해결 방향</span>
              <p className="text-[11px] font-bold text-brand-blue leading-relaxed">
                {analysis.draft.direction}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-gray-100 pt-4"
              >
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase">정제 상세 지표</h4>
                  {analysis.metrics.map((m) => {
                    const Icon = iconMap[m.icon] || Target;
                    return (
                      <div key={m.label} className="flex items-center gap-4">
                        <span className="text-[11px] font-bold text-gray-500 w-24">{m.label}</span>
                        <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-brand-success h-full" style={{ width: `${m.value}%` }} />
                        </div>
                        <div className="flex items-center gap-1 w-12 justify-end">
                          <Icon size={12} className="text-gray-400" />
                          <span className="text-[11px] font-black text-gray-900">{m.value}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-gray-400 flex items-center justify-center gap-1 py-1 hover:text-gray-600 transition-colors w-full bg-gray-50/50 rounded-xl"
          >
            {isExpanded ? "상세 지표 접기" : "상세 지표 확인하기"} 
            <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </motion.div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 z-40">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={onReset}
              className="w-full bg-brand-blue text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <RefreshCcw size={18} />
              새로운 불편 제안하기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
