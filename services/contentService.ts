
import { Course, Pathway, Lesson } from '../types';

// --- MOCK CONTENT LIBRARY ---

const COURSES: Course[] = [
    {
        id: 'anxiety-101',
        title: 'Anxiety Basics',
        description: 'Understand the mechanics of anxiety and learn immediate grounding techniques.',
        category: 'Anxiety',
        imageUrl: 'https://images.unsplash.com/photo-1508138221679-760a23a2285b?w=800&q=80',
        totalDurationMinutes: 15,
        lessons: [
            {
                id: 'l1',
                title: 'What is Anxiety?',
                type: 'article',
                durationMinutes: 5,
                isCompleted: false,
                textContent: "Anxiety is your body's natural response to stress. It's a feeling of fear or apprehension about what's to come. \n\nThe first day of school, going to a job interview, or giving a speech may cause most people to feel fearful and nervous. But if your feelings of anxiety are extreme, last for longer than six months, and are interfering with your life, you may have an anxiety disorder.\n\nIn this course, we will explore:\n1. The biological roots of anxiety (Fight or Flight).\n2. Triggers and how to identify them.\n3. Physical vs Psychological symptoms."
            },
            {
                id: 'l2',
                title: 'Box Breathing',
                type: 'exercise',
                durationMinutes: 10,
                isCompleted: false,
                contentUrl: 'box-breathing-guide'
            }
        ]
    },
    {
        id: 'sleep-hygiene',
        title: 'Sleep Hygiene 101',
        description: 'Prepare your mind and environment for deep, restorative sleep.',
        category: 'Sleep',
        imageUrl: 'https://images.unsplash.com/photo-1541781777-c186d1238840?w=800&q=80',
        totalDurationMinutes: 20,
        lessons: [
            {
                id: 's1',
                title: 'The 10-3-2-1 Rule',
                type: 'article',
                durationMinutes: 5,
                isCompleted: false,
                textContent: "No caffeine 10 hours before bed. No food 3 hours before bed. No work 2 hours before bed. No screens 1 hour before bed."
            }
        ]
    },
    {
        id: 'cbt-starter',
        title: 'Intro to CBT',
        description: 'Learn how your thoughts, feelings, and behaviors are interconnected.',
        category: 'Therapy',
        imageUrl: 'https://images.unsplash.com/photo-1544367563-12123d896e89?w=800&q=80',
        totalDurationMinutes: 30,
        lessons: [
            {
                id: 'c1',
                title: 'The Cognitive Triangle',
                type: 'article',
                durationMinutes: 10,
                isCompleted: false,
                textContent: "The core of CBT is the Cognitive Triangle. It shows how Thoughts, Feelings, and Behaviors all influence each other. Changing one point on the triangle can change the others."
            }
        ]
    },
    {
        id: 'creative-mind',
        title: 'Creative Flow',
        description: 'Unlock your potential through mindful creation.',
        category: 'Growth',
        imageUrl: 'https://images.unsplash.com/photo-1460661619842-03874e17dd39?w=800&q=80',
        totalDurationMinutes: 45,
        lessons: [
            {
                id: 'cr1',
                title: 'Setting Intentions',
                type: 'article',
                durationMinutes: 5,
                isCompleted: false,
                textContent: "Before you create, sit for a moment. What is your purpose? Who is this for? Aligning with your values creates flow."
            }
        ]
    }
];

const PATHWAYS: Pathway[] = [
    {
        id: 'path-calm',
        title: '7 Days to Calm',
        description: 'A structured week to reduce localized stress.',
        problemTags: ['Anxious', 'Stress', 'Overwhelmed'],
        courses: ['anxiety-101', 'cbt-starter'],
        progress: 0
    },
    {
        id: 'path-sleep',
        title: 'Better Sleep Journey',
        description: 'Reclaim your nights with proven techniques.',
        problemTags: ['Insomnia', 'Tired', 'Sleep'],
        courses: ['sleep-hygiene'],
        progress: 0
    }
];

export const contentService = {
    getAllCourses: (): Course[] => {
        return COURSES;
    },

    getCourseById: (id: string): Course | undefined => {
        return COURSES.find(c => c.id === id);
    },

    getAllPathways: (): Pathway[] => {
        return PATHWAYS;
    },

    getPathwayById: (id: string): Pathway | undefined => {
        return PATHWAYS.find(p => p.id === id);
    },

    // Simple recommendation logic based on recent moods or keywords
    recommendContent: (moodHistory: any[]): { courses: Course[], pathways: Pathway[] } => {
        // 1. naive analysis of recent moods
        const recentMoods = moodHistory.slice(-5).map(m => m.mood);
        const tags: string[] = [];

        if (recentMoods.includes('Anxious') || recentMoods.includes('Angry')) tags.push('Anxiety');
        if (recentMoods.includes('Sad')) tags.push('Therapy');

        // 2. Filter courses
        const recCourses = COURSES.filter(c => tags.includes(c.category));

        // 3. Filter pathways
        const recPathways = PATHWAYS.filter(p => p.problemTags.some(tag => tags.includes(tag) || (tag === 'Anxious' && tags.includes('Anxiety'))));

        // Default if no specific match
        if (recCourses.length === 0) return { courses: [COURSES[0]], pathways: [PATHWAYS[0]] };

        return { courses: recCourses, pathways: recPathways };
    }
};
