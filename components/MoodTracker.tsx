
import React, { useState } from 'react';
import { MoodType, AppTab } from '../types';
import { Smile, Frown, Meh, CloudRain, Zap, Sun, Check, ArrowRight, Wind, BookOpen, MessageCircle, Heart } from 'lucide-react';

interface MoodTrackerProps {
  onLogMood: (mood: MoodType, note: string) => void;
  onNavigate?: (tab: AppTab, startVoice?: boolean) => void;
  onNavigateToTool?: (toolId: string) => void;
}

const moods = [
  { type: MoodType.Happy, icon: Smile, color: 'text-amber-500', activeBg: 'bg-amber-400', activeText: 'text-white', border: 'border-amber-100 dark:border-amber-900', label: 'Happy' },
  { type: MoodType.Calm, icon: Sun, color: 'text-teal-500', activeBg: 'bg-teal-400', activeText: 'text-white', border: 'border-teal-100 dark:border-teal-900', label: 'Calm' },
  { type: MoodType.Neutral, icon: Meh, color: 'text-slate-400', activeBg: 'bg-slate-400', activeText: 'text-white', border: 'border-slate-100 dark:border-slate-700', label: 'Okay' },
  { type: MoodType.Sad, icon: Frown, color: 'text-blue-500', activeBg: 'bg-blue-400', activeText: 'text-white', border: 'border-blue-100 dark:border-blue-900', label: 'Sad' },
  { type: MoodType.Anxious, icon: CloudRain, color: 'text-violet-500', activeBg: 'bg-violet-400', activeText: 'text-white', border: 'border-violet-100 dark:border-violet-900', label: 'Anxious' },
  { type: MoodType.Angry, icon: Zap, color: 'text-rose-500', activeBg: 'bg-rose-400', activeText: 'text-white', border: 'border-rose-100 dark:border-rose-900', label: 'Angry' },
];

const MoodTracker: React.FC<MoodTrackerProps> = ({ onLogMood, onNavigate, onNavigateToTool }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [suggestion, setSuggestion] = useState<{ title: string, text: string, action: () => void, icon: any, color: string } | null>(null);

  const handleSubmit = () => {
    if (selectedMood) {
      onLogMood(selectedMood, note);
      
      // Smart Coping Intervention Logic
      let intervention = null;
      if (selectedMood === MoodType.Anxious) {
          intervention = {
              title: "Let's pause.",
              text: "Feeling anxious? A quick 4-7-8 breathing session can reset your nervous system.",
              action: () => onNavigateToTool && onNavigateToTool('breathing'),
              icon: Wind,
              color: 'bg-teal-500'
          };
      } else if (selectedMood === MoodType.Angry) {
          intervention = {
              title: "Release it.",
              text: "Writing down your frustration is a safe way to let go. Try venting in the journal.",
              action: () => onNavigateToTool && onNavigateToTool('journal'),
              icon: BookOpen,
              color: 'bg-rose-500'
          };
      } else if (selectedMood === MoodType.Sad) {
          intervention = {
              title: "I'm here.",
              text: "You don't have to carry this alone. Want to talk to me for a moment?",
              action: () => onNavigate && onNavigate(AppTab.Chat, true),
              icon: MessageCircle,
              color: 'bg-blue-500'
          };
      } else if (selectedMood === MoodType.Happy) {
          intervention = {
              title: "Cherish this.",
              text: "These moments matter. Save this feeling in your Gratitude Journal?",
              action: () => onNavigateToTool && onNavigateToTool('journal'),
              icon: Heart,
              color: 'bg-amber-500'
          };
      }

      setSuggestion(intervention);
      setIsSubmitted(true);
      
      // Auto-reset only if no suggestion, otherwise wait for user action
      if (!intervention) {
          setTimeout(() => {
            resetForm();
          }, 3000);
      }
    }
  };

  const resetForm = () => {
      setIsSubmitted(false);
      setSelectedMood(null);
      setNote('');
      setSuggestion(null);
  };

  if (isSubmitted) {
    if (suggestion) {
        return (
             <div className="glass-card rounded-[2rem] p-6 text-center animate-scale-in flex flex-col items-center justify-center h-[260px] border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-all duration-500">
                <div className="absolute top-4 right-4 z-20">
                    <button onClick={resetForm} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <Check size={18} />
                    </button>
                </div>
                
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg ${suggestion.color} animate-bounce`}>
                    <suggestion.icon size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{suggestion.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-[240px] leading-relaxed">
                    {suggestion.text}
                </p>
                
                <button 
                    onClick={() => {
                        suggestion.action();
                        resetForm();
                    }}
                    className={`px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg active:scale-95 transition-all flex items-center gap-2 ${suggestion.color}`}
                >
                    Start Now <ArrowRight size={16} />
                </button>
             </div>
        );
    }

    return (
      <div className="glass-card rounded-[2rem] p-8 text-center animate-scale-in flex flex-col items-center justify-center h-[260px] border border-emerald-100 dark:border-emerald-900/50 relative overflow-hidden transition-all duration-500">
         {/* Success Background Effect */}
         <div className="absolute inset-0 bg-emerald-50/50 dark:bg-emerald-900/10"></div>
         
         <div className="relative z-10 p-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-500 mb-4 animate-checkbox-pop shadow-sm">
           <Check size={40} strokeWidth={3} />
         </div>
         <h3 className="relative z-10 text-xl font-bold text-slate-800 dark:text-white mb-1">Mood Logged</h3>
         <p className="relative z-10 text-slate-500 dark:text-slate-400 text-sm font-medium">Thanks for checking in.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[2rem] p-6 transition-all duration-300">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5 pl-1 flex items-center gap-2">
        How are you feeling?
      </h3>
      
      <div className="grid grid-cols-3 gap-3 mb-6">
        {moods.map((m) => (
          <button
            key={m.type}
            onClick={() => setSelectedMood(m.type)}
            className={`group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 active:scale-95 ${
              selectedMood === m.type 
                ? `${m.activeBg} ${m.activeText} shadow-xl scale-105 ring-4 ring-white dark:ring-slate-700 z-10` 
                : `bg-white dark:bg-slate-800 border ${m.border} hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.02]`
            }`}
          >
            <m.icon 
                className={`mb-2 transition-transform duration-300 ${selectedMood === m.type ? 'text-white scale-125' : `${m.color} group-hover:scale-110`}`} 
                size={26} 
            />
            <span className={`text-[10px] font-bold uppercase tracking-wide transition-opacity ${selectedMood === m.type ? 'opacity-100' : 'opacity-60 dark:text-slate-400'}`}>{m.label}</span>
          </button>
        ))}
      </div>

      <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${selectedMood ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-700 mb-3 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
            <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a quick note (optional)..."
                className="w-full p-4 bg-transparent border-none text-sm focus:outline-none font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-slate-200 dark:shadow-slate-900/50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <span>Log Mood</span>
            <ArrowRight size={16} strokeWidth={3} />
          </button>
      </div>
    </div>
  );
};

export default MoodTracker;
