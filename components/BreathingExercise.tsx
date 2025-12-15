
import React, { useEffect, useState, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Wind, CircleDot, Activity, Check } from 'lucide-react';

interface BreathingExerciseProps {
  onClose: (durationSeconds: number) => void;
}

type Technique = '4-7-8' | 'box' | 'resonant';

const TECHNIQUES = {
  '4-7-8': {
    name: 'Relax',
    sub: '4-7-8 Technique',
    desc: 'Sleep & Anxiety Relief',
    phases: [
      { name: 'Inhale', duration: 4, scale: 1.5, text: 'Breathe In' },
      { name: 'Hold', duration: 7, scale: 1.5, text: 'Hold' },
      { name: 'Exhale', duration: 8, scale: 1, text: 'Breathe Out' }
    ],
    color: 'from-teal-400 to-emerald-400',
    shadow: 'shadow-teal-500/50',
    text: 'text-teal-500',
    bg: 'bg-teal-500'
  },
  'box': {
    name: 'Focus',
    sub: 'Box Breathing',
    desc: 'Clarity & Performance',
    phases: [
      { name: 'Inhale', duration: 4, scale: 1.5, text: 'Breathe In' },
      { name: 'Hold', duration: 4, scale: 1.5, text: 'Hold' },
      { name: 'Exhale', duration: 4, scale: 1, text: 'Breathe Out' },
      { name: 'Hold', duration: 4, scale: 1, text: 'Hold' }
    ],
    color: 'from-indigo-400 to-violet-400',
    shadow: 'shadow-indigo-500/50',
    text: 'text-indigo-500',
    bg: 'bg-indigo-500'
  },
  'resonant': {
    name: 'Balance',
    sub: 'Resonant Frequency',
    desc: 'Heart Rate Variability',
    phases: [
      { name: 'Inhale', duration: 6, scale: 1.5, text: 'Breathe In' },
      { name: 'Exhale', duration: 6, scale: 1, text: 'Breathe Out' }
    ],
    color: 'from-rose-400 to-orange-400',
    shadow: 'shadow-rose-500/50',
    text: 'text-rose-500',
    bg: 'bg-rose-500'
  }
};

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onClose }) => {
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0); // For the countdown number
  const [isActive, setIsActive] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  
  // Ref for the audio chime (optional future feature) or precise timing
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && selectedTechnique) {
      timerRef.current = window.setInterval(() => {
        setTotalSeconds(s => s + 1);
        
        if (timeLeft > 0) {
          setTimeLeft((prev) => prev - 1);
        } else {
          // Move to next phase
          const config = TECHNIQUES[selectedTechnique];
          const nextIndex = (phaseIndex + 1) % config.phases.length;
          
          if (nextIndex === 0) {
            setCycleCount(c => c + 1);
          }
          
          setPhaseIndex(nextIndex);
          setTimeLeft(config.phases[nextIndex].duration);
        }
      }, 1000);
    }

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, phaseIndex, selectedTechnique]);

  const toggleStart = () => {
    if (!selectedTechnique) return;
    
    if (!isActive) {
        // If starting fresh or resuming
        if (timeLeft === 0) {
            setPhaseIndex(0);
            setTimeLeft(TECHNIQUES[selectedTechnique].phases[0].duration);
        }
    }
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setPhaseIndex(0);
    setTimeLeft(0);
    setCycleCount(0);
  };

  const handleClose = () => {
    onClose(totalSeconds);
  };

  // --- SELECTION SCREEN ---
  if (!selectedTechnique) {
      return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[100] flex flex-col p-6 animate-fade-in overflow-y-auto">
             <button onClick={handleClose} className="absolute top-6 right-6 p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:scale-105 transition-transform">
                <X size={24} className="text-slate-500 dark:text-slate-400" />
            </button>
            
            <div className="mt-12 mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Breathe</h2>
                <p className="text-slate-500 dark:text-slate-400">Select a pattern to begin your session.</p>
            </div>

            <div className="grid gap-4 w-full max-w-md mx-auto">
                {(Object.keys(TECHNIQUES) as Technique[]).map((t) => {
                    const tech = TECHNIQUES[t];
                    const Icon = t === '4-7-8' ? Wind : t === 'box' ? CircleDot : Activity;
                    
                    return (
                        <button
                            key={t}
                            onClick={() => setSelectedTechnique(t)}
                            className="relative group overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 text-left"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tech.color} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}></div>
                            
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${tech.color} text-white shadow-lg`}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {tech.name}
                                        </h3>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{tech.sub}</div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{tech.desc}</p>
                                    </div>
                                </div>
                                <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover:text-indigo-500 transition-colors">
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
      );
  }

  // --- ACTIVE SESSION ---
  const config = TECHNIQUES[selectedTechnique];
  const currentPhase = isActive ? config.phases[phaseIndex] : config.phases[0];
  
  // Calculate dynamic styles for the satisfying fluid animation
  const transitionDuration = isActive ? `${currentPhase.duration}s` : '1s';
  const scale = isActive ? currentPhase.scale : 1;

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden animate-fade-in">
      {/* Atmospheric Background Blobs */}
      <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br ${config.color} rounded-full blur-[120px] opacity-20 animate-pulse`} style={{ animationDuration: '10s' }}></div>
      <div className={`absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-gradient-to-tl ${config.color} rounded-full blur-[120px] opacity-10 animate-pulse`} style={{ animationDuration: '15s', animationDelay: '2s' }}></div>

      {/* Header */}
      <div className="relative z-20 px-6 py-6 flex justify-between items-center">
        <button onClick={() => setSelectedTechnique(null)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <span className="text-sm font-bold tracking-wider uppercase">Change</span>
        </button>
        <button onClick={handleClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors">
          <X size={20} className="text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        
        {/* Main Breathing Visualizer */}
        <div className="relative w-80 h-80 flex items-center justify-center">
           
           {/* Static Guide Ring */}
           <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
           <div className="absolute inset-8 rounded-full border border-white/5"></div>

           {/* The Living Breath Circle */}
           {/* Layer 1: Outer Glow */}
           <div 
             className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-20 blur-2xl transition-all ease-in-out`}
             style={{ 
                 transform: `scale(${scale})`, 
                 transitionDuration 
             }}
           ></div>

           {/* Layer 2: Main Body */}
           <div 
             className={`absolute inset-16 rounded-full bg-gradient-to-br ${config.color} shadow-2xl ${config.shadow} transition-all ease-in-out flex items-center justify-center`}
             style={{ 
                 transform: `scale(${scale})`, 
                 transitionDuration 
             }}
           >
              {/* Inner White Core for depth */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md"></div>
           </div>

           {/* Text Overlay (Does not scale with circle) */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className={`text-white font-bold text-3xl mb-2 tracking-tight drop-shadow-lg transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-2'}`}>
                  {isActive ? currentPhase.text : 'Ready'}
              </div>
              
              {isActive ? (
                   <div key={phaseIndex} className="text-6xl font-mono font-bold text-white/90 drop-shadow-md animate-scale-in">
                       {timeLeft}
                   </div>
              ) : (
                   <Play size={48} className="text-white/80 ml-2" fill="currentColor" />
              )}
           </div>
        </div>

        {/* Status Text */}
        <div className="mt-16 text-center space-y-2 h-20">
            <h2 className="text-2xl font-bold text-white">{config.name}</h2>
            <p className="text-white/50 text-sm font-medium">{config.sub}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 mt-4">
          <button 
            onClick={reset}
            className="p-4 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Reset"
          >
            <RotateCcw size={24} />
          </button>

          <button 
            onClick={toggleStart}
            className={`p-6 rounded-full bg-white text-slate-900 shadow-xl shadow-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center`}
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          
          <div className="w-14 h-14 flex items-center justify-center rounded-full border border-white/10 text-white/50">
             <div className="text-center">
                 <span className="block text-xs font-bold text-white">{cycleCount}</span>
                 <span className="text-[10px] uppercase">Cycles</span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Bottom info */}
      <div className="p-6 text-center">
        <p className="text-white/30 text-xs font-medium">Session time: {Math.floor(totalSeconds / 60)}m {totalSeconds % 60}s</p>
      </div>
    </div>
  );
};

export default BreathingExercise;
