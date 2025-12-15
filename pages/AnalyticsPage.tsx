
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts';
import { MoodEntry, MoodType, JournalEntry, ChatMessage, BreathingSession, Task, SleepEntry } from '../types';
import { TrendingUp, BookOpen, MessageCircle, Wind, Smile, Activity, CheckSquare, ChevronDown, X, Clock, User, Bot, LayoutList, Gauge, Moon } from 'lucide-react';

interface AnalyticsPageProps {
  moodHistory: MoodEntry[];
  journalHistory: JournalEntry[];
  chatHistory: ChatMessage[];
  breathingHistory: BreathingSession[];
  tasks: Task[];
  sleepHistory?: SleepEntry[];
}

type ActivityItem = {
    id: string;
    type: 'mood' | 'journal' | 'chat' | 'breathing' | 'task' | 'sleep';
    timestamp: number;
    title: string;
    subtitle?: string;
    icon: any;
    color: string;
    bg: string;
    data?: any; // Holds the full object (JournalEntry, ChatMessage[], etc.)
};

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ 
    moodHistory,
    journalHistory,
    chatHistory,
    breathingHistory,
    tasks,
    sleepHistory = []
}) => {
  const [visibleItems, setVisibleItems] = useState(20);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mood' | 'journal' | 'chat' | 'breathing' | 'task' | 'sleep'>('all');
  const [chartTimeRange, setChartTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('week');
  
  const getMoodColor = (mood: string) => {
    switch (mood) {
      case MoodType.Happy: return '#f59e0b'; // amber-500
      case MoodType.Calm: return '#14b8a6'; // teal-500
      case MoodType.Neutral: return '#94a3b8'; // slate-400
      case MoodType.Sad: return '#3b82f6'; // blue-500
      case MoodType.Anxious: return '#8b5cf6'; // violet-500
      case MoodType.Angry: return '#f43f5e'; // rose-500
      default: return '#cbd5e1';
    }
  };

  // Filter mood history based on time range
  const filteredMoodHistory = useMemo(() => {
      const now = Date.now();
      const cutoff = new Date();
      
      switch(chartTimeRange) {
          case 'day': 
            cutoff.setHours(0,0,0,0); // Start of today
            break; 
          case 'week': 
            cutoff.setDate(cutoff.getDate() - 7); 
            break;
          case 'month': 
            cutoff.setMonth(cutoff.getMonth() - 1); 
            break;
          case 'year': 
            cutoff.setFullYear(cutoff.getFullYear() - 1); 
            break;
          case 'all': 
            return moodHistory;
      }
      
      return moodHistory.filter(m => m.timestamp >= cutoff.getTime());
  }, [moodHistory, chartTimeRange]);

  // Aggregate Mood Frequency
  const moodFrequencyData = useMemo(() => {
    const counts: Record<string, number> = {
        [MoodType.Happy]: 0,
        [MoodType.Calm]: 0,
        [MoodType.Neutral]: 0,
        [MoodType.Sad]: 0,
        [MoodType.Anxious]: 0,
        [MoodType.Angry]: 0,
    };

    filteredMoodHistory.forEach(entry => {
        if (counts[entry.mood] !== undefined) {
            counts[entry.mood]++;
        }
    });

    return Object.keys(counts).map(mood => ({
        name: mood,
        count: counts[mood],
        color: getMoodColor(mood)
    }));
  }, [filteredMoodHistory]);

  // Sentiment Analysis Data Prep
  const sentimentData = useMemo(() => {
    const data: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    let total = 0;
    
    journalHistory.forEach(j => {
        if (j.sentiment) {
            if (data[j.sentiment.label] !== undefined) {
                data[j.sentiment.label]++;
                total++;
            }
        }
    });

    return total > 0 
        ? Object.entries(data).map(([name, value]) => ({ name, value, count: value }))
        : [];
  }, [journalHistory]);

  const totalEntries = moodHistory.length;
  
  // --- Group Chat Messages into Sessions ---
  const chatSessions = useMemo(() => {
    if (!chatHistory || chatHistory.length === 0) return [];
    
    // 1. Sort by timestamp ascending
    const sortedMsgs = [...chatHistory].sort((a, b) => a.timestamp - b.timestamp);
    const sessions: ChatMessage[][] = [];
    let currentSession: ChatMessage[] = [];

    // 2. Group messages
    sortedMsgs.forEach((msg, index) => {
        if (index === 0) {
            currentSession.push(msg);
            return;
        }

        const prevMsg = sortedMsgs[index - 1];
        // If messages are within 60 minutes of each other, consider them the same session
        const THRESHOLD = 60 * 60 * 1000; 

        if (msg.timestamp - prevMsg.timestamp < THRESHOLD) {
            currentSession.push(msg);
        } else {
            sessions.push(currentSession);
            currentSession = [msg];
        }
    });

    if (currentSession.length > 0) {
        sessions.push(currentSession);
    }
    
    // 3. Return newest sessions first
    return sessions.sort((a, b) => {
        const lastMsgA = a[a.length - 1];
        const lastMsgB = b[b.length - 1];
        return lastMsgB.timestamp - lastMsgA.timestamp;
    });
  }, [chatHistory]);

  // --- Aggregated Activity Feed ---
  const activities: ActivityItem[] = [
      ...moodHistory.map(m => ({
          id: `m-${m.id}`,
          type: 'mood' as const,
          timestamp: m.timestamp,
          title: `Mood Logged: ${m.mood}`,
          subtitle: m.note,
          icon: Smile,
          color: 'text-amber-500',
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          data: m
      })),
      ...journalHistory.map(j => ({
          id: `j-${j.id}`,
          type: 'journal' as const,
          timestamp: j.timestamp,
          title: j.title || 'Journal Entry',
          subtitle: j.content.length > 60 ? j.content.substring(0, 60) + '...' : j.content,
          icon: BookOpen,
          color: 'text-indigo-500',
          bg: 'bg-indigo-100 dark:bg-indigo-900/30',
          data: j
      })),
      ...breathingHistory.map(b => ({
          id: `b-${b.id}`,
          type: 'breathing' as const,
          timestamp: b.timestamp,
          title: 'Breathing Focus',
          subtitle: `${Math.floor(b.durationSeconds / 60)}m ${b.durationSeconds % 60}s session`,
          icon: Wind,
          color: 'text-teal-500',
          bg: 'bg-teal-100 dark:bg-teal-900/30',
          data: b
      })),
      // Grouped Chat Sessions
      ...chatSessions.map(session => {
          const lastMsg = session[session.length - 1];
          // Find first user message for a preview text
          const firstUserMsg = session.find(m => m.role === 'user');
          const previewText = firstUserMsg ? `"${firstUserMsg.text}"` : 'Session started';

          return {
              id: `session-${session[0].id}`,
              type: 'chat' as const,
              timestamp: lastMsg.timestamp, // Use the time of the LAST message in the session
              title: 'Voice/Chat Session',
              subtitle: `${session.length} messages • ${previewText}`,
              icon: MessageCircle,
              color: 'text-blue-500',
              bg: 'bg-blue-100 dark:bg-blue-900/30',
              data: session // Store the entire session array
          };
      }),
      ...tasks.map(t => ({
          id: `t-${t.id}`,
          type: 'task' as const,
          timestamp: Number(t.id),
          title: `Task Created: ${t.title}`,
          subtitle: t.category,
          icon: CheckSquare,
          color: 'text-emerald-500',
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          data: t
      })),
      ...sleepHistory.map(s => ({
          id: `s-${s.id}`,
          type: 'sleep' as const,
          timestamp: s.timestamp,
          title: `Sleep Tracked: ${s.hours}h`,
          subtitle: `${s.quality} Quality`,
          icon: Moon,
          color: 'text-indigo-500',
          bg: 'bg-indigo-100 dark:bg-indigo-900/30',
          data: s
      }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const filteredActivities = activities.filter(a => activeFilter === 'all' || a.type === activeFilter);
  const displayedActivities = filteredActivities.slice(0, visibleItems);

  // Group by Date for Display
  const groupedActivities = displayedActivities.reduce((acc, activity) => {
      const date = new Date(activity.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateLabel = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      
      if (date.toDateString() === today.toDateString()) dateLabel = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday';
      
      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(activity);
      return acc;
  }, {} as Record<string, typeof displayedActivities>);

  // --- Detail Modal Renderer ---
  const renderDetailModal = () => {
    if (!selectedActivity) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedActivity(null)}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-scale-in overflow-hidden border border-slate-100 dark:border-slate-800">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedActivity.bg} ${selectedActivity.color}`}>
                            <selectedActivity.icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-800 dark:text-white">{selectedActivity.title}</h3>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                <Clock size={12} className="mr-1.5" />
                                {new Date(selectedActivity.timestamp).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedActivity(null)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto p-6 scroll-smooth">
                    
                    {/* SLEEP VIEW */}
                    {selectedActivity.type === 'sleep' && (
                        <div className="flex flex-col items-center justify-center py-10">
                             <div className="text-6xl font-bold text-indigo-500 mb-2">{(selectedActivity.data as SleepEntry).hours}h</div>
                             <div className="text-xl font-bold text-slate-600 mb-6">{(selectedActivity.data as SleepEntry).quality} Quality</div>
                             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-center text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                                 Consistent sleep is a pillar of mental wellness.
                             </div>
                        </div>
                    )}
                    
                    {/* JOURNAL VIEW */}
                    {selectedActivity.type === 'journal' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                                {(selectedActivity.data as JournalEntry).title}
                            </h2>
                            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-8 text-base whitespace-pre-wrap font-medium">
                                {(selectedActivity.data as JournalEntry).content}
                            </div>
                            
                            {/* Sentiment Badge in Modal */}
                            {(selectedActivity.data as JournalEntry).sentiment && (
                                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Analysis</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${(selectedActivity.data as JournalEntry).sentiment!.label === 'Positive' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : (selectedActivity.data as JournalEntry).sentiment!.label === 'Negative' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                            {(selectedActivity.data as JournalEntry).sentiment!.label} Tone
                                        </span>
                                        {(selectedActivity.data as JournalEntry).sentiment!.emotions.map((emo: string) => (
                                            <span key={emo} className="px-3 py-1 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 border border-indigo-100 dark:border-indigo-800">
                                                {emo}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedActivity.data as JournalEntry).tags && (selectedActivity.data as JournalEntry).tags!.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                    {(selectedActivity.data as JournalEntry).tags!.map(tag => (
                                        <span key={tag} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg">#{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CHAT SESSION VIEW */}
                    {selectedActivity.type === 'chat' && (
                        <div className="space-y-6">
                            {(selectedActivity.data as ChatMessage[]).map((msg, idx) => (
                                <div key={msg.id || idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'model' && (
                                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mr-2 mt-auto shadow-sm border border-slate-50 dark:border-slate-700 shrink-0">
                                            <Bot size={16} className="text-teal-500" />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
                                    }`}>
                                        <div className={`text-[10px] font-bold opacity-70 mb-1 flex items-center gap-1 uppercase tracking-wide ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {msg.role === 'user' ? 'You' : 'Serene'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center ml-2 mt-auto shrink-0">
                                            <User size={16} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* MOOD VIEW */}
                    {selectedActivity.type === 'mood' && (
                        <div className="flex flex-col items-center justify-center py-10">
                             <div className="text-8xl mb-6 transform hover:scale-110 transition-transform duration-500 cursor-default">
                                {(selectedActivity.data as MoodEntry).mood === MoodType.Happy && '😄'}
                                {(selectedActivity.data as MoodEntry).mood === MoodType.Calm && '😌'}
                                {(selectedActivity.data as MoodEntry).mood === MoodType.Neutral && '😐'}
                                {(selectedActivity.data as MoodEntry).mood === MoodType.Sad && '😔'}
                                {(selectedActivity.data as MoodEntry).mood === MoodType.Anxious && '😰'}
                                {(selectedActivity.data as MoodEntry).mood === MoodType.Angry && '😠'}
                             </div>
                             <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">{(selectedActivity.data as MoodEntry).mood}</h3>
                             <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl max-w-sm w-full text-center border border-slate-100 dark:border-slate-700">
                                {(selectedActivity.data as MoodEntry).note ? (
                                    <p className="text-slate-600 dark:text-slate-300 text-lg italic leading-relaxed">"{(selectedActivity.data as MoodEntry).note}"</p>
                                ) : (
                                    <p className="text-slate-400 italic">No note added for this entry.</p>
                                )}
                             </div>
                        </div>
                    )}

                    {/* BREATHING VIEW */}
                    {selectedActivity.type === 'breathing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                             <div className="relative mb-6">
                                <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-xl animate-pulse"></div>
                                <div className="relative w-32 h-32 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center text-teal-500 border-4 border-teal-100 dark:border-teal-800">
                                    <Wind size={64} strokeWidth={1.5} />
                                </div>
                             </div>
                             <div className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
                                {Math.floor((selectedActivity.data as BreathingSession).durationSeconds / 60)}m {(selectedActivity.data as BreathingSession).durationSeconds % 60}s
                             </div>
                             <div className="text-slate-500 font-medium">Focus Session Completed</div>
                        </div>
                    )}
                    
                    {/* TASK VIEW */}
                    {selectedActivity.type === 'task' && (
                        <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
                             <div className={`mb-4 p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400`}>
                                 <CheckSquare size={32} />
                             </div>
                             <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{(selectedActivity.data as Task).title}</h3>
                             <div className="flex items-center gap-2 mb-6">
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    {(selectedActivity.data as Task).category}
                                </span>
                             </div>
                             
                             <div className="w-full pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center px-4">
                                <span className="text-sm font-medium text-slate-500">Current Status</span>
                                <span className={`flex items-center gap-1.5 text-sm font-bold ${(selectedActivity.data as Task).completed ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {(selectedActivity.data as Task).completed ? <Activity size={16}/> : <Clock size={16}/>}
                                    {(selectedActivity.data as Task).completed ? 'Completed' : 'Pending'}
                                </span>
                             </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
  };

  const filterTabs = [
      { id: 'all', label: 'All' },
      { id: 'mood', label: 'Moods' },
      { id: 'journal', label: 'Journals' },
      { id: 'chat', label: 'Chat' },
      { id: 'breathing', label: 'Breathing' },
      { id: 'task', label: 'Tasks' },
      { id: 'sleep', label: 'Sleep' },
  ];

  const timeRangeOptions = [
      { id: 'day', label: 'Today' },
      { id: 'week', label: 'Week' },
      { id: 'month', label: 'Month' },
      { id: 'year', label: 'Year' },
      { id: 'all', label: 'All' }
  ];

  return (
    <div className="h-full overflow-y-auto pb-32 px-6 pt-10 max-w-md mx-auto hide-scrollbar">
      <header className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your journey, day by day.</p>
        </div>
      </header>

      {/* Modern Stats Grid - Bento Style */}
      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-[1.5rem] border border-amber-100 dark:border-amber-800/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50">
                <Smile size={32} className="text-amber-200 dark:text-amber-800" />
            </div>
            <div className="mt-8">
                <div className="text-3xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left">{totalEntries}</div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-1">Mood Logs</div>
            </div>
         </div>
         <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-5 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-800/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50">
                <BookOpen size={32} className="text-indigo-200 dark:text-indigo-800" />
            </div>
            <div className="mt-8">
                <div className="text-3xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left">{journalHistory.length}</div>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-1">Entries</div>
            </div>
         </div>
         <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 p-5 rounded-[1.5rem] border border-teal-100 dark:border-teal-800/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50">
                <Wind size={32} className="text-teal-200 dark:text-teal-800" />
            </div>
            <div className="mt-8">
                <div className="text-3xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left">{breathingHistory.length}</div>
                <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mt-1">Breaths</div>
            </div>
         </div>
         <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-[1.5rem] border border-blue-100 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-50">
                <Moon size={32} className="text-blue-200 dark:text-blue-800" />
            </div>
            <div className="mt-8">
                <div className="text-3xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left">{sleepHistory.length}</div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-1">Sleep Logs</div>
            </div>
         </div>
      </div>

      {/* Mood Frequency Chart (Updated with Time Filters) */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] p-6 mb-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Mood Breakdown</h3>
                    <p className="text-xs text-slate-500">Frequency of emotions</p>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <TrendingUp size={20} className="text-teal-500" />
                </div>
            </div>
            
            {/* Chart Time Filters */}
            <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
                {timeRangeOptions.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => setChartTimeRange(option.id as any)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                            chartTimeRange === option.id 
                                ? 'bg-white dark:bg-slate-600 text-teal-600 dark:text-teal-400 shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="h-48 w-full">
          {totalEntries > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}} 
                        dy={10} 
                    />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip 
                        cursor={{fill: 'transparent'}} 
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 animate-fade-in z-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }}></div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                {data.name}: {data.count} times
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }} 
                    />
                    <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={30}>
                        {moodFrequencyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-3 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mx-2">
                 <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm">
                     <Activity size={18} className="text-slate-300" />
                 </div>
                 <span className="text-xs font-semibold">Log a mood to see trends</span>
             </div>
          )}
        </div>
      </div>

      {/* Sentiment Analysis Chart */}
      {sentimentData.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] p-6 mb-8 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Emotional Tone</h3>
                    <p className="text-xs text-slate-500">Analysis of journal entries</p>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <Gauge size={20} className="text-indigo-500" />
                </div>
            </div>
            
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sentimentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}} 
                            dy={10} 
                        />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                return (
                                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                                            {payload[0].payload.name}: {payload[0].value} entries
                                        </p>
                                    </div>
                                );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                            {sentimentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={
                                    entry.name === 'Positive' ? '#10b981' : // emerald-500
                                    entry.name === 'Negative' ? '#f43f5e' : // rose-500
                                    '#94a3b8' // slate-400
                                } />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
      )}

      {/* Activity Feed Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-2">
         {filterTabs.map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeFilter === tab.id 
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
             >
                 {tab.label}
             </button>
         ))}
      </div>

      {/* Activity List with Grouping */}
      <div className="pb-8">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 px-1 flex items-center gap-2">
              <LayoutList size={18} className="text-slate-400" />
              Recent Activity
          </h3>
          
          <div className="space-y-6">
              {displayedActivities.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-slate-400 dark:text-slate-500 text-sm italic">
                        No activity found.
                      </p>
                  </div>
              ) : (
                  Object.entries(groupedActivities).map(([dateLabel, items]) => (
                      <div key={dateLabel}>
                          <div className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm z-10 py-2 mb-2 px-1">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dateLabel}</h4>
                          </div>
                          <div className="space-y-3">
                              {items.map((item, index) => (
                                  <button 
                                    key={item.id + index}
                                    onClick={() => setSelectedActivity(item)}
                                    className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-start gap-4 group"
                                  >
                                      <div className={`shrink-0 p-3 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                                          <item.icon size={20} />
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start mb-0.5">
                                              <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate pr-2">{item.title}</h4>
                                              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                                                  {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                              </span>
                                          </div>
                                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                                              {item.subtitle}
                                          </p>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>
                  ))
              )}
          </div>
          
          {filteredActivities.length > visibleItems && (
              <div className="mt-8">
                <button 
                    onClick={() => setVisibleItems(prev => prev + 20)}
                    className="w-full py-4 flex items-center justify-center text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md"
                >
                    <ChevronDown size={14} className="mr-1" />
                    Load Previous
                </button>
              </div>
          )}
      </div>
      
      {/* Detail Modal */}
      {renderDetailModal()}

    </div>
  );
};

export default AnalyticsPage;
