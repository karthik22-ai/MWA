
import React, { useState, useEffect } from 'react';
import { Course, Pathway, MoodEntry } from '../types';
import { contentService } from '../services/contentService';
import CourseCard from '../components/CourseCard';
import { Sparkles, BookOpen } from 'lucide-react';
import CoursePlayer from './CoursePlayer';

interface LibraryPageProps {
    moodHistory: MoodEntry[];
}

const LibraryPage: React.FC<LibraryPageProps> = ({ moodHistory }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [pathways, setPathways] = useState<Pathway[]>([]);
    const [recommendations, setRecommendations] = useState<{ courses: Course[], pathways: Pathway[] } | null>(null);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

    useEffect(() => {
        setCourses(contentService.getAllCourses());
        setPathways(contentService.getAllPathways());
        setRecommendations(contentService.recommendContent(moodHistory));
    }, [moodHistory]);

    const handleCourseClick = (id: string) => {
        console.log("Course clicked:", id);
        setActiveCourseId(id);
    };

    if (activeCourseId) {
        return <CoursePlayer courseId={activeCourseId} onBack={() => setActiveCourseId(null)} />;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto pb-24">
            <div className="p-6">
                <header className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">To Library</h1>
                        <p className="text-slate-500 dark:text-slate-400">Expand your mind, heal your soul.</p>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors text-sm font-medium">
                        Create
                    </button>
                </header>

                {/* Recommended Section */}
                {recommendations && (
                    <section className="mb-8">
                        <div className="flex items-center mb-4 space-x-2">
                            <Sparkles className="text-amber-500" size={20} />
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Recommended For You</h2>
                        </div>

                        {/* Pathways Grid */}
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            {recommendations.pathways.map(path => (
                                <div
                                    key={path.id}
                                    onClick={() => {
                                        if (path.courses.length > 0) handleCourseClick(path.courses[0]);
                                    }}
                                    className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-5 text-white shadow-lg relative overflow-hidden cursor-pointer"
                                >
                                    <div className="relative z-10 w-full">
                                        <h3 className="font-bold text-lg mb-1">{path.title}</h3>
                                        <p className="text-teal-100 text-sm mb-4 max-w-[80%]">{path.description}</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (path.courses.length > 0) {
                                                    handleCourseClick(path.courses[0]);
                                                }
                                            }}
                                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                                        >
                                            Start Journey
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                                </div>
                            ))}
                        </div>

                        {/* Recommended Courses Horizontal Scroll */}
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                            {recommendations.courses.map(course => (
                                <div key={course.id} className="min-w-[240px]">
                                    <CourseCard course={course} onClick={handleCourseClick} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* All Courses Section */}
                <section>
                    <div className="flex items-center mb-4 space-x-2">
                        <BookOpen className="text-indigo-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Browse Library</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {courses.map(course => (
                            <CourseCard key={course.id} course={course} onClick={handleCourseClick} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default LibraryPage;
