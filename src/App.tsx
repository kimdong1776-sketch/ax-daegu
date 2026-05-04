import { useState, useEffect } from 'react';
import { AnimatePresence } from "motion/react";
import { Screen, AIAnalysis } from './types';
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
  const getInitialState = (): PersistedState => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentScreen === 'LOADING') {
          return { ...parsed, currentScreen: 'INPUT' };
        }
        if (!parsed.messages) parsed.messages = [];
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return {
      currentScreen: 'SPLASH',
      complaint: '',
      analysis: null,
      messages: [],
      proposalId: null,
    };
  };

  const initialState = getInitialState();
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialState.currentScreen);
  const [complaint, setComplaint] = useState(initialState.complaint);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(initialState.analysis);
  const [messages, setMessages] = useState<ChatMessage[]>(initialState.messages);
  const [proposalId, setProposalId] = useState<string | null>(initialState.proposalId);

  useEffect(() => {
    const stateToSave: PersistedState = {
      currentScreen,
      complaint,
      analysis,
      messages,
      proposalId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [currentScreen, complaint, analysis, messages]);

  const handleStartAnalysis = async (text: string) => {
    setComplaint(text);
    setCurrentScreen('LOADING');
    
    try {
      const result = await apiClient.startProposal(text);
      setProposalId(result.id);
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
          <SplashScreen key="splash" onComplete={() => setCurrentScreen('INPUT')} />
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

