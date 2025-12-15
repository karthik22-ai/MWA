
import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';

interface FirestoreRulesHelpProps {
  onRetry?: () => void;
}

const FirestoreRulesHelp: React.FC<FirestoreRulesHelpProps> = ({ onRetry }) => {
  const [copied, setCopied] = useState(false);

  // More explicit rules structure handling both the user doc and nested collections
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Match the user profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Match any document in subcollections (moods, journals, tasks, etc.)
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-3xl w-full bg-slate-900 border border-amber-500/30 rounded-[2rem] p-8 shadow-2xl animate-fade-in">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Database Permissions Locked</h1>
            <p className="text-slate-400 leading-relaxed">
              The app connected to Firebase, but was blocked from reading your data. 
              Please update your <b>Firestore Security Rules</b> with this robust configuration.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
            <h3 className="font-bold mb-4 text-white flex items-center gap-2">
              <span className="bg-amber-500 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Copy these Exact Rules
            </h3>
            <div className="relative group">
              <pre className="bg-slate-900 p-4 rounded-lg text-amber-100 font-mono text-xs sm:text-sm overflow-x-auto border border-slate-700">
                {rules}
              </pre>
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all flex items-center gap-2 text-xs font-bold"
              >
                {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14}/>}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
            <h3 className="font-bold mb-4 text-white flex items-center gap-2">
              <span className="bg-amber-500 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Update Firebase & Retry
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm ml-1 mb-6">
              <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline inline-flex items-center gap-1">Firebase Console <ExternalLink size={10}/></a> and select your project.</li>
              <li>Navigate to <b>Build</b> {'>'} <b>Firestore Database</b>.</li>
              <li>Click on the <b>Rules</b> tab.</li>
              <li>Delete existing code, paste the new rules, and click <b>Publish</b>.</li>
            </ol>
            
            {onRetry && (
                <button 
                    onClick={onRetry}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-900/50 flex items-center justify-center gap-2"
                >
                    <RefreshCw size={20} />
                    I've Updated the Rules, Retry Connection
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirestoreRulesHelp;
