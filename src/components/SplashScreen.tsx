import { motion } from "motion/react";

export function SplashScreen({
  onComplete,
}: {
  key?: string;
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 3, duration: 0.5 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-ivory"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-48 h-48 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full overflow-visible"
          >
            {/* 바닥 라인 */}
            <motion.path
              d="M40 145 H160"
              stroke="#191b23"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            />

            <motion.path
              d="M60 155 H140"
              stroke="#191b23"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            />

            {/* 텍스트 */}
            <text
              x="100"
              y="100"
              textAnchor="middle"
              fill="#0058be"
              className="text-4xl font-black font-sans"
            >
              이의
            </text>

            <text
              x="86"
              y="136"
              textAnchor="middle"
              fill="#191b23"
              className="text-4xl font-black font-sans"
            >
              있소
            </text>

            {/* 느낌표 */}
            <motion.text
              x="118"
              y="136"
              fill="#F97316"
              className="text-5xl font-black italic"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.3, 1],
                opacity: 1,
              }}
              transition={{
                delay: 1.5,
                duration: 0.4,
              }}
            >
              !
            </motion.text>

            {/* 충격파 */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                delay: 1.3,
                duration: 0.3,
              }}
            >
              <line
                x1="145"
                y1="145"
                x2="165"
                y2="137"
                stroke="#F97316"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="145"
                y1="145"
                x2="170"
                y2="145"
                stroke="#F97316"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="145"
                y1="145"
                x2="163"
                y2="158"
                stroke="#F97316"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </motion.g>

            {/* 망치 */}
            <motion.g
              initial={{
                rotate: -80,
                x: 55,
                y: -75,
                opacity: 0,
              }}
              animate={{
                rotate: [-80, 18, 8],
                x: [55, -5, 0],
                y: [-75, 8, 0],
                opacity: 1,
              }}
              transition={{
                delay: 0.8,
                duration: 0.75,
                times: [0, 0.82, 1],
              }}
              style={{
                transformOrigin: "147px 92px",
              }}
            >
              {/* 모션 블러 */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.15, 0] }}
                transition={{
                  delay: 0.9,
                  duration: 0.2,
                }}
              >
                <rect
                  x="126"
                  y="35"
                  width="42"
                  height="20"
                  rx="5"
                  fill="#F97316"
                />
                <rect
                  x="142"
                  y="48"
                  width="10"
                  height="62"
                  rx="5"
                  fill="#191b23"
                />
              </motion.g>

              {/* 손잡이 */}
              <rect
                x="142"
                y="48"
                width="10"
                height="62"
                rx="5"
                fill="#191b23"
              />

              {/* 망치 헤드 */}
              <rect
                x="126"
                y="35"
                width="42"
                height="20"
                rx="5"
                fill="#F97316"
                stroke="#191b23"
                strokeWidth="2"
              />
            </motion.g>

            {/* 파편 */}
            <motion.rect
              x="148"
              y="144"
              width="5"
              height="5"
              rx="1"
              fill="#191b23"
              initial={{
                x: 145,
                y: 145,
                opacity: 0,
                rotate: 0,
              }}
              animate={{
                x: 166,
                y: 154,
                opacity: [0, 1, 0],
                rotate: 45,
              }}
              transition={{
                delay: 1.35,
                duration: 0.35,
              }}
            />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1, duration: 0.5 }}
          className="mt-6 text-xl font-medium text-brand-navy tracking-wide"
        >
          대구 시민 공론장: 불편 번역기
        </motion.h1>
      </div>
    </motion.div>
  );
}