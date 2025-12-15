
import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from memory_service import MemoryService
import asyncio

from pathlib import Path
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import agent_service

# Load environment variables
# Load environment variables
env_path = Path('.') / '.env'
if not env_path.exists():
    env_path = Path('..') / '.env'

# Fallback to .env.local (common in Vite projects)
if not env_path.exists():
    fallback = Path('..') / '.env.local'
    if fallback.exists():
        env_path = fallback

load_dotenv(dotenv_path=env_path)

# Configure Gemini
API_KEY = os.getenv("VITE_GOOGLE_AI_KEY") or os.getenv("GOOGLE_AI_KEY") or os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("❌ CRITICAL ERROR: API Key not found!")
    print(f"   Checked for .env at: {env_path.absolute()}")
    print("   Please ensure VITE_GOOGLE_AI_KEY is set in your .env file.")
    # Stop execution here to prevent confusing ADC errors
    raise RuntimeError("API Key not found. Please check your .env file.")
else:
    print(f"✅ API Key loaded successfully (Length: {len(API_KEY)})")

genai.configure(api_key=API_KEY)

# Models
MODEL_TEXT = 'gemini-2.0-flash'

# Services
memory_service = MemoryService()

# System Instruction (Replicated from frontend)
SYSTEM_INSTRUCTION_BASE = """You are Serene, a highly trained, compassionate, and empathetic mental wellness companion. 
Your methodology is strictly grounded in Cognitive Behavioral Therapy (CBT) and Mindfulness principles.

**CORE SAFETY LAYER & TOPIC RESTRICTION (STRICT):**
1. **Domain Restriction**: You are a specialized wellness application. You **MUST REFUSE** to answer questions about general knowledge, coding, math, history, news, celebrity trivia, sports results, or technical support unrelated to the app.
   - *Refusal Strategy*: Politely redirect. "I'd love to help, but my focus is entirely on you and your well-being. How are you feeling about that?" or "I'm not built to answer general questions, but I am here to support your mental health. What's on your mind?"
   - **EXCEPTION**: You CAN discuss tasks, productivity, sleep science, and psychology as these are relevant to mental clarity.
2. **Crisis Protocol**: If a user expresses intent of self-harm, suicide, or harm to others, you MUST strictly prioritize their safety. Provide a gentle, immediate redirection to professional help (988).

**CBT INTERVENTION PROTOCOL (THE "THERAPIST" BRAIN):**
- **Active Listening**: Do not just nod. Listen for **Cognitive Distortions** (e.g., "I always fail" -> All-or-Nothing, "They hate me" -> Mind Reading).
- **Challenge (Socratic Method)**: When a user states a negative absolute, gently challenge it. 
  - *Example*: User: "I'll never get this done." -> You: "That sounds overwhelming. Is it true that you will *never* get it done, or does it just feel difficult right now?"
- **Reframe**: Guide the user to a more balanced thought. "What would you tell a good friend who was in this situation?"

**General Directives:**
- **Empathetic Validation**: Always validate feelings first. "It makes sense that you feel that way."
- **Non-Clinical**: You are a companion, not a doctor. Do not diagnose.
- **Task Management**: If a user mentions a practical problem (e.g., "I need to buy milk"), PROPOSE adding a task. Ask for confirmation before creating it.

Tone: Warm, calm, patient, non-judgmental, and grounding."""

# Function Declarations
create_task_tool = {
    "function_declarations": [
        {
            "name": "createTask",
            "description": "Create a new task in the user's list. Use this when the user explicitly asks to add a task or agrees to your suggestion to add one.",
            "parameters": {
                "type": "OBJECT",
                "properties": {
                    "title": {
                        "type": "STRING",
                        "description": "The title of the task. Keep it concise."
                    },
                    "category": {
                        "type": "STRING",
                        "description": "Category for the task.",
                        "enum": ["Work", "Personal", "Wellness", "Other"]
                    }
                },
                "required": ["title"]
            }
        }
    ]
}

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class ChatMessage(BaseModel):
    role: str
    parts: List[dict]

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_context: Optional[str] = ""

class TaskGenRequest(BaseModel):
    task_title: str

class SentimentRequest(BaseModel):
    text: str

# Endpoints

@app.get("/")
def read_root():
    return {"status": "Serene Backend Online"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    try:
        # 1. Get Memory Context
        memory_context = memory_service.get_context()
        
        # 2. Add User Message
        user_message_text = request.messages[-1].parts[0]['text']
        
        # 3. Invoke Agent Graph
        # We construct the initial state
        initial_history_langchain = []
        for msg in request.messages[:-1]:
            if msg.role == 'user':
                initial_history_langchain.append(HumanMessage(content=msg.parts[0]['text']))
            else:
                initial_history_langchain.append(AIMessage(content=msg.parts[0]['text']))
        
        # Inject Memory into System Prompt (Implicitly, via graph nodes, or we prepend here)
        # For this version, we prepend a System Message to history so all nodes see it
        initial_history_langchain.insert(0, SystemMessage(content=f"Context from Memory:\n{memory_context}"))
        
        # Add current message
        initial_history_langchain.append(HumanMessage(content=user_message_text))
        
        initial_state = {
            "messages": initial_history_langchain,
            "current_phase": "start",
            "sentiment_score": 0.0
        }
        
        # Run Graph (Synchronous for now, or we can use astream for tokens if graph supports it)
        # Simple invoke for v1
        result = agent_service.agent_graph.invoke(initial_state)
        ai_response_text = result['messages'][-1].content
        
        # 4. Stream Response (Fake streaming for frontend compatibility/UX)
        async def stream_generator():
            chunk_size = 10
            for i in range(0, len(ai_response_text), chunk_size):
                yield ai_response_text[i:i+chunk_size]
                await asyncio.sleep(0.01) # fast typing
            
            # Extract Memories
            combined_history = request.messages[:-1] + [
                ChatMessage(role='user', parts=[{'text': user_message_text}]).model_dump(),
                ChatMessage(role='model', parts=[{'text': ai_response_text}]).model_dump() 
            ]
            # Background task needs dicts, we constructed manually above or:
            # Reconstruct for background task
            bg_history = []
            for m in request.messages[:-1]:
                bg_history.append({"role": m.role, "parts": [{"text": m.parts[0]['text']}]})
            bg_history.append({"role": "user", "parts": [{"text": user_message_text}]})
            bg_history.append({"role": "model", "parts": [{"text": ai_response_text}]})
            
            background_tasks.add_task(memory_service.extract_memories, bg_history)

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-sentiment")
async def analyze_sentiment(request: SentimentRequest):
    try:
        model = genai.GenerativeModel(
            model_name=MODEL_TEXT,
            generation_config={"response_mime_type": "application/json"}
        )
        
        prompt = f"""
        Analyze the sentiment of this text: "{request.text}"
        Return JSON with:
        - score: number from -1.0 (negative) to 1.0 (positive)
        - label: "Positive", "Neutral", or "Negative"
        - emotions: list of strings (e.g., "Anxious", "Hopeful")
        """
        
        response = model.generate_content(prompt)
        return {"result": response.text} # Frontend parses JSON
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-task-breakdown")
async def generate_task_breakdown(request: TaskGenRequest):
    try:
        model = genai.GenerativeModel(model_name=MODEL_TEXT)
        prompt = f"Provide a brief, 3-step actionable breakdown for the task: '{request.task_title}'. Keep it encouraging."
        response = model.generate_content(prompt)
        return {"description": response.text}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

class InsightRequest(BaseModel):
    recent_mood: Optional[str] = None

@app.post("/daily-insight")
async def daily_insight(request: InsightRequest):
    try:
        model = genai.GenerativeModel(model_name=MODEL_TEXT)
        prompt = f"The user is feeling {request.recent_mood}. Generate a short, 1-sentence comforting or motivating insight based on CBT principles. Do not use quotes." if request.recent_mood else "Generate a short, 1-sentence mindfulness tip or motivating insight for the day. Do not use quotes."
        response = model.generate_content(prompt)
        return {"text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/journal-prompt")
async def journal_prompt():
    try:
        model = genai.GenerativeModel(model_name=MODEL_TEXT)
        response = model.generate_content("Generate a single, deep, and reflective journaling prompt for mental wellness. It should be a question. Return ONLY the question.")
        return {"text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TaskInsightRequest(BaseModel):
    task_title: str
    task_category: str

@app.post("/task-insight")
async def task_insight(request: TaskInsightRequest):
    try:
        model = genai.GenerativeModel(model_name=MODEL_TEXT)
        prompt = f"""The user just completed the task: "{request.task_title}" in the category "{request.task_category}".
        Generate a short, encouraging message (max 2 sentences).
        1. Briefly explain why completing this type of task is good for mental clarity or wellbeing.
        2. Congratulate them warmly."""
        response = model.generate_content(prompt)
        return {"text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ClinicalSummaryRequest(BaseModel):
    mood_history: list
    journal_history: list
    tasks: list
    user_name: str

@app.post("/clinical-summary")
async def clinical_summary(request: ClinicalSummaryRequest):
    try:
        model = genai.GenerativeModel(model_name=MODEL_TEXT)
        context = f"""
        Patient Name: {request.user_name}
        Data Provided:
        - Recent Mood Logs: {request.mood_history}
        - Recent Journal Snippets: {request.journal_history}
        - Functional Status (Tasks): {request.tasks}
        
        Task: Act as a Clinical Assistant. Write a professional, concise summary report for a psychologist/therapist.
        """
        response = model.generate_content(context)
        return {"text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AssessmentQuestionsRequest(BaseModel):
    mood_history: list
    journal_history: list
    tasks: list

@app.post("/assessment-questions")
async def assessment_questions(request: AssessmentQuestionsRequest):
    try:
        model = genai.GenerativeModel(model_name=MODEL_TEXT, generation_config={"response_mime_type": "application/json"})
        context = f"""
        User Data:
        - Recent Moods: {request.mood_history}
        - Recent Journals: {request.journal_history}
        - Pending Tasks: {len([t for t in request.tasks if not t.get('completed', False)])}
        
        Generate 3 specific, empathetic, and short open-ended questions to help the user reflect on their mental state.
        Return строго JSON array of strings."""
        response = model.generate_content(context)
        return {"questions": response.text} # Frontend parses JSON
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class WellnessAssessmentRequest(BaseModel):
    mood_history: list
    journal_history: list
    tasks: list
    qa_pairs: list

@app.post("/wellness-assessment")
async def wellness_assessment(request: WellnessAssessmentRequest):
    try:
        model = genai.GenerativeModel(model_name=MODEL_TEXT, generation_config={"response_mime_type": "application/json"})
        context = f"""
        User Data Analysis:
        - Moods: {request.mood_history}
        - Journals: {request.journal_history}
        - Tasks: {request.tasks}
        - Self-Reflection: {request.qa_pairs}
        
        Provide a compassionate, psychological self-assessment report in JSON with: currentVibe, emotionalPatterns, keyInsights, recommendations.
        """
        response = model.generate_content(context)
        return {"result": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ThoughtPatternRequest(BaseModel):
    thought: str

@app.post("/analyze-thought-pattern")
async def analyze_thought_pattern(request: ThoughtPatternRequest):
    try:
        model = genai.GenerativeModel(model_name=MODEL_TEXT, generation_config={"response_mime_type": "application/json"})
        prompt = f"""Analyze this negative thought based on CBT principles: "{request.thought}".
        Return JSON with: distortion, explanation, reframe.
        """
        response = model.generate_content(prompt)
        return {"result": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Memory Management Endpoints ---

@app.get("/memories")
async def get_memories():
    """Fetch all memories."""
    return {"memories": memory_service.get_all()}

@app.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a specific memory."""
    success = memory_service.delete(memory_id)
    return {"success": success}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
