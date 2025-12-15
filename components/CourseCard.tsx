
import React from 'react';
import { Course } from '../types';
import { Clock, PlayCircle } from 'lucide-react';

interface CourseCardProps {
    course: Course;
    onClick: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
    return (
        <div
            onClick={() => onClick(course.id)}
            className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer"
        >
            <div className="h-32 w-full relative">
                <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock size={12} />
                    {course.totalDurationMinutes}m
                </div>
                <div className="absolute bottom-2 left-2 bg-teal-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                    {course.category}
                </div>
            </div>

            <div className="p-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{course.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{course.description}</p>

                <div className="mt-3 flex items-center text-teal-600 dark:text-teal-400 text-sm font-medium">
                    <PlayCircle size={16} className="mr-1" />
                    Start Course
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
