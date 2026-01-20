# Prompt-Driven 3D Industrial Simulation Studio

A browser-based 3D simulation workspace where users can view, manipulate, and interact with industrial-style 3D scenes using natural language prompts.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ Prompt Panel│  │   3D Canvas     │  │  Inspector Panel    │ │
│  │ - Input     │  │   (Three.js)    │  │  - Object Props     │ │
│  │ - History   │  │   - Industrial  │  │  - Transform        │ │
│  │             │  │     Scene       │  │  - Appearance       │ │
│  └─────────────┘  └─────────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ Auth Service│  │ Prompt Parser   │  │  Scene Service      │ │
│  │ - JWT Auth  │  │ - NLP Rules     │  │  - CRUD Operations  │ │
│  │ - User Mgmt │  │ - Action Schema │  │  - PostgreSQL       │ │
│  └─────────────┘  └─────────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User Input**: User types a natural language prompt (e.g., "Add a robotic arm next to the conveyor")
2. **Prompt Processing**: Frontend sends the prompt to the backend `/api/v1/prompt` endpoint
3. **NLP Parsing**: Backend's `PromptParser` service converts the prompt into structured action(s)
4. **Action Response**: Backend returns a JSON response with parsed action(s)
5. **Scene Update**: Frontend's `SceneContext` applies actions to the Three.js scene
6. **Visual Feedback**: 3D scene updates in real-time with the requested changes

## Project Structure

```
Browser-based 3D AI Simulation Studio/
├── frontend/                      # React + Vite + Three.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── panels/           # PromptPanel, InspectorPanel
│   │   │   ├── scene/            # SceneCanvas (Three.js)
│   │   │   └── ui/               # Toolbar, Modal
│   │   ├── context/              # SceneContext, AuthContext
│   │   ├── hooks/                # useThreeScene
│   │   ├── services/             # API client
│   │   ├── types/                # TypeScript definitions
│   │   └── App.tsx               # Main application
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                       # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── api/routes/           # auth, scene, prompt endpoints
│   │   ├── core/                 # config, security, database
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # PromptParser, SceneService
│   │   └── main.py               # FastAPI application
│   └── requirements.txt
│
└── README.md
```

## Scene Action Schema

All scene modifications follow a consistent, extensible schema:

```json
{
  "action": "rotate_object",
  "target": "robot_arm_1",
  "params": {
    "axis": "y",
    "degrees": 30
  }
}
```

### Supported Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `add_object` | Add a new object to the scene | `type`, `name`, `position`, `rotation`, `scale`, `color` |
| `remove_object` | Remove an object | - |
| `move_object` | Move an object | `position` or `delta`, `absolute` |
| `rotate_object` | Rotate an object | `axis`, `degrees` |
| `scale_object` | Scale an object | `factor` |
| `set_color` | Change object color | `color` |
| `set_visibility` | Show/hide object | `visible` |
| `highlight_object` | Highlight with glow | `color`, `duration` |
| `camera_focus` | Move camera to target | `position`, `target` |
| `camera_zoom` | Zoom camera | `direction`, `amount` |
| `add_safety_zone` | Add a safety zone | `position`, `color`, `size` |
| `animate_object` | Start/stop animation | `animate` |
| `reset_scene` | Reset scene state | `keep_defaults` |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure database (edit .env file)
# DATABASE_URL=postgresql://user:pass@localhost:5432/simulation_studio

# Run migrations (tables are auto-created on startup)
# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the Application

- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:8000/api/v1/docs

## API Endpoints

### Authentication

```bash
# Register
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "securepassword"
}

# Login
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
username=testuser&password=securepassword
```

### Prompt Processing

```bash
# Parse prompt (requires auth)
POST /api/v1/prompt
{
  "prompt": "Add a robotic arm next to the conveyor",
  "context": {
    "objects": [...]
  }
}

# Response
{
  "success": true,
  "actions": [
    {
      "action": "add_object",
      "target": "robot_arm_1",
      "params": {
        "type": "robot_arm",
        "name": "Robot Arm",
        "position": {"x": 3, "y": 0, "z": 0},
        "rotation": {"x": 0, "y": 0, "z": 0},
        "scale": {"x": 1, "y": 1, "z": 1},
        "color": "#888888"
      }
    }
  ],
  "message": "Parsed 1 action(s): add_object on robot_arm_1",
  "original_prompt": "Add a robotic arm next to the conveyor"
}

# Demo endpoint (no auth required)
POST /api/v1/prompt/demo
```

### Scene Management

```bash
# Save scene
POST /api/v1/scene/save
{
  "name": "My Industrial Scene",
  "description": "A test scene",
  "scene_data": { ... }
}

# Load scene
GET /api/v1/scene/load/{scene_id}

# List scenes
GET /api/v1/scene/list

# Delete scene
DELETE /api/v1/scene/delete/{scene_id}
```

## Example Prompts

The prompt parser understands various natural language commands:

**Adding Objects:**
- "Add a robotic arm next to the conveyor"
- "Place a blue box on the left"
- "Create a safety zone in red"

**Modifying Objects:**
- "Rotate the robot arm 45 degrees"
- "Move the conveyor to the right"
- "Scale the box to 1.5"
- "Paint the robot arm orange"

**Camera Control:**
- "Zoom camera to inspection area"
- "Focus on the robot arm"
- "View from the top"

**Visibility & Effects:**
- "Hide the safety zone"
- "Highlight the conveyor in yellow"
- "Start animating the robot arm"

## Technology Stack

### Frontend
- **React 18** - UI framework with hooks
- **Vite** - Build tool and dev server
- **Three.js** - 3D graphics library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Passlib + Bcrypt** - Password hashing

## Key Features

1. **Natural Language Interface**: Type commands in plain English to modify the 3D scene
2. **Real-time 3D Rendering**: Smooth Three.js-powered visualization with shadows and realistic lighting
3. **Industrial Elements**: Pre-built conveyor belts, robotic arms, safety zones
4. **Object Selection**: Click objects to select and inspect their properties
5. **Scene Persistence**: Save and load scenes with user authentication
6. **Responsive UI**: Three-panel layout with prompt input, 3D canvas, and property inspector
7. **Export Functionality**: Download scene data as JSON
8. **Extensible Schema**: Clean action-based architecture for adding new commands

## License

MIT License - Feel free to use this project for learning and development.
