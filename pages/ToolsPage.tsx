
import React, { useState, useEffect } from 'react';
import { Wind, BookOpen, CheckSquare, X, Sparkles, Plus, Calendar, ChevronLeft, ChevronDown, ChevronUp, ClipboardCheck, Tag, ListTodo, Loader2, Gauge, Clock, Moon, Wand2 } from 'lucide-react';
import BreathingExercise from '../components/BreathingExercise';
import SelfAssessmentModal from '../components/SelfAssessmentModal';
import TaskModal from '../components/TaskModal';
import TaskCompletionModal from '../components/TaskCompletionModal';
import { JournalEntry, MoodEntry, Task, SleepEntry, ThoughtRecord } from '../types';
import { getJournalPrompt, generateTaskBreakdown, analyzeSentiment } from '../services/geminiService';

interface ToolsPageProps {
  journalEntries: JournalEntry[];
  moodHistory: MoodEntry[];
  tasks: Task[];
  onAddJournal: (entry: JournalEntry) => void;
  onLogBreathing: (seconds: number) => void;
  onToggleTask: (id: string) => void;
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  onLogSleep?: (entry: SleepEntry) => void;
  sleepHistory?: SleepEntry[];
  onSaveThoughtRecord?: (record: ThoughtRecord) => void;
  initialActiveTool?: string | null;
  onClearActiveTool?: () => void;
}

const JournalEntryItem: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = entry.content.length > 80 || entry.content.includes('\n');
  
  const getSentimentColor = () => {
      if (entry.sentiment?.label === 'Positive') return 'bg-emerald-400';
      if (entry.sentiment?.label === 'Negative') return 'bg-rose-400';
      return 'bg-slate-300 dark:bg-slate-600';
  };

  return (
    <div className={`relative group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 ${isExpanded ? 'ring-1 ring-indigo-500/20 shadow-md' : 'hover:shadow-md hover:-translate-y-0.5'}`}>
        {/* Sentiment Strip */}
        <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full ${getSentimentColor()}`}></div>

        <div className="p-5 pl-7">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-4">
                    <h4 className={`font-bold text-slate-800 dark:text-slate-200 text-base mb-1 ${isExpanded ? '' : 'truncate'}`}>{entry.title}</h4>
                    
                    {/* Date Badge */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Calendar size={12} />
                        <span>{new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span>{new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                
                {/* Sentiment Icon */}
                {entry.sentiment && (
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.sentiment.label === 'Positive' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20' :
                        entry.sentiment.label === 'Negative' ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' :
                        'bg-slate-50 text-slate-400 dark:bg-slate-800'
                    }`}>
                        <Gauge size={16} />
                    </div>
                )}
            </div>

            <div className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-3'}`}>
                {entry.content}
            </div>
            
            {/* Tags & Emotions */}
            <div className="flex flex-wrap gap-2 mt-4 items-center">
                {entry.sentiment?.emotions.map((emotion, idx) => (
                    <span key={`emo-${idx}`} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30">
                        {emotion}
                    </span>
                ))}

                {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2 ml-1">
                        {entry.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] font-medium px-2 py-0.5 text-slate-500 dark:text-slate-400">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {isLong && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="mt-4 w-full py-2 flex items-center justify-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                    {isExpanded ? (
                        <>Show Less <ChevronUp size={14} /></>
                    ) : (
                        <>Read Full Entry <ChevronDown size={14} /></>
                    )}
                </button>
            )}
        </div>
    </div>
  );
};

const TasksView: React.FC<{ 
    onClose: () => void, 
    tasks: Task[], 
    onSaveTask: (task: Task) => void,
    onDeleteTask: (id: string) => void,
    onToggleTask: (id: string) => void,
    categories: string[],
    onAddCategory: (cat: string) => void
}> = ({ onClose, tasks, onSaveTask, onDeleteTask, onToggleTask, categories, onAddCategory }) => {
    // ... (TasksView Implementation remains same)
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [completingTask, setCompletingTask] = useState<Task | null>(null);
    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

    const filteredTasks = tasks.filter(t => {
        if (filter === 'pending') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    }).sort((a, b) => Number(b.id) - Number(a.id));

    const handleEdit = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleTaskClick = (task: Task) => {
        if (task.completed) {
            onToggleTask(task.id);
        } else {
            setCompletingTask(task);
        }
    };

    const handleGenerateDescription = async (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        setGeneratingIds(prev => new Set(prev).add(task.id));
        try {
            const desc = await generateTaskBreakdown(task.title);
            if (desc) {
                onSaveTask({ ...task, description: desc });
            }
        } finally {
            setGeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(task.id);
                return next;
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col animate-fade-in">
            <div className="px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                    <CheckSquare className="mr-3 text-emerald-500" size={24} />
                    Task Organizer
                </h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-32 hide-scrollbar">
                {/* Filter Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                    {(['all', 'pending', 'completed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                                filter === f 
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Add New Button */}
                <button 
                    onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                    className="w-full p-4 mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                    <Plus size={18} />
                    Add New Task
                </button>

                <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-slate-600 text-sm italic">
                            No tasks found in this view.
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => handleTaskClick(task)}
                                className={`group relative flex items-start p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                    task.completed 
                                        ? 'bg-slate-50/80 dark:bg-slate-900/50 border-transparent opacity-75' 
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'
                                }`}
                            >
                                <div className={`mr-4 mt-0.5 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-emerald-500'}`}>
                                    {task.completed ? <CheckSquare size={22} /> : <div className="w-[22px] h-[22px] rounded-full border-2 border-current"></div>}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {task.title}
                                    </h4>
                                    
                                    {task.description && !task.completed && (
                                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg leading-relaxed whitespace-pre-line border border-slate-100 dark:border-slate-800">
                                            {task.description}
                                        </div>
                                    )}

                                    {!task.description && !task.completed && (
                                         <button
                                            onClick={(e) => handleGenerateDescription(task, e)}
                                            disabled={generatingIds.has(task.id)}
                                            className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 px-2 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors w-fit"
                                         >
                                             {generatingIds.has(task.id) ? (
                                                 <Loader2 size={10} className="animate-spin" />
                                             ) : (
                                                 <Sparkles size={10} />
                                             )}
                                             <span>Auto-Suggest Steps</span>
                                         </button>
                                    )}

                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {task.category}
                                        </span>
                                    </div>
                                </div>

                                <button 
                                    onClick={(e) => handleEdit(task, e)}
                                    className="p-2 rounded-full text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <ListTodo size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <TaskModal 
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={onSaveTask}
                onDelete={onDeleteTask}
                taskToEdit={editingTask}
                categories={categories}
                onAddCategory={onAddCategory}
            />

            <TaskCompletionModal 
                isOpen={!!completingTask}
                onClose={() => setCompletingTask(null)}
                onComplete={(reflection) => {
                    if (completingTask) {
                        onSaveTask({ ...completingTask, completed: true, reflection });
                        setCompletingTask(null);
                    }
                }}
                task={completingTask}
            />
        </div>
    );
};

const SleepTracker: React.FC<{ onClose: () => void, onLogSleep: (entry: SleepEntry) => void }> = ({ onClose, onLogSleep }) => {
    const [hours, setHours] = useState(7.5);
    const [quality, setQuality] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Good');

    const handleLog = () => {
        onLogSleep({
            id: Date.now().toString(),
            timestamp: Date.now(),
            hours,
            quality
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
             <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-scale-in">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                         <Moon className="text-indigo-500" size={24} />
                         Sleep Tracker
                     </h3>
                     <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                         <X size={20} className="text-slate-500" />
                     </button>
                 </div>

                 <div className="space-y-8 mb-8">
                     {/* Hours Slider */}
                     <div className="text-center">
                         <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2 font-mono">
                             {hours} <span className="text-sm font-sans text-slate-400 font-medium">hours</span>
                         </div>
                         <input 
                             type="range" 
                             min="0" 
                             max="12" 
                             step="0.5" 
                             value={hours}
                             onChange={(e) => setHours(parseFloat(e.target.value))}
                             className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                         />
                     </div>

                     {/* Quality Selection */}
                     <div>
                         <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Quality of Rest</label>
                         <div className="grid grid-cols-2 gap-3">
                             {['Excellent', 'Good', 'Fair', 'Poor'].map((q) => (
                                 <button
                                     key={q}
                                     onClick={() => setQuality(q as any)}
                                     className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                         quality === q 
                                             ? 'bg-indigo-600 text-white shadow-lg' 
                                             : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                     }`}
                                 >
                                     {q}
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>

                 <button 
                     onClick={handleLog}
                     className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform"
                 >
                     Log Sleep
                 </button>
             </div>
        </div>
    );
};

const ToolsPage: React.FC<ToolsPageProps> = ({ 
    journalEntries = [], 
    moodHistory = [],
    tasks = [],
    onAddJournal, 
    onLogBreathing,
    onToggleTask,
    onSaveTask,
    onDeleteTask,
    categories,
    onAddCategory,
    onLogSleep = () => {},
    sleepHistory = [],
    initialActiveTool = null,
    onClearActiveTool = () => {}
}) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  // Journal State
  const [isWriting, setIsWriting] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [journalTags, setJournalTags] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Deep linking effect
  useEffect(() => {
    if (initialActiveTool) {
        setActiveTool(initialActiveTool);
        if (initialActiveTool === 'journal') {
             setIsWriting(true);
        }
        onClearActiveTool();
    }
  }, [initialActiveTool, onClearActiveTool]);

  const tools = [
    {
      id: 'tasks',
      title: 'Task Organizer',
      desc: 'Manage & Plan',
      icon: ListTodo,
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-800'
    },
    {
      id: 'assessment',
      title: 'Self Check-in',
      desc: 'AI Wellness Report',
      icon: ClipboardCheck,
      bg: 'bg-violet-50 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-100 dark:border-violet-800'
    },
    {
      id: 'breathing',
      title: 'Breathing',
      desc: 'Focus & Calm',
      icon: Wind,
      bg: 'bg-teal-50 dark:bg-teal-900/30',
      iconColor: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-100 dark:border-teal-800'
    },
    {
      id: 'journal',
      title: 'Journal',
      desc: 'Reflect Daily',
      icon: BookOpen,
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-800'
    },
    {
        id: 'sleep',
        title: 'Sleep Hygiene',
        desc: 'Track Rest',
        icon: Moon,
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-100 dark:border-blue-800'
    }
  ];

  const handleSaveJournal = async () => {
    if (!journalTitle.trim() && !journalContent.trim()) return;
    
    setIsAnalyzing(true);
    let sentimentData = undefined;
    
    // Auto-Analyze Sentiment if there is content
    if (journalContent.length > 20) {
        sentimentData = await analyzeSentiment(journalContent);
        // Auto-add keywords as tags if not present
        if (sentimentData.keywords) {
            sentimentData.keywords.forEach(k => {
                if (!journalTags.includes(k) && journalTags.length < 5) {
                    journalTags.push(k);
                }
            });
        }
    }

    const newEntry: JournalEntry = {
        id: Date.now().toString(),
        title: journalTitle || 'Untitled Entry',
        content: journalContent,
        timestamp: Date.now(),
        tags: journalTags,
        sentiment: sentimentData
    };
    
    onAddJournal(newEntry);
    setJournalTitle('');
    setJournalContent('');
    setJournalTags([]);
    setTagInput('');
    setIsWriting(false);
    setIsAnalyzing(false);
  };

  const handleAddTag = () => {
      if (tagInput.trim() && !journalTags.includes(tagInput.trim())) {
          setJournalTags([...journalTags, tagInput.trim()]);
          setTagInput('');
      }
  };

  const removeTag = (tagToRemove: string) => {
      setJournalTags(journalTags.filter(tag => tag !== tagToRemove));
  };

  const handleGeneratePrompt = async () => {
      setIsGeneratingPrompt(true);
      const prompt = await getJournalPrompt();
      setJournalTitle(prompt);
      setIsGeneratingPrompt(false);
  };

  const handleBreathingClose = (duration: number) => {
    if (duration > 0) {
        onLogBreathing(duration);
    }
    setActiveTool(null);
  };

  const renderJournal = () => {
      if (isWriting) {
          return (
              <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[60] flex flex-col animate-slide-up">
                  {/* Journal Header */}
                  <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => setIsWriting(false)} 
                        className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                      >
                          <ChevronLeft size={24} />
                      </button>
                      <h3 className="font-bold text-slate-800 dark:text-white">New Entry</h3>
                      <button 
                        onClick={handleSaveJournal}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm bg-teal-50 dark:bg-teal-900/30 px-4 py-2 rounded-full shadow-sm"
                      >
                          {isAnalyzing && <Loader2 size={12} className="animate-spin" />}
                          Save
                      </button>
                  </div>
                  
                  {/* Editor */}
                  <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString()}</span>
                         <button 
                            onClick={handleGeneratePrompt}
                            disabled={isGeneratingPrompt}
                            className="flex items-center space-x-1 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg"
                         >
                             {isGeneratingPrompt ? (
                                 <Sparkles className="animate-spin" size={14} />
                             ) : (
                                 <Wand2 size={14} />
                             )}
                             <span>Inspire Me</span>
                         </button>
                      </div>

                      <input 
                          type="text" 
                          placeholder="Title or Prompt..."
                          value={journalTitle}
                          onChange={(e) => setJournalTitle(e.target.value)}
                          className="w-full text-2xl font-bold text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 bg-transparent border-none focus:outline-none mb-4"
                      />
                      
                      <textarea
                          placeholder="Start writing your thoughts..."
                          value={journalContent}
                          onChange={(e) => setJournalContent(e.target.value)}
                          className="flex-1 w-full resize-none text-base leading-relaxed text-slate-600 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 bg-transparent border-none focus:outline-none mb-4"
                      />

                      {/* Tag Input Section */}
                      <div className="mt-auto">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {journalTags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                    #{tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-indigo-800 dark:hover:text-indigo-200">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
                            <Tag size={16} className="text-slate-400" />
                            <input 
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                placeholder="Add tags..."
                                className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
                            />
                            {tagInput && (
                                <button onClick={handleAddTag} className="text-indigo-500 font-bold text-xs">Add</button>
                            )}
                        </div>
                      </div>
                  </div>
              </div>
          );
      }

      return (
          <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col animate-fade-in">
              <div className="px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                      <BookOpen className="mr-3 text-amber-500" size={24} />
                      Journal
                  </h2>
                  <button onClick={() => setActiveTool(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <X size={20} className="text-slate-600 dark:text-slate-400" />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-32 hide-scrollbar">
                  {/* New Entry Card */}
                  <button 
                    onClick={() => setIsWriting(true)}
                    className="w-full p-6 mb-8 rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between group shadow-sm hover:shadow-lg transition-all"
                  >
                      <div className="text-left">
                          <div className="font-bold text-amber-900 dark:text-amber-100 text-lg mb-1">Write new entry</div>
                          <div className="text-amber-700/70 dark:text-amber-200/50 text-xs font-medium">Clear your mind • Reflect • Grow</div>
                      </div>
                      <div className="w-14 h-14 bg-white dark:bg-amber-900/50 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform relative">
                          <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping opacity-20"></div>
                          <Plus className="text-amber-600 dark:text-amber-400" size={28} />
                      </div>
                  </button>

                  {/* History List */}
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Clock size={16} className="text-slate-400" /> 
                      Past Entries
                  </h3>
                  <div className="space-y-5">
                      {journalEntries.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 dark:text-slate-600 text-sm bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                              Your journal is empty.
                          </div>
                      ) : (
                          journalEntries.map(entry => (
                              <JournalEntryItem key={entry.id} entry={entry} />
                          ))
                      )}
                  </div>
              </div>
          </div>
      );
  }

  const renderContent = () => {
      if (activeTool === 'assessment') {
          return (
              <SelfAssessmentModal 
                isOpen={true}
                onClose={() => setActiveTool(null)}
                moodHistory={moodHistory}
                journalHistory={journalEntries}
                tasks={tasks}
              />
          );
      }
      if (activeTool === 'tasks') {
          return (
              <TasksView 
                  onClose={() => setActiveTool(null)} 
                  tasks={tasks}
                  onSaveTask={onSaveTask}
                  onDeleteTask={onDeleteTask}
                  onToggleTask={onToggleTask}
                  categories={categories}
                  onAddCategory={onAddCategory}
              />
          );
      }
      if (activeTool === 'breathing') {
          return <BreathingExercise onClose={handleBreathingClose} />
      }
      if (activeTool === 'journal') {
          return renderJournal();
      }
      if (activeTool === 'sleep') {
          return <SleepTracker onClose={() => setActiveTool(null)} onLogSleep={onLogSleep} />
      }
      if (activeTool) {
          return (
              <div className="fixed inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 animate-fade-in text-center">
                  <button onClick={() => setActiveTool(null)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <X size={24} className="text-slate-600 dark:text-slate-400" />
                  </button>
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                      <Sparkles size={32} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 capitalize">{activeTool}</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xs">We are crafting this experience to be perfect for you. Check back soon.</p>
              </div>
          )
      }
      return null;
  }

  return (
    <div className="h-full overflow-y-auto pb-32 px-6 pt-10 max-w-md mx-auto hide-scrollbar">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Wellness Hub</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Tools to restore your balance.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex flex-col p-5 bg-white dark:bg-slate-800 border ${tool.border} rounded-[2rem] shadow-sm hover:shadow-md transition-all active:scale-95 text-left h-40 justify-between group`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tool.bg} ${tool.iconColor} transition-transform group-hover:scale-110`}>
              <tool.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">{tool.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{tool.desc}</p>
            </div>
          </button>
        ))}
      </div>
      
      {renderContent()}
    </div>
  );
};

export default ToolsPage;
