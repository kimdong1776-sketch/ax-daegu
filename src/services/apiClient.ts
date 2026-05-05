import { AIAnalysis } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const apiClient = {
  async startProposal(oneLineReview: string) {
    const response = await fetch(`${API_BASE_URL}/api/proposals/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oneLineReview }),
    });
    if (!response.ok) throw new Error("Failed to start proposal");
    const data = await response.json();
    
    // Map scores to metrics
    if (data.analysis && data.analysis.scores) {
      data.analysis.metrics = data.analysis.scores;
      delete data.analysis.scores;
    }
    return data;
  },

  async respondToProposal(proposalId: string, answer: string) {
    const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (!response.ok) throw new Error("Failed to respond to proposal");
    const data = await response.json();

    // Map scores to metrics
    if (data.analysis && data.analysis.scores) {
      data.analysis.metrics = data.analysis.scores;
      delete data.analysis.scores;
    }
    return data;
  },

  async finalizeProposal(proposalId: string) {
    const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/finalize`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to finalize proposal");
    const data = await response.json();
    
    // Map scores to metrics for list consistency
    if (data.proposal && data.proposal.analysis && data.proposal.analysis.scores) {
      data.proposal.analysis.metrics = data.proposal.analysis.scores;
      delete data.proposal.analysis.scores;
    }
    return data;
  },

  async getProposals() {
    const response = await fetch(`${API_BASE_URL}/api/proposals`);
    if (!response.ok) throw new Error("Failed to fetch proposals");
    const data = await response.json();
    
    // Map scores to metrics for all items
    return data.map((p: any) => {
      if (p.analysis && p.analysis.scores) {
        p.analysis.metrics = p.analysis.scores;
        delete p.analysis.scores;
      }
      return p;
    });
  }
};
