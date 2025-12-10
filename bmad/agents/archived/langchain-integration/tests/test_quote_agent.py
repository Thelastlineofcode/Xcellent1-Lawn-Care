# ARCHIVED: Tests for LangChain QuoteAgent prototype
# These tests are preserved in the archive to record prototype behavior.
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[5]))

from bmad.agents.archived.langchain_integration.adapter import tools as tools
from bmad.agents.archived.langchain_integration.agents.quote_agent import QuoteAgent


def test_propose_creates_outbox_event(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[5]
    db_path = repo_root / "bmad" / "agents" / "dev_db.json"
    db = {"leads": [], "events_outbox": [], "invoices": []}
    db_path.parent.mkdir(parents=True, exist_ok=True)
    db_path.write_text(json.dumps(db))

    lead = {"id": "lead_local_1", "name": "Test Lead", "phone": "555-0000"}
    db["leads"].append(lead)
    db_path.write_text(json.dumps(db))

    agent = QuoteAgent()
    out = agent.propose("lead_local_1")
    assert isinstance(out, dict)
    assert "price_low_cents" in out

    db2 = json.loads(db_path.read_text())
    found = [e for e in db2.get("events_outbox", []) if e.get("type") == "QUOTE_PROPOSED"]
    assert len(found) >= 1
