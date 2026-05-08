import { motion } from "motion/react";

export function SplashScreen({ onComplete }: { key?: string; onComplete: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.5, duration: 0.5 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-ivory"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-48 h-48 flex flex-col items-center justify-center"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <motion.path
              d="M40 145 H160"
              stroke="#191b23"
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
            <motion.path
              d="M60 155 H140"
              stroke="#191b23"
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            />
            <text x="100" y="105" textAnchor="middle" fill="#0058be" className="text-4xl font-black font-sans">이의</text>
            <text x="85" y="140" textAnchor="middle" fill="#191b23" className="text-4xl font-black font-sans">있소</text>
            <motion.text 
              x="118" y="140" 
              fill="#F97316" 
              className="text-5xl font-black italic"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.6, type: "spring" }}
            >!</motion.text>
            
            <motion.g
              initial={{ x: 40, y: -40, rotate: 45, opacity: 0 }}
              animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8, type: "spring" }}
            >
              <rect x="135" y="30" width="20" height="30" rx="4" fill="#F97316" stroke="#191b23" strokeWidth="2" transform="rotate(-30 145 45)" />
              <rect x="145" y="45" width="40" height="8" rx="4" fill="#191b23" transform="rotate(-30 145 45)" />
            </motion.g>
          </svg>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="mt-6 text-xl font-medium text-brand-navy tracking-wide"
        >
          대구 시민 공론장: 불편 번역기
        </motion.h1>
      </div>
    </motion.div>
  );
}
