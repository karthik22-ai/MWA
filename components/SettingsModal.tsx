
import React from 'react';
import { X, Trash2, Shield, Download, Share, PlusSquare, Bell, BellOff, FileJson } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearData: () => void;
  onExportData?: () => void;
  installPrompt?: any;
  onInstall?: () => void;
  notificationPermission?: NotificationPermission;
  onRequestNotification?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearData,
  onExportData,
  installPrompt,
  onInstall,
  notificationPermission,
  onRequestNotification
}) => {
  if (!isOpen) return null;

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all app data? This cannot be undone.")) {
      onClearData();
      onClose();
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-slide-up transition-colors duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8">

          {/* Notifications Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Notifications</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                {notificationPermission === 'granted' ? (
                  <Bell size={20} className="text-teal-500" />
                ) : (
                  <BellOff size={20} className="text-slate-400" />
                )}
                <div>
                  <div className="font-semibold text-sm text-slate-800 dark:text-white">
                    {notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {notificationPermission === 'granted'
                      ? 'Daily check-ins & task reminders.'
                      : 'Enable for reminders.'}
                  </div>
                </div>
              </div>
              {notificationPermission !== 'granted' && notificationPermission !== 'denied' && onRequestNotification && (
                <button
                  onClick={onRequestNotification}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-sm hover:scale-105 transition-transform"
                >
                  Enable
                </button>
              )}
              {notificationPermission === 'denied' && (
                <span className="text-xs text-red-500 font-medium">Blocked</span>
              )}
            </div>
          </div>

          {/* Install App Section */}
          {(installPrompt || isIOS) && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">App Installation</h3>

              {installPrompt && (
                <button
                  onClick={onInstall}
                  className="w-full flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors mb-2"
                >
                  <div className="flex items-center space-x-3">
                    <Download size={20} />
                    <span className="font-bold text-sm">Install App</span>
                  </div>
                </button>
              )}

              {isIOS && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">To install on iPhone/iPad:</p>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-500 mb-1">
                    <Share size={14} />
                    <span>Tap the <b>Share</b> button</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-500">
                    <PlusSquare size={14} />
                    <span>Select <b>Add to Home Screen</b></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Data & Privacy</h3>

            {onExportData && (
              <button
                onClick={onExportData}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mb-3 group"
              >
                <div className="flex items-center space-x-3">
                  <FileJson size={20} />
                  <span className="font-semibold text-sm">Export My Data</span>
                </div>
                <Download size={16} className="text-slate-400" />
              </button>
            )}

            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Trash2 size={20} />
                <span className="font-semibold text-sm">Reset App Data</span>
              </div>
              <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Click to confirm</span>
            </button>
            <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-slate-400">
              <Shield size={12} />
              <span>Your data is stored locally & securely.</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-slate-400 font-medium">
          SereneMind v1.5 • Designed for Wellness
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
