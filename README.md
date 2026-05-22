# ⚡ Eskom LoadShedding AI Dashboard

AI-powered task scheduler that works around load-shedding outages.

---

## Quick Start

### 1 — Open in VS Code
Double-click `eskom-loadshedding.code-workspace` — VS Code will open both
the frontend and backend as a multi-root workspace with the correct settings.

---

### 2 — Frontend Setup

```powershell
cd frontend
npm install          # installs React, Tailwind, lucide-react, Vite
npm run dev          # starts on http://localhost:3000
```

---

### 3 — Backend Setup

```powershell
cd backend

# Create a virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows PowerShell
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

# Copy the env template and add your EskomSePush key
copy .env.example .env
# Then edit .env and paste your ESP_API_KEY

uvicorn main:app --reload       # starts on http://localhost:8000
```

> **No ESP_API_KEY?** The app automatically falls back to mock data so you
> can develop and test without a key.

---

## Project Structure

```
eskom-loadshedding/
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # React entry point
│   │   ├── App.tsx           # Root component
│   │   ├── Dashboard.tsx     # Main dashboard UI ✅ fixed
│   │   └── index.css         # Tailwind base styles
│   ├── tailwind.config.js    # Tailwind v3 config ✅ fixed
│   ├── tsconfig.json         # TypeScript config ✅ fixed
│   ├── vite.config.ts        # Vite + API proxy ✅ fixed
│   └── package.json          # All deps including lucide-react ✅ fixed
│
├── backend/
│   ├── engine.py             # AI scheduler ✅ fixed (safe model loading)
│   ├── main.py               # FastAPI app ✅ fixed (secure CORS, typed)
│   ├── requirements.txt      # Python deps
│   ├── .env.example          # Environment variable template
│   └── ml/                   # Drop your .pkl files here (optional)
│
└── eskom-loadshedding.code-workspace   # Open this in VS Code
```

---

## What Was Fixed

| File | Problem | Fix |
|------|---------|-----|
| `Dashboard.tsx` | Missing `import React` → 102 TS errors | Added import, typed all components |
| `package.json` | `lucide-react` not installed | Added to dependencies |
| `tailwind.config.js` | `content` paths too narrow | Now covers all `src/**/*.tsx` |
| `tsconfig.json` | Missing, causing TS7026 errors | Created correct config |
| `engine.py` | `joblib.load()` crashes if file missing | Guarded with `os.path.exists()` |
| `main.py` | `allow_origins=["*"]` security risk | Reads from `ALLOWED_ORIGINS` env var |
| `.env` | Loaded as a command in PowerShell | Use `.env.example` → `.env` with dotenv |

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET`  | `/api/v1/outages/{area_id}` | Fetch outages (falls back to mock) |
| `POST` | `/api/v1/schedule`          | Generate optimised task schedule |

### Example schedule request
```json
POST /api/v1/schedule
{
  "area_id": "eskde-10-sandtonext4",
  "tasks": [
    { "name": "Frontend Dev", "priority": 9, "needs_power": true, "duration": 90 },
    { "name": "Reading",      "priority": 5, "needs_power": false, "duration": 30 }
  ]
}
```
