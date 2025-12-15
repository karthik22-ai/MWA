
import React, { useState, useEffect } from 'react';
import { X, Wind, Waves, Anchor, Phone } from 'lucide-react';

interface UrgeSurfingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEmergency: () => void; // Callback to open the old crisis resources
}

const UrgeSurfingModal: React.FC<UrgeSurfingModalProps> = ({ isOpen, onClose, onEmergency }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes total
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setTimeLeft(180);
            setIsActive(false);
        }
    }, [isOpen]);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    if (!isOpen) return null;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleExit = () => {
        const confirm = window.confirm("Are you sure you want to leave? Stick with it for just a little longer.");
        if (confirm) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 text-white animate-fade-in">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 transition-opacity duration-1000 ${step === 2 ? 'opacity-50' : 'opacity-100'}`}></div>
                {step === 3 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-teal-900/40 to-transparent animate-pulse-slow"></div>
                )}
            </div>

            <div className="relative z-10 w-full max-w-lg h-full flex flex-col p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={handleExit} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X size={24} />
                    </button>
                    <div className="text-xl font-mono font-bold tracking-widest text-teal-400">
                        {formatTime(timeLeft)}
                    </div>
                    <button onClick={onEmergency} className="p-2 bg-rose-500/20 text-rose-400 rounded-full hover:bg-rose-500/30 transition-colors" title="Emergency Contacts">
                        <Phone size={24} />
                    </button>
                </div>

                {/* Content Logic */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">

                    {/* STEP 1: ACKNOWLEDGE */}
                    {step === 1 && (
                        <div className="animate-slide-up space-y-8">
                            <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Anchor size={48} className="text-teal-400" />
                            </div>
                            <h2 className="text-3xl font-bold">You are safe.</h2>
                            <p className="text-lg text-slate-300 leading-relaxed max-w-xs mx-auto">
                                This is just a feeling. It is uncomfortable, but it cannot hurt you. It is a wave, and you are the ocean.
                            </p>
                            <button
                                onClick={() => { setStep(2); setIsActive(true); }}
                                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-lg transition-all transform active:scale-95 shadow-lg shadow-teal-900/50"
                            >
                                I'm Ready to Ride It
                            </button>
                        </div>
                    )}

                    {/* STEP 2: BREATHE */}
                    {step === 2 && (
                        <div className="animate-fade-in space-y-8 w-full">
                            <h2 className="text-2xl font-semibold text-teal-200">Breathe with the circle</h2>

                            {/* Breathing Circle Animation */}
                            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping-slow"></div>
                                <div className="absolute inset-4 bg-teal-500/30 rounded-full animate-breathe"></div>
                                <Wind size={64} className="text-white relative z-10 opacity-80" />
                            </div>

                            <p className="text-slate-400">In for 4... Hold for 7... Out for 8.</p>

                            {timeLeft < 150 && (
                                <button
                                    onClick={() => setStep(3)}
                                    className="px-6 py-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-full text-sm transition-colors"
                                >
                                    Continue
                                </button>
                            )}
                        </div>
                    )}

                    {/* STEP 3: RIDE THE WAVE */}
                    {step === 3 && (
                        <div className="animate-fade-in space-y-6">
                            <div className="relative h-48 w-full mb-4">
                                {/* Simulated Wave CSS would go here - using icon for MVP */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Waves size={120} className="text-blue-500/50 animate-pulse" />
                                </div>
                            </div>

                            <h2 className="text-3xl font-light text-blue-200">Observe the urge.</h2>
                            <p className="text-slate-300 max-w-xs mx-auto leading-relaxed">
                                Don't fight it. Watch it crest. Notice where you feel it in your body. It is already starting to fade.
                            </p>

                            <div className="pt-8">
                                <p className="text-sm text-slate-500 mb-2">Feeling steady?</p>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors"
                                >
                                    Return to SereneMind
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UrgeSurfingModal;
