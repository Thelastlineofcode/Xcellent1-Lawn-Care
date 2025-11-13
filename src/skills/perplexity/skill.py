"""
Perplexity Research Skill - Token-Efficient Web Research for AI Agents
Author: Xcellent1 Lawn Care Dev Team
Version: 1.0.0

This skill provides a clean interface for Perplexity API calls,
designed to be used as a tool by LangChain agents without bloating prompts.
"""

import requests
import os
from datetime import datetime
from typing import Dict, List, Optional, Literal

# Type definitions
ModelType = Literal['sonar', 'sonar-pro', 'sonar-reasoning-pro']
RecencyFilter = Literal['day', 'week', 'month', 'year']


class ResearchSkill:
    """Main research skill class"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('PERPLEXITY_API_KEY')
        if not self.api_key:
            raise ValueError(
                "PERPLEXITY_API_KEY not found. "
                "Set it in .env or pass to constructor."
            )
        self.endpoint = "https://api.perplexity.ai/chat/completions"
    
    def query(
        self,
        question: str,
        model: ModelType = 'sonar-pro',
        max_tokens: int = 2000,
        recency: RecencyFilter = 'month',
        temperature: float = 0.2
    ) -> Dict:
        """
        Execute research query
        
        Args:
            question: Research question (be specific)
            model: Which Perplexity model to use
            max_tokens: Max response length
            recency: How recent sources should be
            temperature: 0.0 (focused) to 1.0 (creative)
        
        Returns:
            {
                'answer': Research findings,
                'citations': List of source URLs,
                'model': Model used,
                'tokens_used': Token count,
                'execution_time': Seconds taken,
                'success': bool
            }
        """
        import time
        start = time.time()
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Provide accurate, well-researched answers with citations. "
                        "Focus on current best practices and actionable information."
                    )
                },
                {"role": "user", "content": question}
            ],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "return_citations": True,
            "search_recency_filter": recency,
            "stream": False
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                self.endpoint,
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                'answer': data['choices'][0]['message']['content'],
                'citations': data.get('citations', []),
                'model': model,
                'tokens_used': data.get('usage', {}).get('total_tokens', 0),
                'execution_time': round(time.time() - start, 2),
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
        except Exception as e:
            return {
                'answer': '',
                'citations': [],
                'model': model,
                'tokens_used': 0,
                'execution_time': round(time.time() - start, 2),
                'timestamp': datetime.now().isoformat(),
                'success': False,
                'error': str(e)
            }


# Simple function interface for quick usage
def research(query: str, **kwargs) -> Dict:
    """Quick research function - default settings"""
    skill = ResearchSkill()
    return skill.query(query, **kwargs)


# Cost tracker
class ResearchTracker:
    """Track API usage and costs"""
    
    def __init__(self):
        self.calls = []
        self.pricing = {
            'sonar': 1.0,  # $1 per 1M tokens
            'sonar-pro': 5.0,
            'sonar-reasoning-pro': 10.0
        }
    
    def track(self, result: Dict):
        """Record a research call"""
        self.calls.append({
            'timestamp': result.get('timestamp'),
            'model': result.get('model'),
            'tokens': result.get('tokens_used', 0),
            'time': result.get('execution_time', 0),
            'success': result.get('success', False)
        })
    
    def get_monthly_cost(self) -> Dict:
        """Calculate estimated costs"""
        total_tokens = sum(c['tokens'] for c in self.calls)
        
        costs_by_model = {}
        for model, price_per_million in self.pricing.items():
            model_tokens = sum(
                c['tokens'] for c in self.calls 
                if c['model'] == model
            )
            costs_by_model[model] = round(
                (model_tokens / 1_000_000) * price_per_million, 
                2
            )
        
        return {
            'total_calls': len(self.calls),
            'successful_calls': sum(1 for c in self.calls if c['success']),
            'total_tokens': total_tokens,
            'costs_by_model': costs_by_model,
            'estimated_monthly_cost': round(sum(costs_by_model.values()), 2),
            'avg_tokens_per_call': round(total_tokens / len(self.calls)) if self.calls else 0
        }


# Example usage
if __name__ == "__main__":
    # Quick test
    result = research("Best practices for lawn mowing patterns")
    
    if result['success']:
        print(f"Answer: {result['answer']}")
        print(f"\nSources: {len(result['citations'])} citations")
        print(f"Tokens: {result['tokens_used']}")
        print(f"Time: {result['execution_time']}s")
    else:
        print(f"Error: {result.get('error')}")
