import { useState, useEffect } from "react";
import { Gavel, HelpCircle, Sparkles, History, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "../services/apiClient";

interface InputScreenProps {
  key?: string;
  onSubmit: (text: string) => Promise<void> | void;
}

export function InputScreen({ onSubmit }: InputScreenProps) {
  const [text, setText] = useState("");
  const [proposals, setProposals] = useState<any[]>([]);
  const quickChips = ["버스 배차", "주차 문제", "야간 교통", "보행 불편"];

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await apiClient.getProposals();
        setProposals(data);
      } catch (e) {
        console.error("Failed to fetch proposals", e);
      }
    };
    fetchProposals();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40">
        <div className="max-w-2xl mx-auto h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-brand-blue">
            <Gavel size={24} fill="currentColor" />
            <h1 className="text-xl font-black">이의있소!</h1>
          </div>
          <button className="text-gray-400 hover:text-brand-blue">
            <HelpCircle size={24} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full pt-28 pb-40 px-6 flex flex-col gap-12">
        <section className="flex flex-col items-center text-center gap-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden"
          >
            <img src="/logo.png" alt="이의있소!" className="w-full h-full object-contain p-2" />
          </motion.div>
          <h2 className="text-3xl font-bold leading-tight">
            대구에서 어떤 점이<br />불편하셨나요?
          </h2>
          <p className="text-gray-500">
            자유롭게 적어주시면 AI가<br />정책으로 번역해 드립니다.
          </p>
        </section>

        <section className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm focus-within:ring-2 focus-within:ring-brand-blue/20 transition-all">
            <textarea
              className="w-full h-40 bg-transparent border-none resize-none focus:ring-0 p-0 text-lg placeholder:text-gray-300"
              placeholder="예: 아침 출근 시간에 동대구역 가는 버스 배차 간격이 길어서 불편했습니다"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
            />
            <div className="flex justify-end pt-3 text-xs text-gray-400 border-t border-gray-50">
              {text.length} / 500자
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {quickChips.map((chip) => (
              <button
                key={chip}
                onClick={() => setText(text ? `${text} ${chip}` : chip)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm rounded-full transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {proposals.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-brand-navy">
              <History size={18} />
              <h3 className="font-black text-sm italic">시민들의 목소리</h3>
            </div>
            <div className="grid gap-3">
              {proposals.map((p) => (
                <div 
                  key={p.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 hover:border-brand-blue/30 transition-all cursor-default"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-brand-blue px-2 py-0.5 bg-brand-blue/5 rounded-full border border-brand-blue/10">
                      {p.analysis.draft.category}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-black text-brand-navy line-clamp-1">
                    {p.analysis.draft.problem}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex gap-1">
                      {p.analysis.metrics.slice(0, 3).map((m: any, idx: number) => (
                        <div key={idx} className="w-1.5 h-1.5 rounded-full bg-brand-success/30" title={m.label} />
                      ))}
                    </div>
                    <span className="text-[11px] font-black text-brand-success flex items-center gap-0.5">
                      완성도 {p.analysis.structuringLevel}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-brand-ivory via-brand-ivory to-transparent">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => text.trim() && onSubmit(text)}
            disabled={!text.trim()}
            className="w-full bg-brand-blue hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <Sparkles size={20} />
            정책으로 번역하기
          </button>
        </div>
      </footer>
    </div>
  );
}
