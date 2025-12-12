"""ARCHIVED: LangChain-based QuoteAgent prototype (Python).
This file is an archived copy of the LangChain prototype moved to the archive folder on 2025-12-10.
Do not use in active runtime unless re-enabled and audited.
"""
from __future__ import annotations
import os
import json
from typing import Any, Dict

try:
    # Try to import a LangChain/OpenAI LLM (optional)
    from langchain import LLMChain, PromptTemplate
    from langchain.llms import OpenAI
    LANGCHAIN_AVAILABLE = True
except Exception:
    LANGCHAIN_AVAILABLE = False

try:
    import httpx
    HTTPX_AVAILABLE = True
except Exception:
    HTTPX_AVAILABLE = False

from ..adapter import tools


class MockLLM:
    def generate(self, prompt: str) -> str:
        out = {
            "price_low_cents": 5000,
            "price_high_cents": 7000,
            "confidence": 0.85,
            "notes": "Standard lawn, weekly service recommended.",
            "slots": ["2025-11-10T09:00:00", "2025-11-12T13:00:00"],
        }
        return json.dumps(out)


class QuoteAgent:
    def __init__(self, llm=None):
        if llm is not None:
            self.llm = llm
        else:
            pkey = os.getenv("PERPLEXITY_API_KEY")
            purl = os.getenv("PERPLEXITY_API_URL")
            if pkey and HTTPX_AVAILABLE:
                self.llm = PerplexityLLM(api_key=pkey, api_url=purl)
            elif LANGCHAIN_AVAILABLE and os.getenv("OPENAI_API_KEY"):
                self.llm = OpenAI()
            else:
                self.llm = MockLLM()


class PerplexityLLM:
    def __init__(self, api_key: str, api_url: str | None = None):
        self.api_key = api_key
        self.api_url = api_url or "https://api.perplexity.ai/v1/answers"

    def generate(self, prompt: str) -> str:
        try:
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            payload = {"query": prompt}
            resp = httpx.post(self.api_url, json=payload, headers=headers, timeout=30.0)
            if resp.status_code != 200:
                return "{}"
            j = resp.json()
            if isinstance(j, dict):
                if "answer" in j:
                    return j["answer"]
                if "text" in j:
                    return j["text"]
                return json.dumps(j)
            return resp.text
        except Exception:
            return "{}"

    def _build_prompt(self, lead: Dict[str, Any]) -> str:
        return (
            "You are a pricing assistant for a lawn care company. Given the lead data, "
            "produce a JSON object with fields: price_low_cents, price_high_cents, confidence (0-1), notes, slots (array of two ISO datetimes).\n"
            f"Lead: {json.dumps(lead)}\n\nReturn only JSON."
        )

    def propose(self, lead_id: str) -> Dict[str, Any]:
        lead = tools.get_lead(lead_id) or {}
        prompt = self._build_prompt(lead)
        if LANGCHAIN_AVAILABLE and hasattr(self.llm, "generate"):
            try:
                if hasattr(self.llm, "__call__"):
                    raw = self.llm(prompt)
                else:
                    raw = self.llm.generate(prompt)
            except Exception:
                raw = MockLLM().generate(prompt)
        else:
            raw = self.llm.generate(prompt)

        try:
            out = json.loads(raw)
        except Exception:
            start = raw.find('{')
            end = raw.rfind('}')
            if start != -1 and end != -1 and end > start:
                try:
                    out = json.loads(raw[start:end+1])
                except Exception:
                    out = {}
            else:
                out = {}

        result = {
            "price_low_cents": int(out.get("price_low_cents") or 0),
            "price_high_cents": int(out.get("price_high_cents") or 0),
            "confidence": float(out.get("confidence") or 0.0),
            "notes": out.get("notes") or "",
            "slots": out.get("slots") or [],
        }

        tools.enqueue_outbox_event({
            "type": "QUOTE_PROPOSED",
            "payload": {"lead_id": lead_id, "quote": result},
            "created_at": "archived",
        })

        return result
