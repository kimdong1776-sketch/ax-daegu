import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gavel, ChevronLeft, Send, Stars, Target, Globe, Library, Wrench, Lightbulb } from "lucide-react";
import { AIAnalysis, ChatMessage } from "../types";
import { apiClient } from "../services/apiClient";
import { SuccessScreen } from "./SuccessScreen";

interface RefineScreenProps {
  key?: string;
  proposalId: string;
  analysis: AIAnalysis;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onUpdate: (newAnalysis: AIAnalysis) => void;
  onBack: () => void;
  onComplete: () => void;
}

export function RefineScreen({ proposalId, analysis, messages, setMessages, onUpdate, onBack, onComplete }: RefineScreenProps) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showGrowth, setShowGrowth] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial message is now received from startProposal in App.tsx
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: inputText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setIsTyping(true);

    try {
      // 1. Get next question/feedback from Backend
      const result = await apiClient.respondToProposal(proposalId, inputText);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.nextCounterQuestion?.message || (result.isReadyToFinalize ? "모든 답변이 완료되었습니다! 이제 제안서를 완성할 수 있어요." : "더 보완하고 싶은 내용이 있으신가요?")
      };

      const rawMetrics = [
        { label: "문제 명확도", value: Number(result.updatedScores?.problemClarity ?? 0), icon: "target" as const },
        { label: "공공성", value: Number(result.updatedScores?.publicness ?? 0), icon: "public" as const },
        { label: "근거 충분성", value: Number(result.updatedScores?.evidence ?? 0), icon: "library_books" as const },
        { label: "실현 가능성", value: Number(result.updatedScores?.feasibility ?? 0), icon: "build" as const },
        { label: "대안 구체성", value: Number(result.updatedScores?.alternativeSpecificity ?? 0), icon: "lightbulb" as const },
      ];

      const structuringLevelCalc = Math.round(
        rawMetrics.reduce((sum, metric) => sum + metric.value, 0) / (rawMetrics.length || 1)
      );
      const newStructuringLevel = Math.max(0, Math.min(100, structuringLevelCalc));

      const oldMetricsMap = Object.fromEntries(analysis.metrics.map(m => [m.label, m.value]));

      const newAnalysis: AIAnalysis = {
        ...analysis,
        structuringLevel: newStructuringLevel,
        diagnostic: result.feedback || "제안이 더욱 구체화되었습니다.",
        riskOfRejection: Number(result.updatedScores?.evidence ?? 0) < 5,
        metrics: rawMetrics.map(m => ({
            ...m,
            increment: m.value - (oldMetricsMap[m.label] ?? 0)
        }))
      };

      // 2. Update all states
      setMessages(prev => [...prev, assistantMsg]);
      onUpdate({ ...analysis, ...newAnalysis });
      setIsTyping(false);
      
      // 3. Show progress/growth modal after a short delay
      setTimeout(() => {
        setShowGrowth(true);
      }, 500);

    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-screen bg-brand-ivory overflow-hidden">
      <header className="flex-shrink-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Gavel size={20} className="text-brand-blue" fill="currentColor" />
          <h1 className="text-lg font-black text-brand-blue">이의있소!</h1>
        </div>
        <div className="w-10" />
      </header>

      {/* Sticky Progress Info & Metrics Overview */}
      <div className="flex-shrink-0 bg-white px-4 py-4 shadow-sm border-b border-gray-100 z-10">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex items-end justify-between">
            {/* Percentage Section */}
            <div className="flex flex-col items-start mr-4">
              <span className="text-[13px] font-black text-gray-400 uppercase tracking-tight mb-1">정책구조화수준</span>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-6xl font-black text-brand-blue tracking-tighter">{analysis.structuringLevel}</span>
                <span className="text-xl font-bold text-gray-400">%</span>
              </div>
            </div>

            {/* Compact Metrics Row with Labels (Enlarged) */}
            <div className="flex-1 flex justify-end gap-5 overflow-x-auto pb-1 no-scrollbar">
              {analysis.metrics.map((m, idx) => {
                const Icon = {
                  target: Target,
                  public: Globe,
                  library_books: Library,
                  build: Wrench,
                  lightbulb: Lightbulb,
                }[m.icon] || Target;
                
                const isImproved = m.increment > 0;
                const isDecreased = m.increment < 0;
                
                // New color logic: 
                // Increased (increment > 0) -> Green
                // Decreased (increment < 0) -> Orange
                // No change / Initial (increment == 0) -> Gray/Blue (Default)
                const getStatusStyles = () => {
                  if (isImproved) return {
                    icon: "text-brand-success",
                    text: "text-brand-success",
                    border: "border-green-200",
                    bg: "bg-green-50/50"
                  };
                  if (isDecreased) return {
                    icon: "text-brand-orange",
                    text: "text-brand-orange",
                    border: "border-brand-orange/30",
                    bg: "bg-brand-orange/5"
                  };
                  return {
                    icon: "text-brand-blue",
                    text: "text-brand-navy",
                    border: "border-gray-100",
                    bg: "bg-gray-50/50"
                  };
                };

                const styles = getStatusStyles();
                
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[48px]">
                    <span className="text-[11px] font-bold whitespace-nowrap text-gray-400">
                      {m.label.length > 5 ? m.label.slice(0, 5) : m.label}
                    </span>
                    <div className={`p-2.5 rounded-2xl border transition-all ${styles.border} ${styles.bg}`}>
                      <Icon size={18} className={styles.icon} />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className={`text-sm font-black ${styles.text}`}>
                        {m.value}
                      </span>
                      {m.increment !== 0 && (
                        <span className={`text-[9px] font-bold ${m.increment > 0 ? 'text-brand-success' : 'text-brand-orange'}`}>
                          {m.increment > 0 ? `+${m.increment}` : m.increment}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Long Horizontal Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              initial={{ width: `${analysis.structuringLevel}%` }}
              animate={{ width: `${analysis.structuringLevel}%` }}
              className="bg-brand-success h-full transition-all duration-1000" 
            />
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2 ml-1">
                  <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center border border-brand-blue/10 overflow-hidden">
                    <Stars size={12} className="text-brand-blue" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-orange flex items-center gap-1">정책 분석관</span>
                </div>
              )}
              
              <div className={`p-4 rounded-2xl shadow-sm border ${
                msg.role === "user" 
                ? "bg-brand-blue text-white rounded-tr-sm border-brand-blue max-w-[85%]" 
                : "bg-white text-brand-navy rounded-tl-sm border-brand-orange/20 max-w-[90%] relative"
              }`}>
                {msg.role === "assistant" && (
                  <div className="absolute -top-3 -right-3 bg-white border border-gray-100 rounded-full p-1.5 shadow-sm">
                    <Gavel size={14} className="text-brand-orange" />
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              
              <span className="text-[10px] text-gray-400 mt-1.5 px-1">
                {msg.role === "user" ? "나의 답변" : "정책 분석관의 조언"}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="flex space-x-1 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-gray-300 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-gray-300 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      <footer className="flex-shrink-0 p-4 bg-white border-t border-gray-100 relative">
        {/* Level Up / Success Modal Overlay */}
        <AnimatePresence>
          {showGrowth && (
            <SuccessScreen 
              analysis={analysis} 
              onContinue={() => setShowGrowth(false)} 
            />
          )}
        </AnimatePresence>

        {/* Removed final policy proposal button section per user request */}

        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-all resize-none max-h-32"
            placeholder="생각을 자유롭게 들려주세요..."
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="w-12 h-12 flex items-center justify-center bg-brand-blue text-white rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:shadow-none transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
