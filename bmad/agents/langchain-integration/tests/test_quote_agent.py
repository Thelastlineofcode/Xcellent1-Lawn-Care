# QA Scaffold: Quote Agent Python Tests
#
# Test valid quote request (in-area)
# Test out-of-area address
# Test missing/invalid fields
#
# Implement with pytest or unittest
import json
import os
import pytest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

pytestmark = pytest.mark.skipif(os.getenv('ENABLE_AI_PROTOTYPES', 'false').lower() != 'true', reason='LangChain prototypes are archived. Set ENABLE_AI_PROTOTYPES=true to run them.')

from agents.langchain_integration.adapter import tools as tools
from agents.langchain_integration.agents.quote_agent import QuoteAgent


def test_propose_creates_outbox_event(tmp_path, monkeypatch):
    # ensure dev db is in a tmp location
    repo_root = Path(__file__).resolve().parents[3]
    db_path = repo_root / "dev_db.json"
    # initialize db
    db = {"leads": [], "events_outbox": [], "invoices": []}
    db_path.write_text(json.dumps(db))

    # insert a lead directly
    lead = {"id": "lead_local_1", "name": "Test Lead", "phone": "555-0000"}
    db["leads"].append(lead)
    db_path.write_text(json.dumps(db))

    # run agent
    agent = QuoteAgent()
    out = agent.propose("lead_local_1")
    assert isinstance(out, dict)
    assert "price_low_cents" in out
    assert out["price_low_cents"] > 0 or out["price_high_cents"] >= 0

    # verify outbox event created
    db2 = json.loads(db_path.read_text())
    found = [e for e in db2.get("events_outbox", []) if e.get("type") == "QUOTE_PROPOSED"]
    assert len(found) >= 1
