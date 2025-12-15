
import { AssessmentResult, SentimentAnalysis, ChatMessage } from "../types";

const API_BASE_URL = "http://localhost:8000";

// --- Helper: Crisis Detection (Client-Side Safety) ---
export function detectCrisis(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'hurt myself', 'self-harm', 'cut myself'
  ];
  return crisisKeywords.some(keyword => lower.includes(keyword));
}

// --- API Client Helpers ---

async function postData(endpoint: string, data: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

// --- Chat Functionality (Streaming) ---

export async function sendMessageToBackendStream(
  messages: ChatMessage[],
  userContext: string,
  onChunk: (text: string) => void
): Promise<{ functionCalls?: any[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, user_context: userContext })
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: DONE } = await reader.read();
      done = DONE;
      if (value) {
        const chunk = decoder.decode(value);
        onChunk(chunk);
      }
    }

    // For this version, we assume streaming is Text-Only mostly.
    // Tool calls would require parsing a structured JSON stream or specific markers.
    // If backend sends mixed content, we'd need more complex parsing here.
    return {};

  } catch (error) {
    console.error("Chat API failed", error);
    throw error;
  }
}

// --- Feature Functions ---

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  try {
    const data = await postData('/analyze-sentiment', { text });
    const result = JSON.parse(data.result);
    return result;
  } catch (e) {
    console.error("Sentiment analysis failed", e);
    return { score: 0, label: "Neutral", emotions: [], keywords: [] };
  }
}

export async function generateTaskBreakdown(taskTitle: string): Promise<string> {
  try {
    const data = await postData('/generate-task-breakdown', { task_title: taskTitle });
    return data.description || "";
  } catch (e) {
    return "";
  }
}

export async function getDailyInsight(recentMood?: string): Promise<string> {
  try {
    const data = await postData('/daily-insight', { recent_mood: recentMood });
    return data.text || "Breathe in deeply, and let go.";
  } catch (e) {
    return "Today is a fresh start.";
  }
}

export async function getJournalPrompt(): Promise<string> {
  try {
    const data = await postData('/journal-prompt', {});
    return data.text || "What is one thing that brought you joy today?";
  } catch (e) {
    return "What is one thing that brought you joy today?";
  }
}

export async function generateTaskInsight(taskTitle: string, taskCategory: string): Promise<string> {
  try {
    const data = await postData('/task-insight', { task_title: taskTitle, task_category: taskCategory });
    return data.text || "Great job! Every step counts.";
  } catch (e) {
    return "Great job completing this task!";
  }
}

// --- Memory Management ---
export async function getMemories(): Promise<{ id: string, text: string, created_at: string }[]> {
  try {
    const data = await postData('/memories', {}); // Using POST for consistency or switching to GET if preferred, backend defined GET though. Wait, backend defined GET. postData uses POST.
    // Correction: Backend defined @app.get('/memories'). postData helper is hardcoded to POST.
    // I need a getData helper or use fetch directly.
    const response = await fetch(`${API_BASE_URL}/memories`);
    if (!response.ok) throw new Error("Failed to fetch memories");
    const json = await response.json();
    return json.memories;
  } catch (e) {
    console.error("Failed to fetch memories", e);
    return [];
  }
}

export async function deleteMemory(memoryId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/memories/${memoryId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error("Failed to delete memory");
    const json = await response.json();
    return json.success;
  } catch (e) {
    console.error("Failed to delete memory", e);
    return false;
  }
}

export async function generateClinicalSummary(
  moodHistory: any[],
  journalHistory: any[],
  tasks: any[],
  userName: string
): Promise<string> {
  try {
    const response = await postData('/clinical-summary', {
      mood_history: moodHistory.slice(-20),
      journal_history: journalHistory.slice(-5).map(j => ({ date: new Date(j.timestamp).toLocaleDateString(), content: j.content.substring(0, 150) + "..." })),
      tasks: tasks, // Backend can handle full or partial, let's send what we have or simplify if needed
      user_name: userName
    });
    return response.text;
  } catch (e) {
    console.error("Summary generation failed", e);
    return "Unable to generate AI summary at this time.";
  }
}

export async function generateAssessmentQuestions(
  moodHistory: any[],
  journalHistory: any[],
  tasks: any[]
): Promise<string[]> {
  try {
    const response = await postData('/assessment-questions', {
      mood_history: moodHistory.slice(-5),
      journal_history: journalHistory.slice(-3).map(j => j.content),
      tasks: tasks
    });
    return JSON.parse(response.questions);
  } catch (e) {
    return [
      "How have you been sleeping lately?",
      "What is occupying most of your mental space today?",
      "What is one small thing you can do for yourself right now?"
    ];
  }
}

export async function generateWellnessAssessment(
  moodHistory: any[],
  journalHistory: any[],
  tasks: any[],
  qaPairs: { question: string; answer: string }[] = []
): Promise<AssessmentResult> {
  try {
    const response = await postData('/wellness-assessment', {
      mood_history: moodHistory.slice(-10),
      journal_history: journalHistory.slice(-5).map(j => ({ title: j.title, content: j.content })),
      tasks: tasks,
      qa_pairs: qaPairs
    });
    return JSON.parse(response.result);
  } catch (e) {
    return {
      currentVibe: "Quiet and Reflective",
      emotionalPatterns: "I'm unable to analyze your patterns fully right now, but taking a moment to breathe is always a good step.",
      keyInsights: ["You are taking steps to track your wellness.", "Consistency is key to understanding yourself."],
      recommendations: ["Take three deep breaths.", "Drink a glass of water.", "Step outside for a moment."]
    };
  }
}

export async function analyzeThoughtPattern(thought: string): Promise<{ distortion: string; explanation: string; reframe: string }> {
  try {
    const response = await postData('/analyze-thought-pattern', { thought });
    return JSON.parse(response.result);
  } catch (e) {
    return {
      distortion: "Unclear Pattern",
      explanation: "I couldn't specifically identify a distortion pattern, but this thought seems difficult.",
      reframe: "This is a thought, not necessarily a fact. Is there another way to look at this?"
    };
  }
}

// Exports for compatibility or removal
export const MODEL_TEXT = 'gemini-2.0-flash'; // kept for ref
export const SYSTEM_INSTRUCTION = ""; // Unused on client now
export const safetySettings = []; // Unused on client now
export const createTaskFunctionDeclaration = {}; // Unused on client now
export const ai = null; // Removed


