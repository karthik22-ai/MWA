import React, { useEffect, useState, useRef } from 'react';
import { X, Mic, MicOff, Volume2, CheckCircle2 } from 'lucide-react';
import { sendMessageToBackendStream } from '../services/geminiService';
import { ChatMessage } from '../types';

interface LiveVoiceSessionProps {
  onClose: () => void;
  categories: string[];
  history: ChatMessage[];
  onAddMessage: (role: 'user' | 'model', text: string) => void;
  tasks: any[];
}

const LiveVoiceSession: React.FC<LiveVoiceSessionProps> = ({
  onClose,
  categories,
  history,
  onAddMessage
}) => {
  const [status, setStatus] = useState<'listening' | 'processing' | 'speaking' | 'idle'>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseBuffer, setResponseBuffer] = useState('');
  const [permissionError, setPermissionError] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const transcriptRef = useRef(''); // Ref for stable access inside closures

  // Keep transcript ref in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognition();
      recognition.continuous = false; // We want it to stop after one sentence
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setStatus('listening');
        setPermissionError(false);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interimTranscript += event.results[i][0].transcript;
        }
        setTranscript(interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Error:", event.error);
        if (event.error === 'not-allowed') {
          setPermissionError(true);
        }
        if (event.error !== 'aborted') {
          // If error, go idle so user can retry manually
          setStatus('idle');
        }
      };

      recognitionRef.current = recognition;

      // Start immediately
      startListening();

    } else {
      alert("Voice not supported in this browser. Please use Chrome.");
    }

    return () => {
      stopListening();
      cancelSpeech();
    };
  }, []);

  // Handle "Turn End" logic separately to avoid closure stale state
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        const text = transcriptRef.current;
        // Only send if we have text and were actually listening (not cancelled)
        if (text.trim().length > 0 && status === 'listening') {
          handleSend(text);
        } else if (status === 'listening') {
          // User said nothing or was silent, just go idle
          setStatus('idle');
        }
      };
    }
  }, [status]); // Re-bind when status changes so we know valid state

  const startListening = () => {
    cancelSpeech();
    setTranscript('');
    try {
      recognitionRef.current.start();
    } catch (e) {
      // already started
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const cancelSpeech = () => {
    if (synthRef.current) synthRef.current.cancel();
  };

  const handleSend = async (text: string) => {
    if (status === 'processing' || status === 'speaking') return;

    setStatus('processing');

    // 1. Add User Message (as proper Object)
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };
    onAddMessage(userMsg);

    // Construct history logic
    const apiHistory = history.map(h => ({ role: h.role, parts: [{ text: h.text }] }));
    apiHistory.push({ role: 'user', parts: [{ text: text }] });

    const userContext = `The user is in 'Voice Mode'. Keep responses shorter (1-2 sentences), conversational, and warm. Avoid markdown.`;

    // 2. Add Bot Message Placeholder
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: ChatMessage = {
      id: botMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now()
    };
    onAddMessage(botMsg);

    let fullResponse = "";

    try {
      await sendMessageToBackendStream(
        apiHistory.length > 5 ? apiHistory.slice(-5) : apiHistory,
        userContext,
        (chunk) => {
          fullResponse += chunk;
          setResponseBuffer(prev => prev + chunk);
          // Update the bot message
          onAddMessage({
            ...botMsg,
            text: fullResponse + chunk
            // Note: local fullResponse is not updated in this closure scope for successive calls
            // We need to use external buffer or just append chunk to previous state in App?
            // App.tsx replaces content. So we need accumulated text here.
            // Actually, we can just use the chunk logic standard:
          });
        }
      );

      // Wait, the closure issue in the stream callback: 
      // `fullResponse` is local variable.
      // `sendMessageToBackendStream` callback is called multiple times.
      // `fullResponse` inside the callback: if `sendMessageToBackendStream` uses a loop that calls callback, 
      // AND `fullResponse` is defined inside `handleSend` (async function), 
      // the callback CLOSURE captures the `fullResponse` variable.
      // BUT `fullResponse += chunk` updates the variable in that scope. 
      // SO YES, `fullResponse` accumulates correctly across callbacks from the SAME async execution context.

      // Final Update
      onAddMessage({
        ...botMsg,
        text: fullResponse
      });

      setStatus('speaking');
      speakResponse(fullResponse);

    } catch (e) {
      console.error("Voice Send Error", e);
      setStatus('idle');
      speakResponse("I'm having trouble connecting. Please try again.");
    }
  };

  const speakResponse = (text: string) => {
    if (!text) {
      setStatus('idle');
      return;
    }

    // Clean markdown for speech
    const cleanText = text.replace(/[*#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Voice selection
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setTranscript('');
      // Auto-restart listening for conversation loop
      // Small delay to prevent mic latching onto tail of TTS
      setTimeout(() => {
        setStatus('listening');
        startListening();
      }, 200);
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[60] flex flex-col items-center justify-between text-white py-12 px-6 animate-fade-in">
      <button
        onClick={() => {
          stopListening();
          cancelSpeech();
          onClose();
        }}
        className="absolute top-6 right-6 p-4 bg-slate-800 rounded-full text-slate-400 hover:bg-slate-700 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Main Visual */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-12 w-full max-w-lg">

        {/* Orb Animation */}
        <div className="relative">
          <div className={`w-32 h-32 rounded-full blur-3xl transition-all duration-500 ${status === 'listening' ? 'bg-teal-500/40 scale-150 animate-pulse' :
            status === 'speaking' ? 'bg-indigo-500/40 scale-125 animate-pulse-fast' :
              status === 'processing' ? 'bg-purple-500/40 rotate-180' :
                'bg-slate-700/20'
            }`}></div>
          <div className={`relative w-40 h-40 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${status === 'listening' ? 'border-teal-500/50 shadow-[0_0_50px_rgba(20,184,166,0.5)]' :
            status === 'speaking' ? 'border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.5)] scale-110' :
              status === 'processing' ? 'border-purple-500/50 animate-spin-slow' :
                'border-slate-700 bg-slate-900'
            }`}>
            {status === 'listening' && <Mic size={48} className="text-teal-400 animate-bounce-slight" />}
            {status === 'speaking' && <Volume2 size={48} className="text-indigo-400 animate-pulse" />}
            {status === 'processing' && <div className="w-12 h-12 border-4 border-t-purple-500 border-purple-500/20 rounded-full animate-spin"></div>}
            {status === 'idle' && <MicOff size={48} className="text-slate-600" />}
          </div>
        </div>

        {/* Text Area */}
        <div className="text-center space-y-4 h-32 flex flex-col justify-center">
          {status === 'listening' ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-teal-400 uppercase tracking-widest">Listening</p>
              <p className="text-2xl font-light text-slate-100 leading-relaxed min-h-[3rem]">
                {transcript || <span className="text-slate-600 italic">Say something...</span>}
              </p>
            </div>
          ) : status === 'speaking' ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Serene Speaking</p>
              <p className="text-lg text-slate-300 line-clamp-3 px-4">{responseBuffer}</p>
            </div>
          ) : status === 'processing' ? (
            <p className="text-slate-400 animate-pulse">Thinking...</p>
          ) : (
            <p className="text-slate-500">Tap microphone to start</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        {status === 'idle' && (
          <button
            onClick={startListening}
            className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-500 hover:scale-110 transition-all shadow-lg shadow-teal-900/50"
          >
            <Mic size={28} className="text-white" />
          </button>
        )}
        {(status === 'speaking' || status === 'listening') && (
          <button
            onClick={() => {
              cancelSpeech();
              stopListening();
              setStatus('idle');
            }}
            className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center hover:bg-rose-900/50 hover:text-rose-500 hover:scale-105 transition-all"
          >
            <MicOff size={24} />
          </button>
        )}
      </div>

      {permissionError && (
        <div className="absolute top-20 bg-rose-500/10 border border-rose-500/50 text-rose-200 px-4 py-2 rounded-xl text-sm">
          Microphone access denied. Please check browser settings.
        </div>
      )}
    </div>
  );
};

export default LiveVoiceSession;
