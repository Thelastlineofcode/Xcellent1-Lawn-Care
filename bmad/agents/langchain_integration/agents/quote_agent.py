"""ARCHIVED: LangChain-based QuoteAgent prototype (Python).
This file is archived and should not be used in production. To enable in
development, set `ENABLE_AI_PROTOTYPES=true` in your environment.

This prototype tries to use LangChain/OpenAI if available and falls back to
a simple MockLLM for local testing. The agent returns a structured JSON-like
dict with price_low_cents, price_high_cents, confidence (0-1), notes and
two suggested time slots.
"""
import os
if os.environ.get('ENABLE_AI_PROTOTYPES', 'false').lower() != 'true':
    raise RuntimeError('LangChain prototypes are archived. Set ENABLE_AI_PROTOTYPES=true to enable.')
from __future__ import annotations
import os
import json
from typing import Any, Dict, List

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
        # Return a deterministic JSON blob based on the prompt for testing
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
            # If a Perplexity API key is present, prefer a Perplexity wrapper
            pkey = os.getenv("PERPLEXITY_API_KEY")
            purl = os.getenv("PERPLEXITY_API_URL")
            if pkey and HTTPX_AVAILABLE:
                self.llm = PerplexityLLM(api_key=pkey, api_url=purl)
            elif LANGCHAIN_AVAILABLE and os.getenv("OPENAI_API_KEY"):
                # Use LangChain OpenAI wrapper if available
                self.llm = OpenAI()
            else:
                self.llm = MockLLM()

    def propose(self, lead_id: str) -> Dict[str, Any]:
        """Propose a quote for the given lead id using the configured LLM.

        This normalizes the different LLM interfaces (generate/propose/call)
        and returns the parsed quote dict. It also enqueues a QUOTE_PROPOSED
        event in the local dev DB.
        """
        lead = tools.get_lead(lead_id) or {}

        # If the LLM itself exposes a propose method (like PerplexityLLM), use it.
        if hasattr(self.llm, "propose"):
            try:
                result = self.llm.propose(lead_id)
                return result
            except Exception:
                pass

        # Build a prompt (prefer LLM helper if present)
        if hasattr(self.llm, "_build_prompt"):
            prompt = self.llm._build_prompt(lead)
        else:
            prompt = (
                "You are a pricing assistant for a lawn care company. Given the lead data, "
                "produce a JSON object with fields: price_low_cents, price_high_cents, confidence (0-1), notes, slots (array of two ISO datetimes).\n"
                f"Lead: {json.dumps(lead)}\n\nReturn only JSON."
            )

        # Ask the LLM
        try:
            if hasattr(self.llm, "__call__"):
                raw = self.llm(prompt)
            else:
                raw = self.llm.generate(prompt)
        except Exception:
            raw = MockLLM().generate(prompt)

        # Parse output
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
            "created_at": "synthetic",
        })

        return result


class PerplexityLLM:
    """A very small Perplexity API wrapper used when PERPLEXITY_API_KEY is set.

    This is intentionally minimal: it POSTs the prompt as JSON to the configured
    `PERPLEXITY_API_URL` (env) or a default. The response parsing is best-effort
    and may need adjustment for the actual Perplexity API shape.
    """
    def __init__(self, api_key: str, api_url: str | None = None):
        self.api_key = api_key
        self.api_url = api_url or "https://api.perplexity.ai/v1/answers"

    def generate(self, prompt: str) -> str:
        # synchronous call using httpx
        try:
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            payload = {"query": prompt}
            resp = httpx.post(self.api_url, json=payload, headers=headers, timeout=30.0)
            if resp.status_code != 200:
                return "{}"
            # Try to extract text/answer fields commonly returned
            j = resp.json()
            if isinstance(j, dict):
                # common keys might be 'answer', 'text', or 'data'
                if "answer" in j:
                    return j["answer"]
                if "text" in j:
                    return j["text"]
                # fallback to full json
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
            # Use LangChain LLM (not strictly correct API for all versions, keep flexible)
            try:
                # LLM may accept prompt via call or generate; try both
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
            # best-effort parse: search for first JSON object in text
            start = raw.find('{')
            end = raw.rfind('}')
            if start != -1 and end != -1 and end > start:
                try:
                    out = json.loads(raw[start:end+1])
                except Exception:
                    out = {}
            else:
                out = {}

        # ensure required keys
        result = {
            "price_low_cents": int(out.get("price_low_cents") or 0),
            "price_high_cents": int(out.get("price_high_cents") or 0),
            "confidence": float(out.get("confidence") or 0.0),
            "notes": out.get("notes") or "",
            "slots": out.get("slots") or [],
        }

        # enqueue an outbox event for QUOTE_PROPOSED
        tools.enqueue_outbox_event({
            "type": "QUOTE_PROPOSED",
            "payload": {"lead_id": lead_id, "quote": result},
            "created_at": "synthetic",
        })

        return result


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("lead_id", help="lead id to propose a quote for")
    args = p.parse_args()
    qa = QuoteAgent()
    out = qa.propose(args.lead_id)
    print(json.dumps(out, indent=2))
