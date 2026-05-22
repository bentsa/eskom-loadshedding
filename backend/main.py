import os
from datetime import datetime
from typing import List, Dict, Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engine import ProductivityAI

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="LoadShedding AI API", version="1.0.0")

# CORS: restrict to your frontend origin in production
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Singleton AI engine ───────────────────────────────────────────────────────
ai = ProductivityAI()

# EskomSePush API key – set this in your .env file
ESP_API_KEY: str = os.getenv("ESP_API_KEY", "")


# ── Request / Response models ─────────────────────────────────────────────────
class TaskIn(BaseModel):
    name: str
    priority: int = 5
    needs_power: bool = True
    duration: int = 60  # minutes


class ScheduleRequest(BaseModel):
    area_id: str
    tasks: List[TaskIn]


# ── Helpers ───────────────────────────────────────────────────────────────────
def _parse_outages(raw_events: List[Dict[str, Any]]) -> List[Dict[str, datetime]]:
    """Convert raw EskomSePush events to datetime dicts."""
    outages = []
    for event in raw_events:
        try:
            outages.append({
                "start": datetime.fromisoformat(event["start"].replace("Z", "+00:00")),
                "end":   datetime.fromisoformat(event["end"].replace("Z", "+00:00")),
            })
        except (KeyError, ValueError):
            continue
    return outages


def _mock_data() -> Dict[str, Any]:
    """Fallback mock data for development or when ESP API is unavailable."""
    today = datetime.now().strftime("%Y-%m-%d")
    return {
        "info": {"name": "Sandton (Mock Fallback)"},
        "events": [
            {"start": f"{today}T10:00:00", "end": f"{today}T12:30:00", "note": "Stage 2"},
            {"start": f"{today}T18:00:00", "end": f"{today}T20:30:00", "note": "Stage 2"},
        ],
    }


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "LoadShedding AI API is running"}


@app.get("/api/v1/outages/{area_id}")
async def get_outages(area_id: str) -> Dict[str, Any]:
    """
    Fetch outage schedule for an area from EskomSePush.
    Falls back to mock data if the API key is missing or the request fails.
    """
    if not ESP_API_KEY:
        print("[INFO] ESP_API_KEY not set – returning mock data.")
        return _mock_data()

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"https://developer.sepush.co.za/business/2.0/area?id={area_id}",
                headers={"Token": ESP_API_KEY},
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            print(f"[WARNING] ESP API returned {exc.response.status_code} – using mock data.")
            return _mock_data()
        except Exception as exc:
            print(f"[WARNING] ESP API unreachable ({exc}) – using mock data.")
            return _mock_data()


@app.post("/api/v1/schedule")
async def generate_schedule(body: ScheduleRequest) -> Dict[str, Any]:
    """
    Generate an AI-optimised task schedule around load-shedding outages.
    """
    outage_data = await get_outages(body.area_id)
    outages = _parse_outages(outage_data.get("events", []))
    tasks_dicts = [t.model_dump() for t in body.tasks]
    schedule = ai.optimize_schedule(tasks_dicts, outages)
    return {"area": outage_data.get("info", {}).get("name", body.area_id), "schedule": schedule}
