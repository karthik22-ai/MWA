
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';

interface SessionTimerProps {
    durationSeconds: number; // e.g., 60 for 1 min
    onComplete: () => void;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ durationSeconds, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const [isActive, setIsActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            setIsCompleted(true);
            onComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, onComplete]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(durationSeconds);
        setIsCompleted(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center py-8 bg-teal-50 dark:bg-teal-900/20 rounded-xl animate-fade-in">
                <CheckCircle size={48} className="text-teal-500 mb-4" />
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Session Complete!</h3>
                <button onClick={resetTimer} className="mt-4 px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-medium transition-colors hover:bg-slate-300">
                    Restart
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-8 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
            <div className="text-4xl font-mono font-bold text-slate-800 dark:text-white mb-6">
                {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTimer}
                    className="w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                    {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" ml-1 />}
                </button>

                <button
                    onClick={resetTimer}
                    className="w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                {isActive ? "Breathe..." : "Ready to begin?"}
            </p>
        </div>
    );
};

export default SessionTimer;
