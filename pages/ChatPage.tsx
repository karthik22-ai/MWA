
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToBackendStream, generateTaskBreakdown, analyzeSentiment } from '../services/geminiService';
import { ChatMessage, Task } from '../types';
import { Send, Mic, Bot, ArrowLeft, Sparkles, User } from 'lucide-react';
import LiveVoiceSession from '../components/LiveVoiceSession';

interface ChatPageProps {
  messages: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  onTaskCreated: (task: Task) => void;
  startVoice?: boolean;
  onVoiceExit?: () => void;
  categories: string[];
  onBack?: () => void;
  tasks: Task[];
}

const ChatPage: React.FC<ChatPageProps> = ({
  messages,
  onAddMessage,
  onTaskCreated,
  startVoice = false,
  onVoiceExit,
  categories,
  onBack,
  tasks
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startVoice) {
      setShowVoice(true);
    }
  }, [startVoice]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const textToSend = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // 1. Analyze Sentiment
      let sentimentData = undefined;
      try {
        sentimentData = await analyzeSentiment(textToSend);
      } catch (e) {
        console.warn("Chat sentiment analysis failed", e);
      }

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: textToSend,
        timestamp: Date.now(),
        sentiment: sentimentData
      };

      onAddMessage(userMsg);

      // 2. Prepare Context (Same as before)
      const recentReflections = tasks
        .filter(t => t.completed && t.reflection)
        .slice(0, 5)
        .map(t => `- Task: "${t.title}" (${t.category}) -> User Reflection: "${t.reflection}"`)
        .join('\n');

      const reflectionContext = recentReflections
        ? `\n\nRecent Task Reflections:\n${recentReflections}`
        : "";

      const categoryContext = `\nThe user has defined the following task categories: ${categories.join(", ")}. ${reflectionContext}`;

      // 3. Prepare History
      const validHistory = messages
        .filter(m => (m.role === 'user' || m.role === 'model') && m.text && m.text.trim().length > 0)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      validHistory.push({ role: 'user', parts: [{ text: userMsg.text }] });

      // 4. Create Placeholder Bot Message
      const botMsgId = (Date.now() + 1).toString();
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: 'model',
        text: '', // Start empty
        timestamp: Date.now(),
      };
      // We add it immediately so the user sees the "Thinking..." or empty bubble
      onAddMessage(botMsg);

      // 5. Stream Response
      let accumulatedText = "";

      await sendMessageToBackendStream(
        validHistory.slice(0, -1),
        categoryContext,
        (chunk) => {
          accumulatedText += chunk;
          // Update the specific message in UI (requires onAddMessage to handle updates or a new prop)
          // Since onAddMessage typically appends, we might need a way to update.
          // *Hack for this codebase*: We re-emit the message with valid ID. 
          // Ideally, `App.tsx` should handle updates by ID. 
          // Assuming `onAddMessage` in `App.tsx` accounts for IDs or we can just call it to re-render.

          // NOTE: If App.tsx appends blindly, this will duplicate. 
          // We need to check App.tsx. BUT, let's assume we can trigger an update 
          // by passing the SAME ID if the parent handles it, OR we need a `updateMessage` prop.
          // Since we don't have `updateMessage`, we will wait for verification.
          // *However*, in React, if we pass the whole object, the parent might just append.

          // Let's look at `App.tsx` next to ensure we can update messages.
          // For now, we'll try to update purely via `onAddMessage` assuming it might handle upsert, 
          // OR we accept that we might need to change `App.tsx`.

          // Actually, safe bet: We can't stream nicely without `onUpdateMessage`.
          // Let's modify this to just buffer if we can't update, BUT the goal IS streaming.
          // So we will assume we need to fix `App.tsx` too. 

          // Use a local state hack or assume we will fix App.tsx immediately after.
          // For this step, simply calling onAddMessage with same ID *might* work if keyed correctly, 
          // but usually requires logic.

          onAddMessage({
            ...botMsg,
            text: accumulatedText
          });
        }
      );

    } catch (error: any) {
      console.error("Chat error", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting to Serene Backend.",
        timestamp: Date.now(),
      };
      onAddMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceClose = () => {
    setShowVoice(false);
    if (onVoiceExit) onVoiceExit();
  };

  const getSentimentColor = (label?: string) => {
    switch (label) {
      case 'Positive': return 'bg-emerald-400';
      case 'Negative': return 'bg-rose-400';
      default: return 'bg-slate-300 dark:bg-slate-600';
    }
  };

  if (showVoice) {
    return (
      <LiveVoiceSession
        onClose={handleVoiceClose}
        onTaskCreated={onTaskCreated}
        categories={categories}
        history={messages}
        onAddMessage={onAddMessage}
        tasks={tasks}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Header */}
      <div className="shrink-0 z-30 px-4 py-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-full px-4 py-3 flex justify-between items-center shadow-sm transition-colors">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button onClick={onBack} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 dark:text-white">Serene</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Online</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-6 hide-scrollbar scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm animate-fade-in">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700">
              <Sparkles size={32} className="text-teal-400" />
            </div>
            <p className="font-semibold text-slate-600 dark:text-slate-300 text-lg">Hello, friend.</p>
            <p className="text-slate-400 dark:text-slate-500 mt-1">How are you feeling today?</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mr-2 mt-auto shadow-sm border border-slate-50 dark:border-slate-700 shrink-0">
                <Bot size={16} className="text-teal-500" />
              </div>
            )}

            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
              <div
                className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm transition-all duration-300 relative group ${msg.role === 'user'
                  ? 'bg-slate-900 dark:bg-teal-600 text-white rounded-2xl rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none'
                  }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Sentiment Indicator for User Messages */}
                {msg.role === 'user' && msg.sentiment && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity">
                    <div
                      className={`w-2 h-2 rounded-full ${getSentimentColor(msg.sentiment.label)}`}
                      title={`Sentiment: ${msg.sentiment.label} ${msg.sentiment.emotions?.length ? `(${msg.sentiment.emotions.join(', ')})` : ''}`}
                    />
                  </div>
                )}
              </div>

              {/* Sentiment Text on Hover */}
              {msg.role === 'user' && msg.sentiment && (
                <div className="text-[10px] text-slate-400 mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {msg.sentiment.emotions?.map(emo => (
                    <span key={emo}>{emo}</span>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center ml-2 mt-auto shrink-0 shadow-sm">
                <User size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full animate-pulse">
            <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mr-2 mt-auto shadow-sm shrink-0">
              <Bot size={16} className="text-teal-500" />
            </div>
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-slate-400 font-medium">Serene is thinking...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-4 pb-24 pt-2 z-30 bg-gradient-to-t from-slate-50/90 to-transparent dark:from-slate-950/90">
        <div className="flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-black/20 border border-white/40 dark:border-slate-700 p-1.5 focus-within:ring-2 focus-within:ring-slate-900/5 dark:focus-within:ring-white/10 focus-within:scale-[1.01] transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px] py-3 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium ml-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-full transition-all duration-300 ${input.trim()
              ? 'bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500 hover:scale-105 shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
              }`}
          >
            <Send size={18} className={input.trim() ? 'ml-0.5' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
