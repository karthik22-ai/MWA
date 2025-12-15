
import React, { useState, useEffect } from 'react';
import { Course, Lesson } from '../types';
import { contentService } from '../services/contentService';
import { ArrowLeft, CheckCircle, Circle, Play, FileText } from 'lucide-react';
import SessionTimer from '../components/SessionTimer';

interface CoursePlayerProps {
    courseId: string;
    onBack: () => void;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ courseId, onBack }) => {
    const [course, setCourse] = useState<Course | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false); // Placeholder for celebration

    useEffect(() => {
        const c = contentService.getCourseById(courseId);
        if (c) {
            setCourse(c);
            setActiveLessonId(c.lessons[0].id);
        }
    }, [courseId]);

    if (!course) return <div>Loading...</div>;

    const activeLesson = course.lessons.find(l => l.id === activeLessonId);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-800">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full">
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                </button>
                <h2 className="font-semibold text-lg ml-2">{course.title}</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Video/Hero Section */}
                <div className="w-full aspect-video bg-slate-900 relative flex items-center justify-center">
                    <img src={course.imageUrl} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    <div className="z-10 text-white flex flex-col items-center">
                        <h3 className="text-xl font-bold">{activeLesson?.title}</h3>
                        <p className="text-sm opacity-80">{activeLesson?.durationMinutes} min • {activeLesson?.type}</p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                    {activeLesson?.type === 'article' && (
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                                {activeLesson.textContent}
                            </p>
                        </div>
                    )}

                    {activeLesson?.type === 'exercise' && (
                        isSessionActive ? (
                            <SessionTimer
                                durationSeconds={activeLesson.durationMinutes * 60}
                                onComplete={() => setShowConfetti(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                                <Play size={48} className="text-teal-500 mb-4" />
                                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Interactive Exercise</h3>
                                <button
                                    onClick={() => setIsSessionActive(true)}
                                    className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-full font-medium shadow-lg hover:bg-teal-600 transition-colors cursor-pointer"
                                >
                                    Start Session
                                </button>
                            </div>
                        )
                    )}
                </div>

                {/* Lesson List */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Course Curriculum</h3>
                    <div className="space-y-2">
                        {course.lessons.map((lesson, idx) => (
                            <div
                                key={lesson.id}
                                onClick={() => setActiveLessonId(lesson.id)}
                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${activeLessonId === lesson.id
                                    ? 'bg-teal-100 dark:bg-teal-900/30 border-teal-200'
                                    : 'hover:bg-white dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="text-slate-400 mr-3">
                                    {lesson.isCompleted ? <CheckCircle size={20} className="text-teal-500" /> : <Circle size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-medium ${activeLessonId === lesson.id ? 'text-teal-900 dark:text-teal-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {idx + 1}. {lesson.title}
                                    </h4>
                                    <div className="flex items-center text-xs text-slate-500 mt-0.5">
                                        {lesson.type === 'article' ? <FileText size={12} className="mr-1" /> : <Play size={12} className="mr-1" />}
                                        {lesson.durationMinutes} min
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;
