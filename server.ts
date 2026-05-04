import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    structuringLevel: { type: Type.NUMBER },
    diagnostic: { type: Type.STRING },
    riskOfRejection: { type: Type.BOOLEAN },
    draft: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING },
        problem: { type: Type.STRING },
        target: { type: Type.STRING },
        direction: { type: Type.STRING },
        possibility: { type: Type.STRING },
      },
      required: ["category", "problem", "target", "direction", "possibility"],
    },
    metrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.NUMBER },
          increment: { type: Type.NUMBER },
          icon: { type: Type.STRING },
        },
        required: ["label", "value", "increment", "icon"],
      }
    }
  },
  required: ["structuringLevel", "diagnostic", "riskOfRejection", "draft", "metrics"],
};

// In-memory storage
interface Proposal {
  id: string;
  oneLineReview: string;
  analysis: any;
  history: { role: string; content: string }[];
  status: 'active' | 'finalized';
  createdAt: number;
}

const proposals: Record<string, Proposal> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Initial Analysis
  app.post("/api/proposals/start", async (req, res) => {
    const { oneLineReview } = req.body;
    if (!oneLineReview) return res.status(400).json({ error: "Missing oneLineReview" });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    const prompt = `
      당신은 대한민국 행정 전문가 '이의있소'입니다.
      시민이 입력한 불편함을 분석하여 전문적인 '정책 제안서' 형태로 구조화하고, 지자체(대구광역시)에 제출했을 때의 실효성을 평가하세요.

      [사용자 입력]: "${oneLineReview}"

      [분석 가이드라인]:
      1. structuringLevel: 0-100 사이의 점수. 초기 입력은 보통 30-50점 사이입니다.
      2. draft:
         - category: 정책 분야 (예: 교통, 환경, 복지 등)
         - problem: 시민의 말을 행정 언어로 정제한 핵심 문제 정의
         - target: 이 정책의 수혜 대상
         - direction: 해결 방안의 대략적인 방향
         - possibility: 정책화 가능성에 대한 전문가 소견
      3. metrics: 다음 5개 지표를 포함하세요 (Icon은 'target', 'public', 'library_books', 'build', 'lightbulb' 중 하나)
         - 문제 명확도
         - 공공성
         - 근거 충분성
         - 실현 가능성
         - 대안 구체성
         보통 초기값은 20-50점 사이이며, 모든 지표의 increment는 0으로 설정하세요.
      4. diagnostic: 현재 제안의 한계점과 보완이 필요한 이유를 1~2문장으로 설명.
      5. riskOfRejection: structuringLevel이 75점 미만이면 무조건 true, 75점 이상이면 false로 설정하세요.

      한국어로 응답하세요.
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const analysis = JSON.parse(responseText);
      
      const id = Date.now().toString();
      
      // Get initial question
      const questionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const questionPrompt = `
        당신은 시민의 제안을 돕는 전문적인 '정책 분석관'입니다. 
        완성도: ${analysis.structuringLevel}%, 보완 권고: ${analysis.diagnostic}
        제안을 더 구체화하기 위한 '단 하나의' 구체적인 질문을 던지세요. 부드러운 어조를 사용하세요.
      `;
      const qResult = await questionModel.generateContent(questionPrompt);
      const initialQuestion = qResult.response.text();

      proposals[id] = {
        id,
        oneLineReview,
        analysis,
        history: [
          { role: 'user', content: oneLineReview },
          { role: 'assistant', content: initialQuestion }
        ],
        status: 'active',
        createdAt: Date.now()
      };

      res.json({ id, analysis, initialQuestion });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to start proposal" });
    }
  });

  // 2. Refinement Response
  app.post("/api/proposals/:id/respond", async (req, res) => {
    const { id } = req.params;
    const { answer } = req.body;
    const proposal = proposals[id];

    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    proposal.history.push({ role: 'user', content: answer });

    // Simulate progress improvement logic based on previous behavior
    const jump = Math.floor(Math.random() * 8) + 7;
    const newScore = Math.min(98, proposal.analysis.structuringLevel + jump);
    
    proposal.analysis = {
      ...proposal.analysis,
      structuringLevel: newScore,
      metrics: proposal.analysis.metrics.map((m: any) => {
        const inc = m.value < 90 ? Math.floor(Math.random() * 10) + 3 : 0;
        return {
          ...m,
          value: Math.min(100, m.value + inc),
          increment: inc
        };
      }),
      riskOfRejection: newScore < 80,
      diagnostic: newScore >= 85 
        ? "제안이 매우 충실해졌습니다. 이제 실무 부서에서 검토하기에 충분한 수준입니다."
        : "좋은 답변입니다. 다만 구체적인 실행 계획에 대해 조금 더 고민해볼 필요가 있습니다."
    };

    // Get next question
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const historyString = proposal.history.map(h => `${h.role === 'user' ? '시민' : '분석관'}: ${h.content}`).join('\n');
    
    const prompt = `
      당신은 시민의 제안을 돕는 전문적인 '정책 분석관'입니다. 
      완성도: ${proposal.analysis.structuringLevel}%, 진단: ${proposal.analysis.diagnostic}
      [이전 대화]
      ${historyString}

      사용자의 답변을 토대로 다음 질문을 하거나 칭찬하세요. 완성도가 85% 이상이면 제출을 권유하세요.
    `;

    try {
      const result = await model.generateContent(prompt);
      const nextMessage = result.response.text();
      proposal.history.push({ role: 'assistant', content: nextMessage });

      res.json({ analysis: proposal.analysis, nextMessage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process response" });
    }
  });

  // 3. Finalize
  app.post("/api/proposals/:id/finalize", async (req, res) => {
    const { id } = req.params;
    if (proposals[id]) {
      proposals[id].status = 'finalized';
      res.json({ success: true, proposal: proposals[id] });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // 4. List Proposals
  app.get("/api/proposals", (req, res) => {
    res.json(Object.values(proposals).filter(p => p.status === 'finalized'));
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
