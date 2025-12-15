
import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { dbService } from './services/dbService';
import AuthPage from './pages/AuthPage';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import ChatPage from './pages/ChatPage';
import ToolsPage from './pages/ToolsPage';
import LibraryPage from './pages/LibraryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsModal from './components/SettingsModal';
import CrisisResourceModal from './components/CrisisResourceModal';
import OnboardingFlow from './components/OnboardingFlow';
import FirestoreRulesHelp from './components/FirestoreRulesHelp';
import UrgeSurfingModal from './components/UrgeSurfingModal';
import { AppTab, Task, MoodEntry, ChatMessage, MoodType, JournalEntry, BreathingSession, UserProfile, SleepEntry, ThoughtRecord } from './types';
import { detectCrisis } from './services/geminiService';
import { useNotifications } from './hooks/useNotifications';
import { Loader2 } from 'lucide-react';

// Declare global window type for custom property
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

// Inner App Component to handle Auth Logic
const AuthenticatedApp: React.FC = () => {
  const { currentUser, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Home);
  const [activeTool, setActiveTool] = useState<string | null>(null); // State for deep linking to tools
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // App State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [journalHistory, setJournalHistory] = useState<JournalEntry[]>([]);
  const [breathingHistory, setBreathingHistory] = useState<BreathingSession[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [isUrgeSurfingOpen, setIsUrgeSurfingOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Transient state for launching voice directly from other tabs
  const [launchVoice, setLaunchVoice] = useState(false);

  // Notification Hook
  const { permission: notificationPermission, requestPermission: requestNotificationPermission } = useNotifications(tasks);

  // Load Data from Firestore when User is authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      setPermissionError(false);

      try {
        const profile = await dbService.getUserProfile(currentUser.uid);
        setUserProfile(profile);

        if (profile?.hasOnboarded) {
          const [lTasks, lMoods, lJournals, lBreathing, lChat, lSleep, lCats] = await Promise.all([
            dbService.getCollection<Task>(currentUser.uid, 'tasks'),
            dbService.getCollection<MoodEntry>(currentUser.uid, 'moods'),
            dbService.getCollection<JournalEntry>(currentUser.uid, 'journals'),
            dbService.getCollection<BreathingSession>(currentUser.uid, 'breathing'),
            dbService.getChatHistory(currentUser.uid),
            dbService.getCollection<SleepEntry>(currentUser.uid, 'sleep'),
            dbService.getCategories(currentUser.uid)
          ]);

          // Sort collections locally after fetch (Firestore generic query is unsorted)
          // Sort and Sanitize Chat History
          const uniqueChat = new Map();
          lChat.forEach(msg => {
            // Filter out garbage strings or missing IDs
            if (msg && typeof msg === 'object' && msg.id) {
              uniqueChat.set(msg.id, msg);
            }
          });
          const sortedChat = Array.from(uniqueChat.values()).sort((a, b) => a.timestamp - b.timestamp);

          setTasks(lTasks.sort((a, b) => Number(b.id) - Number(a.id)));
          setMoodHistory(lMoods.sort((a, b) => a.timestamp - b.timestamp));
          setJournalHistory(lJournals.sort((a, b) => b.timestamp - a.timestamp));
          setBreathingHistory(lBreathing);
          setChatHistory(sortedChat);
          setSleepHistory(lSleep.sort((a, b) => a.timestamp - b.timestamp));
          setCategories(lCats);
        }
      } catch (error: any) {
        console.error("Failed to load user data:", error);
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          setPermissionError(true);
        }
      } finally {
        setIsDataLoaded(true);
      }
    };

    if (!loading) {
      if (currentUser) {
        loadUserData();
      } else {
        setIsDataLoaded(true); // No user, nothing to load
      }
    }
  }, [currentUser, loading]);

  // Enforce Light Mode
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    if (window.deferredPrompt) {
      setInstallPrompt(window.deferredPrompt);
    }
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Handlers
  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    // Reset active tool when switching tabs manually, unless we are navigating via code
    if (tab !== AppTab.Tools) {
      setActiveTool(null);
    }
  };

  const handleNavigate = (tab: AppTab, startVoice: boolean = false) => {
    setActiveTab(tab);
    setLaunchVoice(startVoice);
    setActiveTool(null);
  };

  const handleNavigateToTool = (toolId: string) => {
    setActiveTab(AppTab.Tools);
    setActiveTool(toolId);
  };

  const handleAddTask = (task: Task) => {
    setTasks(prev => [task, ...prev]);
    if (currentUser) dbService.saveTask(currentUser.uid, task).catch(err => {
      if (err.code === 'permission-denied') setPermissionError(true);
    });

    if (!categories.includes(task.category)) {
      const newCats = [...categories, task.category];
      setCategories(newCats);
      if (currentUser) dbService.saveCategories(currentUser.uid, newCats);
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === updatedTask.id);
      if (exists) {
        return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      }
      return [updatedTask, ...prev];
    });
    if (currentUser) dbService.saveTask(currentUser.uid, updatedTask);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (currentUser) dbService.deleteTask(currentUser.uid, id);
  };

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const updated = { ...task, completed: !task.completed };
      handleUpdateTask(updated);
    }
  };

  const handleLogMood = (mood: MoodType, note: string) => {
    if (detectCrisis(note)) setIsCrisisModalOpen(true);

    const entry: MoodEntry = {
      id: Date.now().toString(),
      mood,
      note,
      timestamp: Date.now()
    };
    setMoodHistory(prev => [...prev, entry]);
    if (currentUser) dbService.saveMood(currentUser.uid, entry);
  };

  const handleAddJournal = (entry: JournalEntry) => {
    if (detectCrisis(entry.title) || detectCrisis(entry.content)) setIsCrisisModalOpen(true);
    setJournalHistory(prev => [entry, ...prev]);
    if (currentUser) dbService.saveJournal(currentUser.uid, entry);
  };

  const handleLogBreathing = (seconds: number) => {
    const session: BreathingSession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      durationSeconds: seconds
    };
    setBreathingHistory(prev => [session, ...prev]);
    if (currentUser) dbService.saveBreathingSession(currentUser.uid, session);
  };

  const handleLogSleep = (entry: SleepEntry) => {
    setSleepHistory(prev => [entry, ...prev]);
    if (currentUser) dbService.saveSleepEntry(currentUser.uid, entry);
  };

  const handleSaveThoughtRecord = (record: ThoughtRecord) => {
    // For now we just save to DB, we can add to analytics later
    if (currentUser) dbService.saveThoughtRecord(currentUser.uid, record);
  };

  const handleAddMessage = (msg: ChatMessage) => {
    // Sanity check: Ensure valid object
    if (!msg || typeof msg !== 'object' || !msg.id) {
      console.warn("Invalid message passed to handleAddMessage", msg);
      return;
    }

    if (msg.role === 'user' && detectCrisis(msg.text)) setIsCrisisModalOpen(true);

    setChatHistory(prev => {
      // Robust deduplication based on ID
      const existsIndex = prev.findIndex(m => m.id === msg.id);

      if (existsIndex !== -1) {
        // Update existing
        const newHistory = [...prev];
        newHistory[existsIndex] = msg;
        return newHistory;
      }

      // Add new
      return [...prev, msg];
    });

    if (currentUser) dbService.saveChatMessage(currentUser.uid, msg);
  };

  const handleAddCategory = (category: string) => {
    if (!categories.includes(category)) {
      const newCats = [...categories, category];
      setCategories(newCats);
      if (currentUser) dbService.saveCategories(currentUser.uid, newCats);
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    if (currentUser) {
      dbService.createUserProfile(profile).catch(err => {
        if (err.code === 'permission-denied') setPermissionError(true);
      });
      // Initialize default categories
      dbService.saveCategories(currentUser.uid, ['Personal', 'Work', 'Wellness']);
      setCategories(['Personal', 'Work', 'Wellness']);
    }
  };

  const handleClearData = async () => {
    alert("To delete your account data permanently, please contact support or delete your account.");
  };

  const handleExportData = () => {
    const data = {
      profile: userProfile,
      moods: moodHistory,
      journals: journalHistory,
      tasks: tasks,
      sleep: sleepHistory,
      breathing: breathingHistory,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serenemind-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInstallApp = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
          window.deferredPrompt = null;
        }
      });
    }
  };

  if (permissionError) {
    return <FirestoreRulesHelp onRetry={() => window.location.reload()} />;
  }

  if (loading || (currentUser && !isDataLoaded)) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
          <div className="text-xs text-slate-400">Loading your sanctuary...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  if (!userProfile || !userProfile.hasOnboarded) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.Home:
        return <Home
          tasks={tasks}
          sleepHistory={sleepHistory}
          onToggleTask={handleToggleTask}
          onSaveTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onLogMood={handleLogMood}
          onNavigate={handleNavigate}
          onNavigateToTool={handleNavigateToTool}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCrisis={() => setIsUrgeSurfingOpen(true)}
          categories={categories}
          onAddCategory={handleAddCategory}
          installPrompt={installPrompt}
          onInstall={handleInstallApp}
          notificationPermission={notificationPermission}
          onRequestNotification={requestNotificationPermission}
          userName={userProfile?.name}
        />;
      case AppTab.Chat:
        return <ChatPage
          messages={chatHistory}
          onAddMessage={handleAddMessage}
          onTaskCreated={handleAddTask}
          startVoice={launchVoice}
          onVoiceExit={() => setLaunchVoice(false)}
          categories={categories}
          onBack={() => setActiveTab(AppTab.Home)}
          tasks={tasks}
        />;
      case AppTab.Tools:
        return <ToolsPage
          journalEntries={journalHistory}
          onAddJournal={handleAddJournal}
          onLogBreathing={handleLogBreathing}
          moodHistory={moodHistory}
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onSaveTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          categories={categories}
          onAddCategory={handleAddCategory}
          onLogSleep={handleLogSleep}
          sleepHistory={sleepHistory}
          onSaveThoughtRecord={handleSaveThoughtRecord}
          initialActiveTool={activeTool}
          onClearActiveTool={() => setActiveTool(null)}
        />;
      case AppTab.Library:
        return <LibraryPage moodHistory={moodHistory} />;
      case AppTab.Analytics:
        return <AnalyticsPage
          moodHistory={moodHistory}
          journalHistory={journalHistory}
          chatHistory={chatHistory}
          breathingHistory={breathingHistory}
          tasks={tasks}
          sleepHistory={sleepHistory}
        />;
      default:
        return <Home
          tasks={tasks}
          sleepHistory={sleepHistory}
          onToggleTask={handleToggleTask}
          onLogMood={handleLogMood}
          onNavigate={handleNavigate}
          onNavigateToTool={handleNavigateToTool}
          categories={categories}
          userName={userProfile?.name}
        />;
    }
  };

  return (
    <div className="h-[100dvh] bg-slate-50 text-slate-900 font-sans transition-colors duration-300 overflow-hidden flex flex-col">
      <main className="flex-1 overflow-hidden relative w-full max-w-md mx-auto bg-slate-50 dark:bg-slate-950 shadow-2xl shadow-slate-200 dark:shadow-none sm:border-x sm:border-slate-200 dark:sm:border-slate-800">
        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearData={handleClearData}
        onExportData={handleExportData}
        installPrompt={installPrompt}
        onInstall={handleInstallApp}
        notificationPermission={notificationPermission}
        onRequestNotification={requestNotificationPermission}
      />

      <CrisisResourceModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
      />

      <UrgeSurfingModal
        isOpen={isUrgeSurfingOpen}
        onClose={() => setIsUrgeSurfingOpen(false)}
        onEmergency={() => {
          setIsUrgeSurfingOpen(false);
          setIsCrisisModalOpen(true);
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AuthenticatedApp />
      </Router>
    </AuthProvider>
  );
};

export default App;
