import React, { useEffect, useState } from 'react';
import { X, Brain, Trash2, Loader2, Sparkles } from 'lucide-react';
import { getMemories, deleteMemory } from '../services/geminiService';

interface Memory {
    id: string;
    text: string;
    created_at: string;
}

interface MemoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose }) => {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadMemories();
        }
    }, [isOpen]);

    const loadMemories = async () => {
        setLoading(true);
        try {
            const data = await getMemories();
            setMemories(data);
        } catch (error) {
            console.error("Failed to load memories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const success = await deleteMemory(id);
            if (success) {
                setMemories(prev => prev.filter(m => m.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete memory", error);
        } finally {
            setDeletingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col max-h-[80vh] overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Brain size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Mind</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Things I've learned about you</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 size={32} className="animate-spin mb-3 text-indigo-500" />
                            <p className="text-sm font-medium">Accessing long-term memory...</p>
                        </div>
                    ) : memories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Brain size={32} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-slate-900 dark:text-white font-bold mb-2">Clean Slate</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
                                I haven't learned specific facts about you yet. Chat with me more!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {memories.map((memory) => (
                                <div
                                    key={memory.id}
                                    className="group flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <Sparkles size={16} className="mt-1 text-indigo-400 shrink-0" />
                                        <div>
                                            <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                                                {memory.text}
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                                                Learned {new Date(parseFloat(memory.created_at) * 1000).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(memory.id)}
                                        disabled={deletingId === memory.id}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title="Forget this"
                                    >
                                        {deletingId === memory.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400">
                        These memories define my personality towards you.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MemoryModal;
