/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import {
  startProposal,
  respondToProposal,
  finalizeProposal,
} from "./services/geminiService.js";
import { Proposal } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type StoredProposal = Proposal & {
  finalCard?: unknown;
};

const proposals = new Map<string, StoredProposal>();

function createProposalId() {
  return `proposal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // CORS 직접 허용
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Vary", "Origin");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, ngrok-skip-browser-warning"
    );
    res.header("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({
      ok: true,
      message: "AX_DAEGU backend is running",
    });
  });

  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      status: "healthy",
    });
  });

  // 1. 최초 분석
  app.post("/api/proposals/start", async (req, res) => {
    try {
      console.log("START API called");
      console.log("req.body:", req.body);

      const { oneLineReview } = req.body;

      if (!oneLineReview) {
        return res.status(400).json({
          error: "oneLineReview is required",
        });
      }

      const aiResult = await startProposal(oneLineReview);
      const proposalId = createProposalId();

      const newProposal: StoredProposal = {
        ...(aiResult as any),
        originalText: oneLineReview,
        currentRound: 1,
        answers: [],
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };

      proposals.set(proposalId, newProposal);

      res.json({
        proposalId,
        ...newProposal,
      });
    } catch (error) {
      console.error("Error starting proposal:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // 2. 보완 답변
  app.post("/api/proposals/:id/respond", async (req, res) => {
    try {
      const { id } = req.params;
      const { answer } = req.body;

      console.log("RESPOND API called:", id);
      console.log("req.body:", req.body);

      if (!answer) {
        return res.status(400).json({
          error: "answer is required",
        });
      }

      const proposal = proposals.get(id);

      if (!proposal) {
        return res.status(404).json({
          error: "Proposal not found",
        });
      }

      if (proposal.isCompleted) {
        return res.status(400).json({
          error: "Proposal already completed",
        });
      }

      const aiResult = await respondToProposal(proposal, answer);

      const updatedAnswers = [
        ...proposal.answers,
        {
          round: proposal.currentRound,
          answer,
        },
      ];

      const nextRound = proposal.currentRound + 1;
      const isReadyToFinalize = nextRound > 3;

      const updatedProposal: StoredProposal = {
        ...proposal,
        scores: aiResult.updatedScores,
        answers: updatedAnswers,
        currentRound: nextRound,
        counterQuestion:
          aiResult.nextCounterQuestion ?? proposal.counterQuestion,
      };

      proposals.set(id, updatedProposal);

      res.json({
        proposalId: id,
        currentRound: nextRound,
        isRelevant: aiResult.isRelevant ?? true,
        relevanceReason: aiResult.relevanceReason ?? "",
        updatedScores: aiResult.updatedScores,
        improvedSummary: aiResult.improvedSummary,
        feedback: aiResult.feedback,
        nextCounterQuestion: aiResult.nextCounterQuestion,
        isReadyToFinalize,
      });
    } catch (error) {
      console.error("Error responding to proposal:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // 3. 최종 제안서 생성
  app.post("/api/proposals/:id/finalize", async (req, res) => {
    try {
      const { id } = req.params;

      console.log("FINALIZE API called:", id);

      const proposal = proposals.get(id);

      if (!proposal) {
        return res.status(404).json({
          error: "Proposal not found",
        });
      }

      const finalCard = await finalizeProposal(proposal);

      const completedProposal: StoredProposal = {
        ...proposal,
        finalCard,
        isCompleted: true,
      };

      proposals.set(id, completedProposal);

      res.json({
        proposalId: id,
        finalCard,
        status: "completed",
      });
    } catch (error) {
      console.error("Error finalizing proposal:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // 4. 완료 제안 목록 조회
  app.get("/api/proposals", async (req, res) => {
    try {
      const completedProposals = Array.from(proposals.entries())
        .map(([proposalId, proposal]) => ({
          proposalId,
          ...proposal,
        }))
        .filter((proposal) => proposal.isCompleted)
        .sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        });

      res.json(completedProposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // 디버그용 전체 proposal 확인
  app.get("/api/debug/proposals", (req, res) => {
    const allProposals = Array.from(proposals.entries()).map(
      ([proposalId, proposal]) => ({
        proposalId,
        ...proposal,
      })
    );

    res.json(allProposals);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();