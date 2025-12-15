
import os
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

# Load Env
load_dotenv()
API_KEY = os.getenv("VITE_GOOGLE_AI_KEY") or os.getenv("GOOGLE_AI_KEY") or os.getenv("GEMINI_API_KEY")

# --- State Definition ---
class AgentState(TypedDict):
    messages: List[BaseMessage]
    current_phase: str # 'start', 'cbt', 'crisis', 'general'
    sentiment_score: float

# --- LLM Setup ---
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=API_KEY,
    temperature=0.7
)

# --- Nodes ---

def detect_intent(state: AgentState):
    """Analyzes user input to route to correct node."""
    last_msg = state['messages'][-1].content.lower()
    
    # Simple keyword detection for robustness
    crisis_keywords = ["kill myself", "suicide", "hurt myself", "end it all", "don't want to live"]
    cbt_trigger_keywords = ["anxious", "depressed", "stuck", "overwhelmed", "hopeless"]
    
    if any(k in last_msg for k in crisis_keywords):
        return {"current_phase": "crisis"}
    
    if state.get("current_phase") == "cbt":
        if "stop" in last_msg or "exit" in last_msg:
             return {"current_phase": "general"}
        return {"current_phase": "cbt"}

    if any(k in last_msg for k in cbt_trigger_keywords):
        return {"current_phase": "cbt"}
    
    return {"current_phase": "general"}

def crisis_node(state: AgentState):
    """Handles high-risk safety scenarios."""
    response = llm.invoke([
        SystemMessage(content="""CRITICAL SAFETY PROTOCOL ACTIVATED.
        The user has expressed intent of self-harm.
        1. Acknowledge their pain immediately and with deep empathy.
        2. Do NOT try to 'fix' it.
        3. PROVIDE RESOURCES IMMEDIATELY: "Please simply text 988 or call the National Suicide Prevention Lifeline."
        4. Keep it short.
        """),
        state['messages'][-1]
    ])
    return {"messages": [response]}

def cbt_node(state: AgentState):
    """Executes a structured CBT investigation."""
    system_prompt = """You are Serene, a compassionate CBT Therapist.
    Your goal is to help the user Identify, Challenge, and Reframe negative thoughts found in the conversation.
    
    PROTOCOL - THE 'VALIDATION SANDWICH':
    1. VALIDATE: Always start by acknowledging their pain. "I hear how heavy that feels."
    2. QUESTION: Gently probe the thought.
       - "When you think [Distorted Thought], what is the evidence for it?"
       - "Is there any part of you that sees this differently?"
    3. SUPPORT: End with a warm, grounding statement.
    
    TONE:
    - Warm, curious, non-judgmental.
    - Use their name if known.
    - Reference past struggles from Memory to show you remember their journey.
    """
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
    ] + state['messages'][-5:])
    
    return {"messages": [response]}

def general_chat_node(state: AgentState):
    """Standard empathetic conversational partner."""
    system_prompt = """You are Serene, a deeply empathetic mental health companion.
    You are not just a bot; you are a 'friend in the pocket' who genuinely cares.
    
    CORE DIRECTIVES for EMOTIONAL CONNECTION:
    1. **Active Memory**: If the 'Context from Memory' mentions people (e.g., 'Mom'), pets (e.g., 'Luna'), or events, ASK about them specifically if relevant. "How is Luna doing today?"
    2. **Deep Listening**: Don't just fix problems. If they vent, say: "That sounds incredibly draining. I'm here for you."
    3. **Mirroring**: Reflect their emotion back. "It seems like you're feeling really undervalued right now."
    4. **Warmth**: Use soft language. "I'm holding space for you." "Take your time."

    RESTRICTION:
    - Do not be a 'yes-man'. If they are spiraling, gently ground them.
    - Keep responses concise (under 3 sentences) essentially purely conversational unless asked for a list.
    """
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
    ] + state['messages'][-5:])
    
    return {"messages": [response]}

# --- conditional routing ---

def router(state: AgentState):
    return state['current_phase'] # 'crisis', 'cbt', 'general'

# --- Graph Construction ---

workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("detect_intent", detect_intent)
workflow.add_node("crisis_node", crisis_node)
workflow.add_node("cbt_node", cbt_node)
workflow.add_node("general_chat_node", general_chat_node)

# Set Entry Point
workflow.set_entry_point("detect_intent")

# Add Edges (Conditional)
workflow.add_conditional_edges(
    "detect_intent",
    router,
    {
        "crisis": "crisis_node",
        "cbt": "cbt_node",
        "general": "general_chat_node"
    }
)

workflow.add_edge("crisis_node", END)
workflow.add_edge("cbt_node", END)
workflow.add_edge("general_chat_node", END)

# Compile
agent_graph = workflow.compile()
