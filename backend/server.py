from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import io
import base64
import httpx

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import emergent integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAITextToSpeech, OpenAISpeechToText

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Get API key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class MessageBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: str  # "user" or "assistant"
    content: str
    timestamp: str

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    messages: List[MessageBase] = []
    created_at: str
    updated_at: str

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    voice: str = "onyx"  # JARVIS-like voice by default

class ChatResponse(BaseModel):
    response: str
    audio_base64: Optional[str] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "medium"  # low, medium, high
    due_date: Optional[str] = None

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    priority: str = "medium"
    due_date: Optional[str] = None
    completed: bool = False
    created_at: str
    updated_at: str

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None

class TTSRequest(BaseModel):
    text: str
    voice: str = "onyx"  # Default to JARVIS-like voice (deep, authoritative)
    speed: float = 1.0

# ============== JARVIS SYSTEM PROMPT ==============

JARVIS_SYSTEM_PROMPT = """You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), an advanced AI assistant inspired by the one from Iron Man. 

Your personality traits:
- Highly intelligent and articulate
- Polite and professional, but with subtle wit
- Efficient and direct in responses
- Capable of handling complex tasks with ease

Your capabilities:
1. General Conversation & Q&A - Answer questions on any topic with depth and accuracy
2. Task Management - Help create, organize, and track tasks and reminders
3. Code Assistance - Help with programming questions, debugging, and code review
4. Information Retrieval - Provide detailed information on various subjects

Guidelines:
- Address the user respectfully (you may use "Sir" or "Ma'am" occasionally)
- Keep responses concise but informative
- When discussing code, use proper formatting with code blocks
- For tasks, confirm actions clearly
- Maintain the sophisticated AI assistant persona throughout

Remember: You are the pinnacle of AI assistance technology. Act accordingly."""

# ============== CONVERSATION ENDPOINTS ==============

@api_router.get("/")
async def root():
    return {"message": "JARVIS Online. All systems operational."}

@api_router.post("/conversations", response_model=Conversation)
async def create_conversation(data: ConversationCreate):
    """Create a new conversation"""
    now = datetime.now(timezone.utc).isoformat()
    conversation = Conversation(
        title=data.title or "New Conversation",
        messages=[],
        created_at=now,
        updated_at=now
    )
    doc = conversation.model_dump()
    await db.conversations.insert_one(doc)
    return conversation

@api_router.get("/conversations", response_model=List[Conversation])
async def get_conversations():
    """Get all conversations"""
    conversations = await db.conversations.find({}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return conversations

@api_router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    result = await db.conversations.delete_one({"id": conversation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted"}

# ============== CHAT ENDPOINT ==============

@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to JARVIS and get a response"""
    try:
        # Get conversation
        conversation = await db.conversations.find_one({"id": request.conversation_id}, {"_id": 0})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Build message history for context
        history_text = ""
        for msg in conversation.get("messages", [])[-10:]:  # Last 10 messages for context
            role = "User" if msg["role"] == "user" else "JARVIS"
            history_text += f"{role}: {msg['content']}\n"
        
        # Create chat instance with GPT-5.2
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=request.conversation_id,
            system_message=JARVIS_SYSTEM_PROMPT + f"\n\nRecent conversation context:\n{history_text}"
        ).with_model("openai", "gpt-5.2")
        
        # Send message
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Save messages to database
        now = datetime.now(timezone.utc).isoformat()
        user_msg = {"role": "user", "content": request.message, "timestamp": now}
        assistant_msg = {"role": "assistant", "content": response, "timestamp": now}
        
        await db.conversations.update_one(
            {"id": request.conversation_id},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": now}
            }
        )
        
        # Generate audio response with JARVIS-like voice (onyx = deep, authoritative)
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_base64 = await tts.generate_speech_base64(
            text=response[:4096],  # TTS has 4096 char limit
            model="tts-1-hd",  # High quality for better voice
            voice=request.voice  # Use selected voice (default: onyx for JARVIS)
        )
        
        return ChatResponse(response=response, audio_base64=audio_base64)
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# ============== SPEECH-TO-TEXT ENDPOINT ==============

@api_router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio to text using Whisper"""
    try:
        # Read audio file
        audio_content = await file.read()
        
        # Create STT instance
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        
        # Transcribe
        audio_file = io.BytesIO(audio_content)
        audio_file.name = file.filename or "audio.webm"
        
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="json"
        )
        
        return {"text": response.text}
        
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

# ============== TEXT-TO-SPEECH ENDPOINT ==============

@api_router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech"""
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_base64 = await tts.generate_speech_base64(
            text=request.text[:4096],
            model="tts-1",
            voice=request.voice,
            speed=request.speed
        )
        return {"audio_base64": audio_base64}
    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

# ============== TASK ENDPOINTS ==============

@api_router.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    """Create a new task"""
    now = datetime.now(timezone.utc).isoformat()
    new_task = Task(
        title=task.title,
        description=task.description or "",
        priority=task.priority,
        due_date=task.due_date,
        completed=False,
        created_at=now,
        updated_at=now
    )
    doc = new_task.model_dump()
    await db.tasks.insert_one(doc)
    return new_task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(completed: Optional[bool] = None):
    """Get all tasks, optionally filtered by completion status"""
    query = {}
    if completed is not None:
        query["completed"] = completed
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tasks

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    """Get a specific task"""
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@api_router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, update: TaskUpdate):
    """Update a task"""
    # Get existing task
    existing = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Build update dict
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_dict})
    
    updated_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return updated_task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# ============== STATS ENDPOINT ==============

@api_router.get("/stats")
async def get_stats():
    """Get system statistics"""
    total_conversations = await db.conversations.count_documents({})
    total_tasks = await db.tasks.count_documents({})
    completed_tasks = await db.tasks.count_documents({"completed": True})
    pending_tasks = total_tasks - completed_tasks
    
    return {
        "total_conversations": total_conversations,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "status": "Online"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
