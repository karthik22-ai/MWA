import json
import os
import google.generativeai as genai
from typing import List

MEMORY_FILE = "memories.json"

class MemoryService:
    def __init__(self):
        self.memories: List[dict] = self._load_memories()

    def _load_memories(self) -> List[dict]:
        if not os.path.exists(MEMORY_FILE):
            return []
        try:
            with open(MEMORY_FILE, "r") as f:
                data = json.load(f)
                # Migration: Convert old string list to dicts with IDs
                if data and isinstance(data[0], str):
                    return [{"id": str(i), "text": m, "created_at": "2024-01-01"} for i, m in enumerate(data)]
                return data
        except:
            return []

    def _save_memories(self):
        with open(MEMORY_FILE, "w") as f:
            json.dump(self.memories, f, indent=2)

    def get_context(self) -> str:
        if not self.memories:
            return ""
        return "LONG TERM MEMORY (Facts about the user):\n" + "\n".join([f"- {m['text']}" for m in self.memories])

    def get_all(self):
        return self.memories

    def delete(self, memory_id: str):
        original_count = len(self.memories)
        self.memories = [m for m in self.memories if m['id'] != memory_id]
        if len(self.memories) < original_count:
            self._save_memories()
            return True
        return False

    def extract_memories(self, chat_history: List[dict]):
        """
        Analyzes the chat to find new permanent facts about the user.
        """
        if not chat_history:
            return

        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # We only care about the last exchange usually
        last_exchange = chat_history[-2:] 
        conversation_text = "\n".join([f"{msg['role']}: {msg['parts'][0]['text']}" for msg in last_exchange])

        prompt = f"""
        Analyze this conversation snippet for PERMANENT facts about the User (dates, names, preferences, hobbies, job, health info).
        
        Conversation:
        {conversation_text}

        Existing Memories:
        {json.dumps(self.memories)}

        Task:
        1. Identify any NEW facts that are not already in Existing Memories.
        2. Ignore trivial things (e.g., "User said hello", "User asked about the weather").
        3. Return strictly a JSON list of strings. Example: ["User owns a cat named Luna", "User finds rain relaxing"].
        4. If no new facts, return [].
        """

        try:
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            new_facts = json.loads(response.text)
            
            if new_facts:
                import time
                print(f"🧠 New Memories Extracted: {new_facts}")
                # Convert strings to memory objects
                for fact in new_facts:
                    # Check duplication by text
                    if not any(m['text'] == fact for m in self.memories):
                        self.memories.append({
                            "id": str(int(time.time() * 1000)),
                            "text": fact,
                            "created_at": str(time.time())
                        })
                self._save_memories()
                
        except Exception as e:
            print(f"Memory extraction failed: {e}")
