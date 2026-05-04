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
    return response.json();
  },

  async respondToProposal(id: string, answer: string) {
    const response = await fetch(`${API_BASE_URL}/api/proposals/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (!response.ok) throw new Error("Failed to respond to proposal");
    return response.json();
  },

  async finalizeProposal(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/proposals/${id}/finalize`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to finalize proposal");
    return response.json();
  },

  async getProposals() {
    const response = await fetch(`${API_BASE_URL}/api/proposals`);
    if (!response.ok) throw new Error("Failed to fetch proposals");
    return response.json();
  }
};
