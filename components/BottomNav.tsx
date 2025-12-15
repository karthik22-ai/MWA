import React from 'react';
import { Home, MessageCircle, BarChart2, LayoutGrid, BookOpen } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: AppTab.Home, icon: Home, label: 'Home' },
    { id: AppTab.Chat, icon: MessageCircle, label: 'Chat' },
    { id: AppTab.Tools, icon: LayoutGrid, label: 'Tools' },
    { id: AppTab.Library, icon: BookOpen, label: 'Library' },
    { id: AppTab.Analytics, icon: BarChart2, label: 'Analytics' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-xs mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-slate-800 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] px-6 py-3 flex justify-between items-center pointer-events-auto transition-colors duration-300">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${activeTab === item.id
              ? 'text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-white/10 scale-110'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            {activeTab === item.id && (
              <span className="absolute -bottom-8 text-[10px] font-bold text-slate-900 dark:text-white opacity-0 animate-slide-up-fade">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;