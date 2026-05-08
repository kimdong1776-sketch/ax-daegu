import { useState, useEffect } from 'react';
import { AnimatePresence } from "motion/react";
import { Screen, AIAnalysis, ChatMessage } from './types';
import { SplashScreen } from './components/SplashScreen';
import { InputScreen } from './components/InputScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultScreen } from './components/ResultScreen';
import { RefineScreen } from './components/RefineScreen';
import { SuccessScreen } from './components/SuccessScreen';
import { SubmissionCompleteScreen } from './components/SubmissionCompleteScreen';
import { apiClient } from './services/apiClient';

const STORAGE_KEY = 'euiui-isso-state';

interface PersistedState {
  currentScreen: Screen;
  complaint: string;
  analysis: AIAnalysis | null;
  messages: ChatMessage[];
  proposalId: string | null;
}

export default function App() {
  // Removed localStorage persistence per user request
  const [currentScreen, setCurrentScreen] = useState<Screen>('SPLASH');
  const [complaint, setComplaint] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [proposalId, setProposalId] = useState<string | null>(null);

  const handleSplashComplete = () => {
    setCurrentScreen('INPUT');
  };

  // Removed useEffect for saving to localStorage

  const handleStartAnalysis = async (text: string) => {
    setComplaint(text);
    setCurrentScreen('LOADING');
    
    try {
      const result = await apiClient.startProposal(text);
      setProposalId(result.proposalId);
      setAnalysis(result.analysis);
      setMessages([{
        id: "1",
        role: "assistant",
        content: result.initialQuestion,
      }]);
      setCurrentScreen('RESULT');
    } catch (error) {
      console.error(error);
      setCurrentScreen('INPUT');
      alert('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleUpdateAnalysis = (newAnalysis: AIAnalysis) => {
    setAnalysis(newAnalysis);
  };

  const handleReset = () => {
    setComplaint('');
    setAnalysis(null);
    setMessages([]);
    setProposalId(null);
    setCurrentScreen('INPUT');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-brand-ivory font-sans antialiased text-brand-navy selection:bg-brand-blue/10">
      <AnimatePresence mode="wait">
        {currentScreen === 'SPLASH' && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}

        {currentScreen === 'INPUT' && (
          <InputScreen key="input" onSubmit={handleStartAnalysis} />
        )}

        {currentScreen === 'LOADING' && (
          <LoadingScreen key="loading" />
        )}

        {currentScreen === 'RESULT' && analysis && (
          <ResultScreen 
            key="result" 
            analysis={analysis} 
            onRefine={() => setCurrentScreen('REFINE')}
            onSubmit={() => setCurrentScreen('SUBMITTED')}
          />
        )}

        {currentScreen === 'REFINE' && analysis && proposalId && (
          <RefineScreen 
            key="refine" 
            proposalId={proposalId}
            analysis={analysis}
            messages={messages}
            setMessages={setMessages}
            onUpdate={handleUpdateAnalysis}
            onBack={() => setCurrentScreen('RESULT')}
            onComplete={() => setCurrentScreen('SUCCESS')}
          />
        )}

        {currentScreen === 'SUCCESS' && analysis && (
          <SuccessScreen 
            key="success" 
            analysis={analysis}
            onContinue={() => setCurrentScreen('RESULT')}
          />
        )}

        {currentScreen === 'SUBMITTED' && analysis && (
          <SubmissionCompleteScreen 
            key="submitted"
            analysis={analysis}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

