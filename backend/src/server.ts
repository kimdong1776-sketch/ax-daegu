/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { db } from "./services/dbService.js";
import { startProposal, respondToProposal, finalizeProposal } from "./services/geminiService.js";
import { Proposal } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // 1. POST /api/proposals/start
  app.post("/api/proposals/start", async (req, res) => {
    try {
      const { oneLineReview } = req.body;
      if (!oneLineReview) return res.status(400).json({ error: "oneLineReview is required" });

      const aiResult = await startProposal(oneLineReview);
      
      const newProposal: Proposal = {
        ...aiResult as any,
        originalText: oneLineReview,
        currentRound: 1,
        answers: [],
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };

      const docRef = await db.collection("proposals").add(newProposal);
      res.json({ proposalId: docRef.id, ...newProposal });
    } catch (error) {
      console.error("Error starting proposal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 2. POST /api/proposals/:id/respond
  app.post("/api/proposals/:id/respond", async (req, res) => {
    try {
      const { id } = req.params;
      const { answer } = req.body;
      if (!answer) return res.status(400).json({ error: "answer is required" });

      const docRef = db.collection("proposals").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Proposal not found" });

      const proposal = doc.data() as Proposal;
      if (proposal.isCompleted) return res.status(400).json({ error: "Proposal already completed" });

      const aiResult = await respondToProposal(proposal, answer);
      
      const updatedAnswers = [...proposal.answers, { round: proposal.currentRound, answer }];
      const nextRound = proposal.currentRound + 1;
      const isReadyToFinalize = nextRound > 3;

      const updateData: any = {
        scores: aiResult.updatedScores,
        answers: updatedAnswers,
        currentRound: nextRound,
      };

      if (aiResult.nextCounterQuestion) {
        updateData.counterQuestion = aiResult.nextCounterQuestion;
      }

      await docRef.update(updateData);

      res.json({
        proposalId: id,
        currentRound: nextRound,
        updatedScores: aiResult.updatedScores,
        improvedSummary: aiResult.improvedSummary,
        feedback: aiResult.feedback,
        nextCounterQuestion: aiResult.nextCounterQuestion,
        isReadyToFinalize,
      });
    } catch (error) {
      console.error("Error responding to proposal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 3. POST /api/proposals/:id/finalize
  app.post("/api/proposals/:id/finalize", async (req, res) => {
    try {
      const { id } = req.params;
      const docRef = db.collection("proposals").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Proposal not found" });

      const proposal = doc.data() as Proposal;
      
      const finalCard = await finalizeProposal(proposal);
      
      await docRef.update({
        finalCard,
        isCompleted: true
      });

      res.json({
        proposalId: id,
        finalCard,
        status: "completed"
      });
    } catch (error) {
      console.error("Error finalizing proposal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 4. GET /api/proposals
  app.get("/api/proposals", async (req, res) => {
    try {
      const snapshot = await db.collection("proposals")
        .where("isCompleted", "==", true)
        .orderBy("createdAt", "desc")
        .get();
      
      const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(proposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
