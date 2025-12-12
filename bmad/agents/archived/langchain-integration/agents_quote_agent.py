"""
Archived copy of agents/quote_agent.py (LangChain prototype).
This is a read-only archive copy. Do not import or run in production.
"""
from __future__ import annotations
import os
import json
from typing import Any, Dict, List

try:
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
                self.llm = None  # PerplexityLLM placeholder
            elif LANGCHAIN_AVAILABLE and os.getenv("OPENAI_API_KEY"):
                self.llm = OpenAI()
            else:
                self.llm = MockLLM()
