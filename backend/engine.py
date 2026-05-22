import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# ── Optional ML dependencies ──────────────────────────────────────────────────
# joblib / sklearn are only needed if you have trained model files.
# The scheduler works without them using a simple priority sort.
try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False


class ProductivityAI:
    def __init__(self) -> None:
        self.model = self._load_model("ml/task_model.pkl")
        self.categories = self._load_model("ml/categories.pkl")

    # ── Safe model loader ────────────────────────────────────────────────────
    def _load_model(self, path: str) -> Optional[Any]:
        """Load a joblib model only if the file exists and joblib is installed."""
        if not JOBLIB_AVAILABLE:
            print(f"[INFO] joblib not installed – skipping model load for {path}")
            return None
        if not os.path.exists(path):
            print(f"[INFO] Model file not found at '{path}' – running without it.")
            return None
        try:
            return joblib.load(path)
        except Exception as exc:
            print(f"[WARNING] Failed to load {path}: {exc}")
            return None

    # ── Core scheduling algorithm ────────────────────────────────────────────
    def optimize_schedule(
        self,
        tasks: List[Dict[str, Any]],
        outages: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Priority-First Slotting with Power-Constraint.

        Args:
            tasks:   list of dicts with keys: name, priority (int), 
                     needs_power (bool), duration (minutes)
            outages: list of dicts with keys: start (datetime), end (datetime)

        Returns:
            Ordered schedule with start/end ISO strings and status labels.
        """
        # 1. Sort by priority descending
        sorted_tasks = sorted(tasks, key=lambda x: x.get("priority", 0), reverse=True)

        schedule: List[Dict[str, Any]] = []
        current_time = (
            datetime.now().replace(minute=0, second=0, microsecond=0)
            + timedelta(hours=1)
        )

        for task in sorted_tasks:
            needs_power: bool = task.get("needs_power", True)
            duration: int = task.get("duration", 60)

            # 2. Check if the current slot falls inside any outage
            active_outages = [
                o for o in outages
                if o["start"] <= current_time < o["end"]
            ]
            is_during_outage = len(active_outages) > 0

            # 3. If task needs power and we're in an outage, skip to after it
            if needs_power and is_during_outage:
                future_ends = [o["end"] for o in outages if o["end"] > current_time]
                if future_ends:
                    current_time = min(future_ends)

            task_end = current_time + timedelta(minutes=duration)
            schedule.append({
                "task":   task["name"],
                "start":  current_time.isoformat(),
                "end":    task_end.isoformat(),
                "status": "Offline Mode" if (is_during_outage and not needs_power)
                          else "Power Safe",
            })
            current_time = task_end

        return schedule
