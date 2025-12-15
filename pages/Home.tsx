
import React, { useState, useEffect } from 'react';
import { Task, AppTab, SleepEntry } from '../types';
import MoodTracker from '../components/MoodTracker';
import TaskModal from '../components/TaskModal';
import TaskCompletionModal from '../components/TaskCompletionModal';
import MemoryModal from '../components/MemoryModal';
import { generateTaskBreakdown } from '../services/geminiService';
import { CheckCircle2, Circle, Calendar, Mic, Sparkles, ChevronRight, Settings, Plus, Edit2, ArrowDownUp, Download, Bell, Flower, Sprout, TreeDeciduous, Loader2, Info, Moon, ShieldAlert, BookOpen, BarChart2, Brain } from 'lucide-react';

interface HomeProps {
    tasks: Task[];
    sleepHistory?: SleepEntry[];
    onToggleTask: (id: string) => void;
    onSaveTask?: (task: Task) => void;
    onDeleteTask?: (id: string) => void;
    onLogMood: (mood: any, note: string) => void;
    onNavigate: (tab: AppTab, startVoice?: boolean) => void;
    onNavigateToTool?: (toolId: string) => void;
    onOpenSettings?: () => void;
    onOpenCrisis?: () => void;
    userName?: string;
    categories?: string[];
    onAddCategory?: (category: string) => void;
    installPrompt?: any;
    onInstall?: () => void;
    notificationPermission?: NotificationPermission;
    onRequestNotification?: () => Promise<boolean>;
}

type SortOption = 'newest' | 'oldest' | 'due-soon' | 'due-late';

const Home: React.FC<HomeProps> = ({
    tasks,
    sleepHistory = [],
    onToggleTask,
    onSaveTask,
    onDeleteTask,
    onLogMood,
    onNavigate,
    onNavigateToTool,
    onOpenSettings,
    onOpenCrisis,
    userName = "Friend",
    categories = [],
    onAddCategory = () => { },
    installPrompt,
    onInstall,
    notificationPermission,
    onRequestNotification
}) => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Task Completion Modal State
    const [completingTask, setCompletingTask] = useState<Task | null>(null);
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
    const [exitingTaskIds, setExitingTaskIds] = useState<Set<string>>(new Set());

    const [sortOption, setSortOption] = useState<SortOption>('newest');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [showGardenInfo, setShowGardenInfo] = useState(false);
    const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

    // State to track which tasks are currently generating descriptions
    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

    const completedCount = tasks.filter(t => t.completed).length;
    const recentSleep = sleepHistory.length > 0 ? sleepHistory[0] : null;

    // Growth Garden Logic
    const getGrowthStage = () => {
        if (completedCount < 3) return { icon: Sprout, label: "Sprouting", color: "text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" };
        if (completedCount < 10) return { icon: Flower, label: "Blooming", color: "text-pink-400", bg: "bg-pink-100 dark:bg-pink-900/30" };
        return { icon: TreeDeciduous, label: "Thriving", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" };
    };

    const garden = getGrowthStage();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const handleEditTask = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleOpenNewTask = () => {
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const handleTaskClick = (task: Task) => {
        if (task.completed) return;
        setCompletingTask(task);
        setIsCompletionModalOpen(true);
    };

    const handleGenerateDescription = async (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onSaveTask) return;

        setGeneratingIds(prev => new Set(prev).add(task.id));
        try {
            const desc = await generateTaskBreakdown(task.title);
            if (desc) {
                onSaveTask({ ...task, description: desc });
            }
        } catch (e) {
            console.error("Failed to generate description", e);
        } finally {
            setGeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(task.id);
                return next;
            });
        }
    };

    const handleCompleteReflection = (reflection: string) => {
        if (completingTask) {
            // Trigger exit animation
            setExitingTaskIds(prev => new Set(prev).add(completingTask.id));

            // Delay state update to allow animation to play
            setTimeout(() => {
                if (onSaveTask) {
                    const updatedTask: Task = {
                        ...completingTask,
                        completed: true,
                        reflection: reflection
                    };
                    onSaveTask(updatedTask);
                } else {
                    onToggleTask(completingTask.id);
                }
                setExitingTaskIds(prev => {
                    const next = new Set(prev);
                    next.delete(completingTask.id);
                    return next;
                });
                setCompletingTask(null);
            }, 600); // Wait for fade-out (approx 0.5s)
        }
        setIsCompletionModalOpen(false);
    };

    const getSortedTasks = () => {
        // Filter out completed tasks unless they are currently animating out
        let visibleTasks = tasks.filter(t => !t.completed || exitingTaskIds.has(t.id));

        switch (sortOption) {
            case 'newest':
                return visibleTasks.sort((a, b) => Number(b.id) - Number(a.id));
            case 'oldest':
                return visibleTasks.sort((a, b) => Number(a.id) - Number(b.id));
            case 'due-soon':
                return visibleTasks.sort((a, b) => {
                    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    return dateA - dateB;
                });
            case 'due-late':
                return visibleTasks.sort((a, b) => {
                    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : -Infinity;
                    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : -Infinity;
                    return dateB - dateA;
                });
            default:
                return visibleTasks;
        }
    };

    const displayedTasks = getSortedTasks();

    return (
        <div className="h-full overflow-y-auto pb-32 px-6 pt-10 max-w-md mx-auto hide-scrollbar">
            {/* Header */}
            <header className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{getGreeting()},</h1>
                    <h1 className="text-3xl font-light text-slate-500 dark:text-slate-400 tracking-tight">{userName}</h1>

                    {/* Growth Garden Pill */}
                    <div className="relative z-20">
                        <button
                            onClick={() => setShowGardenInfo(!showGardenInfo)}
                            className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 ${garden.bg} transition-all active:scale-95 hover:brightness-95 dark:hover:brightness-110`}
                        >
                            <garden.icon size={14} className={garden.color} />
                            <span className={`text-xs font-bold ${garden.color.replace('text-', 'text-slate-600 dark:text-')}`}>
                                Your garden is {garden.label}
                            </span>
                            <Info size={12} className="text-slate-400 dark:text-slate-500 ml-1" />
                        </button>

                        {showGardenInfo && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowGardenInfo(false)}></div>
                                <div className="absolute top-full left-0 mt-2 z-20 w-64 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-100 dark:border-slate-700 animate-slide-up-fade">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Growth Garden</h4>
                                        <button onClick={() => setShowGardenInfo(false)} className="text-slate-400 hover:text-slate-600">
                                            <Info size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium">
                                        Complete tasks to grow your digital garden. Consistency is key!
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                                <Sprout size={12} className="text-emerald-500" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Sprouting</div>
                                                <div className="text-[10px] text-slate-400">0-2 tasks completed</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
                                                <Flower size={12} className="text-pink-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Blooming</div>
                                                <div className="text-[10px] text-slate-400">3-9 tasks completed</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                                <TreeDeciduous size={12} className="text-green-500" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Thriving</div>
                                                <div className="text-[10px] text-slate-400">10+ tasks completed</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsMemoryModalOpen(true)}
                        className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                        title="My Memory"
                    >
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Brain className="text-indigo-600 dark:text-indigo-400" size={20} />
                        </div>
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                            <Settings className="text-slate-600 dark:text-slate-300" size={20} />
                        </div>
                    </button>
                </div>
            </header>

            {/* Wellness Snapshot / Daily Sleep - NEW FEATURE */}
            <div className="flex gap-3 mb-6 animate-slide-up">
                <button
                    onClick={() => onNavigateToTool && onNavigateToTool('sleep')}
                    className="flex-1 bg-indigo-600 text-white rounded-[2rem] p-5 shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors text-left relative overflow-hidden"
                >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                            <Moon size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Last Sleep</span>
                        </div>
                        {recentSleep ? (
                            <div>
                                <span className="text-3xl font-bold">{recentSleep.hours}</span>
                                <span className="text-lg opacity-60 font-medium"> hrs</span>
                                <div className="text-xs font-bold bg-white/20 inline-block px-2 py-0.5 rounded-md mt-1">{recentSleep.quality}</div>
                            </div>
                        ) : (
                            <div>
                                <span className="text-xl font-bold block mb-1">Log Sleep</span>
                                <span className="text-xs opacity-70">Track your rest</span>
                            </div>
                        )}
                    </div>
                </button>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                        <Sparkles size={16} className="text-teal-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Streak</span>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-slate-800 dark:text-white">{completedCount > 0 ? completedCount : 0}</span>
                        <span className="text-xs text-slate-400 font-medium block">Tasks Done</span>
                    </div>
                </div>
            </div>

            {/* Enable Notifications Banner */}
            {notificationPermission === 'default' && onRequestNotification && (
                <div className="mb-6 animate-slide-up">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-[2rem] p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 dark:bg-indigo-800/30 rounded-full -mr-10 -mt-10 blur-xl"></div>
                        <div className="flex items-center space-x-4 relative z-10">
                            <div className="w-12 h-12 bg-white dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Get Daily Reminders</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">9:00 AM mood check-ins</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onRequestNotification()}
                            className="relative z-10 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-200 dark:hover:shadow-none active:scale-95"
                        >
                            Enable
                        </button>
                    </div>
                </div>
            )}

            {/* Mood Tracker Section */}
            <section className="mb-8">
                <MoodTracker
                    onLogMood={onLogMood}
                    onNavigate={onNavigate}
                    onNavigateToTool={onNavigateToTool}
                />
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => onNavigate(AppTab.Chat)}
                    className="group relative p-5 bg-white dark:bg-slate-800 rounded-[2rem] border border-indigo-50 dark:border-slate-700 shadow-sm hover:shadow-indigo-100/50 dark:hover:shadow-none transition-all active:scale-95 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between items-start">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Calendar size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-slate-800 dark:text-white">Chat</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">AI Companion</div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => onNavigate(AppTab.Tools)}
                    className="group relative p-5 bg-white dark:bg-slate-800 rounded-[2rem] border border-teal-50 dark:border-slate-700 shadow-sm hover:shadow-teal-100/50 dark:hover:shadow-none transition-all active:scale-95 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-teal-50 dark:bg-teal-900/20 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between items-start">
                        <div className="p-3 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-2xl mb-2 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <Sparkles size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-slate-800 dark:text-white">Relax</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Exercises</div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => onNavigate(AppTab.Library)}
                    className="group relative p-5 bg-white dark:bg-slate-800 rounded-[2rem] border border-emerald-50 dark:border-slate-700 shadow-sm hover:shadow-emerald-100/50 dark:hover:shadow-none transition-all active:scale-95 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between items-start">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <BookOpen size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-slate-800 dark:text-white">Learn</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Library</div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => onNavigate(AppTab.Analytics)}
                    className="group relative p-5 bg-white dark:bg-slate-800 rounded-[2rem] border border-orange-50 dark:border-slate-700 shadow-sm hover:shadow-orange-100/50 dark:hover:shadow-none transition-all active:scale-95 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between items-start">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl mb-2 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <BarChart2 size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-slate-800 dark:text-white">Stats</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Insights</div>
                        </div>
                    </div>
                </button>

                {/* Live Voice Card */}
                <button
                    onClick={() => onNavigate(AppTab.Chat, true)}
                    className="col-span-2 relative p-1 rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 shadow-xl shadow-slate-200 dark:shadow-slate-900/50 active:scale-[0.98] transition-transform overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="relative bg-slate-900/50 dark:bg-slate-900/30 backdrop-blur-sm rounded-[1.8rem] p-5 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-teal-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
                                <div className="w-12 h-12 bg-slate-800 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-teal-500/50 transition-colors">
                                    <Mic className="text-teal-400" size={24} />
                                </div>
                            </div>
                            <div className="text-left">
                                <div className="text-white font-bold text-lg">Live Voice</div>
                                <div className="text-slate-400 text-xs font-medium">Speak naturally with Serene</div>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <ChevronRight className="text-white" size={18} />
                        </div>
                    </div>
                </button>
            </section>

            {/* Tasks Section */}
            <section>
                <div className="flex justify-between items-center mb-4 px-2 relative">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tasks to Do</h2>
                        {displayedTasks.length > 0 && (
                            <span className="text-[10px] font-bold bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-full">{displayedTasks.length}</span>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Sort Button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${isSortMenuOpen ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                                <ArrowDownUp size={14} />
                            </button>

                            {isSortMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsSortMenuOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 overflow-hidden animate-slide-up-fade p-1">
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 mb-1">Sort By</div>
                                        {(['newest', 'oldest', 'due-soon', 'due-late'] as SortOption[]).map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setSortOption(opt);
                                                    setIsSortMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${sortOption === opt ? 'bg-slate-100 dark:bg-slate-700 text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                            >
                                                {opt === 'newest' && 'Newest First'}
                                                {opt === 'oldest' && 'Oldest First'}
                                                {opt === 'due-soon' && 'Due Soonest'}
                                                {opt === 'due-late' && 'Due Latest'}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleOpenNewTask}
                            className="flex items-center space-x-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform"
                        >
                            <Plus size={14} />
                            <span>Add</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {displayedTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-3">
                                <Sparkles className="text-slate-300 dark:text-slate-600" size={24} />
                            </div>
                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">All clear! Great job.</p>
                        </div>
                    ) : (
                        displayedTasks.map((task) => {
                            const isExiting = exitingTaskIds.has(task.id);

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => handleTaskClick(task)}
                                    className={`group relative p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 cursor-pointer ${isExiting ? 'animate-fade-out scale-95 opacity-0' : 'hover:shadow-md hover:border-teal-100 dark:hover:border-teal-900 hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div className="flex items-start">
                                        {/* Checkbox */}
                                        <div className={`mt-0.5 mr-4 transition-colors duration-300 ${isExiting ? 'text-emerald-500 scale-110' : 'text-slate-300 dark:text-slate-600 group-hover:text-teal-500'}`}>
                                            {isExiting ? <CheckCircle2 size={24} className="animate-checkbox-pop" /> : <Circle size={24} strokeWidth={2} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Title & Category */}
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-snug mr-2">
                                                    {task.title}
                                                </h4>
                                                <button
                                                    onClick={(e) => handleEditTask(task, e)}
                                                    className="p-1.5 -mr-1 -mt-1 rounded-full text-slate-300 hover:text-teal-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${task.category === 'Work' ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' :
                                                    task.category === 'Personal' ? 'bg-purple-50 text-purple-500 dark:bg-purple-900/20' :
                                                        task.category === 'Wellness' ? 'bg-teal-50 text-teal-500 dark:bg-teal-900/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                                                    }`}>
                                                    {task.category}
                                                </span>
                                                {task.dueDate && (
                                                    <span className="text-[10px] text-slate-400 font-medium flex items-center">
                                                        <Calendar size={10} className="mr-1" />
                                                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Description/Instructions Block */}
                                            {task.description ? (
                                                <div className="mt-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-100/50 dark:border-indigo-800/30">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Sparkles size={10} className="text-indigo-500 dark:text-indigo-400" />
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">How to perform</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                                        {task.description}
                                                    </p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleGenerateDescription(task, e)}
                                                    disabled={generatingIds.has(task.id)}
                                                    className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 px-2 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors w-fit"
                                                >
                                                    {generatingIds.has(task.id) ? (
                                                        <Loader2 size={10} className="animate-spin" />
                                                    ) : (
                                                        <Sparkles size={10} />
                                                    )}
                                                    <span>Generate Instructions</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section >

            {/* Task Creation Modal */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={(task) => onSaveTask && onSaveTask(task)}
                onDelete={(id) => onDeleteTask && onDeleteTask(id)}
                taskToEdit={editingTask}
                categories={categories}
                onAddCategory={onAddCategory}
            />

            {/* Task Completion/Reflection Modal */}
            <TaskCompletionModal
                isOpen={isCompletionModalOpen}
                onClose={() => {
                    setIsCompletionModalOpen(false);
                    setCompletingTask(null);
                }}
                onComplete={handleCompleteReflection}
                task={completingTask}
            />

            {/* Memory Manager Modal */}
            <MemoryModal
                isOpen={isMemoryModalOpen}
                onClose={() => setIsMemoryModalOpen(false)}
            />
        </div>
    );
};

export default Home;
