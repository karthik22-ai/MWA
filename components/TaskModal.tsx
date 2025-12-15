
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Check, Sparkles, Loader2, AlignLeft } from 'lucide-react';
import { Task } from '../types';
import { generateTaskBreakdown } from '../services/geminiService';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  taskToEdit?: Task | null;
  categories: string[];
  onAddCategory: (category: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  taskToEdit, 
  categories, 
  onAddCategory 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wellness');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setSelectedCategory(taskToEdit.category);
      } else {
        setTitle('');
        setDescription('');
        setSelectedCategory(categories[0] || 'Wellness');
      }
      setIsAddingCategory(false);
      setNewCategoryName('');
      setIsGenerating(false);
    }
  }, [isOpen, taskToEdit, categories]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) return;

    // Auto-generate description if empty
    let finalDescription = description.trim();
    if (!finalDescription) {
        setIsGenerating(true);
        try {
            finalDescription = await generateTaskBreakdown(title.trim());
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    }

    const task: Task = {
      id: taskToEdit ? taskToEdit.id : Date.now().toString(),
      title: title.trim(),
      description: finalDescription,
      category: selectedCategory,
      completed: taskToEdit ? taskToEdit.completed : false,
      dueDate: taskToEdit?.dueDate || new Date().toISOString(),
    };

    onSave(task);
    onClose();
  };

  const handleGenerateSteps = async () => {
    if (!title.trim()) return;
    setIsGenerating(true);
    try {
        const steps = await generateTaskBreakdown(title);
        setDescription(prev => prev ? prev + '\n\n' + steps : steps);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      const formattedName = newCategoryName.trim();
      onAddCategory(formattedName);
      setSelectedCategory(formattedName);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleDelete = () => {
      if (taskToEdit && onDelete) {
          onDelete(taskToEdit.id);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {taskToEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-lg font-medium text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 border-b-2 border-slate-100 dark:border-slate-800 focus:border-teal-500 dark:focus:border-teal-500 bg-transparent py-2 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* AI Guide / Description - MOVED UP */}
          <div>
            <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Instructions / How-to</label>
                <button 
                    onClick={handleGenerateSteps}
                    disabled={!title.trim() || isGenerating}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>Auto-Suggest Steps</span>
                </button>
            </div>
            <div className="relative">
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add step-by-step instructions or details on how to perform this task..."
                    className="w-full h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none leading-relaxed"
                />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
              
              {isAddingCategory ? (
                <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-teal-500 px-2 py-0.5 animate-fade-in">
                   <input 
                     type="text"
                     value={newCategoryName}
                     onChange={(e) => setNewCategoryName(e.target.value)}
                     className="w-20 bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none"
                     placeholder="Name..."
                     autoFocus
                     onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                   />
                   <button onClick={handleAddNewCategory} className="ml-1 text-teal-500">
                      <Check size={14} />
                   </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAddingCategory(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-dashed border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center"
                >
                  <Plus size={12} className="mr-1" /> New
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
             {taskToEdit && (
                 <button 
                    onClick={handleDelete}
                    className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                 >
                    <Trash2 size={20} />
                 </button>
             )}
             <button 
               onClick={handleSave}
               disabled={!title.trim() || isGenerating}
               className="flex-1 flex items-center justify-center p-4 rounded-2xl bg-slate-900 dark:bg-teal-600 text-white font-bold shadow-lg shadow-slate-200 dark:shadow-teal-900/20 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isGenerating ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
               {isGenerating ? 'Generating...' : (taskToEdit ? 'Update Task' : 'Create Task')}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
