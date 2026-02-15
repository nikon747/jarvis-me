# J.A.R.V.I.S. - Windows 11 Setup Guide

## Prerequisites

Before running J.A.R.V.I.S., install the following on your Windows 11 machine:

### 1. Python 3.10 or higher
- Download from: https://www.python.org/downloads/
- **IMPORTANT**: Check "Add Python to PATH" during installation

### 2. Node.js 18 or higher
- Download from: https://nodejs.org/
- Choose the LTS version

### 3. MongoDB Community Server
- Download from: https://www.mongodb.com/try/download/community
- Install with default settings
- MongoDB will run as a Windows service automatically

### 4. Git (optional, for cloning)
- Download from: https://git-scm.com/download/win

---

## Quick Setup (Automated)

1. **Open Command Prompt as Administrator**

2. **Navigate to the project folder:**
   ```cmd
   cd path\to\jarvis-app
   ```

3. **Run the setup script:**
   ```cmd
   setup-windows.bat
   ```

4. **Start the application:**
   ```cmd
   start-jarvis.bat
   ```

5. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001/api/

---

## Manual Setup

### Step 1: Backend Setup

```cmd
cd backend

:: Create virtual environment
python -m venv venv

:: Activate virtual environment
venv\Scripts\activate

:: Install dependencies
pip install -r requirements.txt

:: Install emergent integrations
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### Step 2: Frontend Setup

```cmd
cd frontend

:: Install dependencies
npm install
:: OR if you have yarn
yarn install
```

### Step 3: Configure Environment Variables

**Backend (.env file in /backend folder):**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=jarvis_db
CORS_ORIGINS=http://localhost:3000
EMERGENT_LLM_KEY=sk-emergent-5F86e5229F329Cf89B
```

**Frontend (.env file in /frontend folder):**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Step 4: Start MongoDB

MongoDB should start automatically as a Windows service. To verify:
```cmd
:: Check if MongoDB is running
sc query MongoDB
```

If not running:
```cmd
net start MongoDB
```

### Step 5: Start the Backend

```cmd
cd backend
venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Step 6: Start the Frontend (in a new terminal)

```cmd
cd frontend
npm start
:: OR
yarn start
```

---

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB service is running: `net start MongoDB`
- Check if port 27017 is available: `netstat -an | findstr 27017`

### Python/pip Issues
- Verify Python is in PATH: `python --version`
- If pip fails, try: `python -m pip install --upgrade pip`

### Node.js/npm Issues
- Verify Node.js is installed: `node --version`
- Clear npm cache: `npm cache clean --force`

### Port Already in Use
- Backend (8001): `netstat -ano | findstr 8001`
- Frontend (3000): `netstat -ano | findstr 3000`
- Kill process: `taskkill /PID <PID> /F`

### Microphone Not Working
- Check Windows Privacy Settings > Microphone
- Allow browser access to microphone
- Use Chrome or Edge for best compatibility

---

## Features

- **Voice Commands**: Click the microphone button or say "Hey JARVIS"
- **AI Chat**: Powered by GPT-5.2
- **Task Management**: Create, complete, and delete tasks
- **Reminders**: Set voice-activated reminders
- **Weather**: Real-time weather updates
- **Voice Selection**: Choose from 6 different voices

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/ | GET | Health check |
| /api/chat | POST | Send message to JARVIS |
| /api/transcribe | POST | Speech-to-text |
| /api/tts | POST | Text-to-speech |
| /api/conversations | GET/POST | Manage conversations |
| /api/tasks | GET/POST/PATCH/DELETE | Task management |
| /api/reminders | GET/POST/PATCH/DELETE | Reminder management |
| /api/weather | GET | Weather data |
| /api/stats | GET | System statistics |

---

## License

This project uses the Emergent LLM Key for AI features.
