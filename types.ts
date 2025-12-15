
export enum MoodType {
  Happy = 'Happy',
  Calm = 'Calm',
  Neutral = 'Neutral',
  Sad = 'Sad',
  Anxious = 'Anxious',
  Angry = 'Angry',
}

export interface MoodEntry {
  id: string;
  mood: MoodType;
  note: string;
  timestamp: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  dueDate?: string;
  reflection?: string; // User's reflection on completion
  description?: string; // AI generated or user added details
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  sentiment?: SentimentAnalysis; // Added sentiment field
}

export interface SentimentAnalysis {
  score: number; // -1 (Negative) to 1 (Positive)
  label: 'Positive' | 'Neutral' | 'Negative';
  emotions: string[]; // e.g., ["Hopeful", "Frustrated"]
  keywords: string[]; // e.g., ["Work", "Sleep"]
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  tags?: string[];
  sentiment?: SentimentAnalysis; // Added sentiment field
}

export interface BreathingSession {
  id: string;
  timestamp: number;
  durationSeconds: number;
}

export interface SleepEntry {
  id: string;
  timestamp: number;
  hours: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface ThoughtRecord {
  id: string;
  timestamp: number;
  trigger: string;
  negativeThought: string;
  emotion: string; // e.g., "Anxiety"
  distortion: string; // AI identified, e.g., "Catastrophizing"
  challenge: string; // The counter-evidence
  reframe: string; // The new balanced thought
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  age: number; // Added age
  hasOnboarded: boolean;
  joinedDate: number;
}

export enum AppTab {
  Home = 'home',
  Chat = 'chat',
  Tools = 'tools',
  Library = 'library',
  Analytics = 'analytics',
}

// Tool definition for AI function calling
export interface CreateTaskArgs {
  title: string;
  category?: string;
}

export interface AssessmentResult {
  currentVibe: string;
  emotionalPatterns: string;
  keyInsights: string[];
  recommendations: string[];
}

// --- Pathways & Library Types ---

export type ContentType = 'article' | 'exercise' | 'audio';

export interface Lesson {
  id: string;
  title: string;
  type: ContentType;
  durationMinutes: number;
  contentUrl?: string; // For audio/video
  textContent?: string; // For articles
  isCompleted: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string; // e.g., "Anxiety", "Sleep"
  imageUrl: string;
  lessons: Lesson[];
  totalDurationMinutes: number;
}

export interface Pathway {
  id: string;
  title: string;
  description: string;
  problemTags: string[]; // e.g., ["anxiety", "stress"]
  courses: string[]; // IDs of courses included in this path
  progress: number; // 0-100
}
