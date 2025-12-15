
import React from 'react';
import { Phone, ShieldAlert, X } from 'lucide-react';

interface CrisisResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CrisisResourceModal: React.FC<CrisisResourceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl border border-rose-100 dark:border-rose-900">
        <div className="bg-rose-500 p-6 flex justify-center">
           <ShieldAlert className="text-white w-16 h-16 animate-pulse" />
        </div>
        
        <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">You are not alone.</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                It sounds like you might be going through a difficult time. While I am an AI, there are real people who want to listen and help you right now.
            </p>

            <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-2xl border border-rose-100 dark:border-rose-800 mb-6">
                <div className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">Suicide & Crisis Lifeline</div>
                <div className="flex items-center justify-center space-x-3">
                    <Phone className="text-rose-500" />
                    <a href="tel:988" className="text-4xl font-black text-slate-900 dark:text-white hover:text-rose-600 transition-colors">988</a>
                </div>
                <div className="text-xs text-slate-500 mt-2">Available 24/7. Free and Confidential.</div>
            </div>

            <button 
                onClick={onClose}
                className="text-slate-400 text-sm hover:text-slate-600 dark:hover:text-slate-200 underline"
            >
                I am safe, return to app
            </button>
        </div>
      </div>
    </div>
  );
};

export default CrisisResourceModal;
