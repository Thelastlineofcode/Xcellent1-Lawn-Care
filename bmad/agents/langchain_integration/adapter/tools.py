"""Tool adapters for LangChain prototype.

These are minimal, local-only tools that operate on the file-backed dev DB
(`bmad/agents/dev_db.json`) so the Python prototype can be run without
Supabase or external services.
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict


def _db_path() -> Path:
    # repo root is four parents up from this file: adapter -> langchain_integration -> agents -> bmad
    p = Path(__file__).resolve()
    # p.parents: 0=adapter,1=langchain_integration,2=agents,3=bmad,4=workspace_root
    bmad_dir = p.parents[3]
    workspace_root = p.parents[4]

    # Prefer the dev_db placed under bmad/ (this is where the tests write it).
    candidate_bmad = bmad_dir / "dev_db.json"
    if candidate_bmad.exists():
        return candidate_bmad

    # Fall back to older locations used by other parts of the repo.
    candidate_agents = workspace_root / "bmad" / "agents" / "dev_db.json"
    if candidate_agents.exists():
        return candidate_agents

    # Final fallback: workspace-level agents/dev_db.json
    return workspace_root / "agents" / "dev_db.json"


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
