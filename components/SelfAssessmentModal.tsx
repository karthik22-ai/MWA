
import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Activity, Lightbulb, ArrowRight, Loader2, Heart, MessageSquare, Check, ChevronRight } from 'lucide-react';
import { generateWellnessAssessment, generateAssessmentQuestions } from '../services/geminiService';
import { AssessmentResult, MoodEntry, JournalEntry, Task } from '../types';

interface SelfAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moodHistory: MoodEntry[];
  journalHistory: JournalEntry[];
  tasks: Task[];
}

type Step = 'intro' | 'loading_questions' | 'questions' | 'analyzing' | 'result';

const SelfAssessmentModal: React.FC<SelfAssessmentModalProps> = ({ 
    isOpen, 
    onClose,
    moodHistory,
    journalHistory,
    tasks
}) => {
  const [step, setStep] = useState<Step>('intro');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === 'questions' && inputRef.current) {
        inputRef.current.focus();
    }
  }, [step, currentQIndex]);

  if (!isOpen) return null;

  const handleStart = async () => {
    setStep('loading_questions');
    try {
        const generatedQuestions = await generateAssessmentQuestions(moodHistory, journalHistory, tasks);
        setQuestions(generatedQuestions);
        setStep('questions');
        setCurrentQIndex(0);
        setAnswers([]);
    } catch (e) {
        console.error(e);
        // Fallback or error state could go here, but generateAssessmentQuestions has a fallback
        setQuestions(["How are you feeling right now?"]);
        setStep('questions');
    }
  };

  const handleNextQuestion = async () => {
    if (!currentInput.trim()) return;

    const newAnswers = [...answers, currentInput];
    setAnswers(newAnswers);
    setCurrentInput('');

    if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
    } else {
        // Finished questions, analyze
        setStep('analyzing');
        try {
            const qaPairs = questions.map((q, i) => ({ question: q, answer: newAnswers[i] }));
            const assessment = await generateWellnessAssessment(moodHistory, journalHistory, tasks, qaPairs);
            setResult(assessment);
            setStep('result');
        } catch (e) {
            console.error(e);
            setStep('intro'); // Or error state
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleNextQuestion();
    }
  };

  const renderIntro = () => (
    <div className="flex flex-col h-full items-center justify-center text-center space-y-8 py-8 animate-fade-in">
        <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-indigo-50 dark:border-indigo-500/30">
                <Sparkles className="text-indigo-500" size={40} />
            </div>
        </div>
        
        <div className="max-w-xs space-y-3">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Self Check-in</h3>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                Let's take a moment to understand where you are. I'll ask a few questions to get a better picture of your state of mind.
            </p>
        </div>

        <button 
            onClick={handleStart}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 text-lg"
        >
            Start Reflection <ArrowRight size={20} />
        </button>
    </div>
  );

  const renderLoadingQuestions = () => (
    <div className="flex flex-col items-center justify-center h-full py-12 space-y-6 animate-fade-in">
        <Loader2 className="text-indigo-500 animate-spin" size={48} />
        <div className="text-center space-y-2">
            <p className="text-lg font-bold text-slate-800 dark:text-white">Connecting with you...</p>
            <p className="text-sm text-slate-400">Curating thoughtful questions based on your recent history.</p>
        </div>
    </div>
  );

  const renderQuestions = () => (
    <div className="flex flex-col h-full animate-slide-up">
        <div className="flex justify-between items-center mb-8">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                Question {currentQIndex + 1} of {questions.length}
            </span>
        </div>

        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 leading-tight">
            {questions[currentQIndex]}
        </h3>

        <div className="flex-1 mb-4">
            <textarea
                ref={inputRef}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your thoughts here..."
                className="w-full h-full resize-none bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
            />
        </div>

        <button 
            onClick={handleNextQuestion}
            disabled={!currentInput.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
            {currentQIndex === questions.length - 1 ? 'Finish & Analyze' : 'Next Question'} 
            {currentQIndex === questions.length - 1 ? <Sparkles size={18}/> : <ChevronRight size={18} />}
        </button>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center h-full py-12 space-y-6 animate-fade-in">
        <div className="relative">
            <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-xl animate-pulse"></div>
            <Sparkles className="relative text-teal-500 animate-bounce" size={48} />
        </div>
        <div className="text-center space-y-2">
            <p className="text-lg font-bold text-slate-800 dark:text-white">Analyzing your reflections...</p>
            <p className="text-sm text-slate-400">Finding patterns and crafting insights.</p>
        </div>
    </div>
  );

  const renderResult = () => (
    <div className="space-y-6 animate-slide-up pb-6">
        {/* Vibe Check */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 block relative z-10">Current Vibe</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight relative z-10">"{result?.currentVibe}"</h3>
        </div>

        {/* Patterns */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-rose-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observations</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed font-medium">
                {result?.emotionalPatterns}
            </p>
        </div>

        {/* Insights */}
        <div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 ml-1">
                <Lightbulb size={18} className="text-amber-500" /> Key Insights
            </h4>
            <div className="space-y-3">
                {result?.keyInsights.map((insight, idx) => (
                    <div key={idx} className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/30 text-sm text-slate-700 dark:text-amber-100/90 leading-relaxed font-medium">
                        {insight}
                    </div>
                ))}
            </div>
        </div>

        {/* Recommendations */}
        <div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 ml-1">
                <Heart size={18} className="text-teal-500" /> Recommended Actions
            </h4>
            <div className="space-y-3">
                {result?.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="mt-0.5 min-w-[24px] h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400 shrink-0">
                            {idx + 1}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{rec}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="pt-4">
            <button 
                onClick={onClose}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95 transition-all"
            >
                Complete Check-in
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-0 shadow-2xl animate-scale-in overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col h-[85vh] max-h-[800px]">
        
        {/* Header */}
        <div className={`relative p-6 text-white shrink-0 transition-colors duration-500 ${step === 'result' ? 'bg-indigo-600' : 'bg-slate-900 dark:bg-slate-950'}`}>
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm z-20">
                <X size={20} className="text-white" />
            </button>
            
            <div className="relative z-10 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 transition-colors duration-500 ${step === 'result' ? 'bg-white/20' : 'bg-slate-800 dark:bg-slate-800'}`}>
                    {step === 'questions' ? (
                        <MessageSquare size={24} className="text-white" />
                    ) : step === 'result' ? (
                        <Check size={24} className="text-white" />
                    ) : (
                        <Activity size={24} className="text-white" />
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">
                        {step === 'result' ? 'Check-in Complete' : 'Wellness Check-in'}
                    </h2>
                    <p className="text-white/60 text-xs font-medium">
                        {step === 'intro' ? 'AI-Powered Analysis' : 
                         step === 'questions' ? 'Reflect & Answer' :
                         step === 'result' ? 'Your Personal Report' : 'Processing...'}
                    </p>
                </div>
            </div>
            
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 scroll-smooth">
            {step === 'intro' && renderIntro()}
            {step === 'loading_questions' && renderLoadingQuestions()}
            {step === 'questions' && renderQuestions()}
            {step === 'analyzing' && renderAnalyzing()}
            {step === 'result' && renderResult()}
        </div>
      </div>
    </div>
  );
};

export default SelfAssessmentModal;
