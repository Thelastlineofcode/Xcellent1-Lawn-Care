"""
Archived copy of adapter/tools.py for LangChain prototypes.
This is a read-only archive copy. Do not import or run in production.
"""
from pathlib import Path
import json
from typing import Any, Dict


def _db_path() -> Path:
    p = Path(__file__).resolve()
    repo_root = p.parents[6]
    return repo_root / "bmad" / "agents" / "dev_db.json"


def read_db() -> Dict[str, Any]:
    path = _db_path()
    if not path.exists():
        return {"leads": [], "events_outbox": [], "invoices": []}
    return json.loads(path.read_text())


def write_db(db: Dict[str, Any]) -> None:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(db, indent=2))


def get_lead(lead_id: str) -> Dict[str, Any] | None:
    db = read_db()
    for l in db.get("leads", []):
        if l.get("id") == lead_id:
            return l
    return None


def enqueue_outbox_event(event: Dict[str, Any]) -> Dict[str, Any]:
    db = read_db()
    idx = len(db.get("events_outbox", []))
    eid = f"lc_outbox_{int(Path(__file__).stat().st_mtime)}_{idx}"
    row = {"id": eid, **event}
    db.setdefault("events_outbox", []).append(row)
    write_db(db)
    return {"id": eid}
