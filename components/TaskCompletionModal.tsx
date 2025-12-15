
import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Loader2 } from 'lucide-react';
import { Task } from '../types';
import { generateTaskInsight } from '../services/geminiService';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (reflection: string) => void;
  task: Task | null;
}

const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({ isOpen, onClose, onComplete, task }) => {
  const [reflection, setReflection] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setReflection('');
      setAiInsight('');
      setIsLoading(true);
      
      // Generate AI Insight
      generateTaskInsight(task.title, task.category)
        .then(insight => {
           setAiInsight(insight);
           setIsLoading(false);
        })
        .catch(() => {
           setAiInsight("Great work completing this!");
           setIsLoading(false);
        });
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSubmit = () => {
    onComplete(reflection);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-800">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
            <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 mb-4 shadow-sm animate-checkbox-pop">
                <Check size={32} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Almost Done!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Reflect on completing: <span className="font-semibold">{task.title}</span></p>
        </div>

        {/* AI Insight Section */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100 dark:bg-indigo-800/30 rounded-full -mr-8 -mt-8 blur-xl"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles size={14} /> Serene's Insight
                </div>
                {isLoading ? (
                    <div className="flex items-center space-x-2 text-slate-500 text-sm py-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Reflecting...</span>
                    </div>
                ) : (
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium italic">
                        "{aiInsight}"
                    </p>
                )}
            </div>
        </div>

        {/* Reflection Input */}
        <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-left ml-1">
                Reflection (Optional)
            </label>
            <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="How did it feel to get this done?"
                className="w-full h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
            />
        </div>

        <div className="flex gap-3">
            <button 
                onClick={onClose}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-bold transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit}
                className="flex-[2] py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
                Complete Task
            </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionModal;
