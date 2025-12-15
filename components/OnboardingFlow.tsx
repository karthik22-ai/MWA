import React, { useState } from 'react';
import { ArrowRight, Sparkles, User, Calendar } from 'lucide-react';
import { UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<'welcome' | 'details'>('welcome');
  const [name, setName] = useState(currentUser?.displayName || '');
  const [age, setAge] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age) return;

    if (currentUser) {
      onComplete({
        uid: currentUser.uid,
        email: currentUser.email || '',
        name: name,
        age: parseInt(age),
        hasOnboarded: true,
        joinedDate: Date.now()
      });
    }
  };

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white">
        <div className="max-w-sm w-full text-center animate-fade-in space-y-8">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Sparkles size={64} className="text-teal-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold mb-3 tracking-tight">SereneMind</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-medium">
              Welcome to your secure space for mental clarity and growth.
            </p>
          </div>
          <div className="pt-8">
            <button
              onClick={() => setStep('details')}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white">
      <div className="max-w-sm w-full animate-slide-up">
        <h2 className="text-3xl font-bold mb-2">Tell us about you</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">This helps Serene personalize your experience.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">What should we call you?</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500/50 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">How old are you?</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="number"
                required
                min="13"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500/50 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            Complete Setup <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingFlow;