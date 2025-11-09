import requests
import os
from datetime import datetime

def perplexityResearch(query, model='sonar-pro', max_tokens=2000, return_citations=True, 
                       temperature=0.2, search_recency_filter='month'):
    """
    Perform real-time web research using Perplexity API
    
    Args:
        query (str): Research question or topic
        model (str): 'sonar-pro' (best), 'sonar' (fast), 'sonar-reasoning-pro' (complex)
        max_tokens (int): Max response length (1000-4000)
        return_citations (bool): Include source URLs and citations
        temperature (float): 0.0 (focused) to 1.0 (creative)
        search_recency_filter (str): 'day', 'week', 'month', 'year' (how recent sources)
    
    Returns:
        {
            'answer': str,
            'citations': [{'url': str, 'title': str, 'snippet': str}],
            'model': str,
            'tokens_used': int,
            'execution_time': float,
            'timestamp': str
        }
    
    Raises:
        Exception: If API key missing or request fails
    
    Example:
        >>> # Research Stripe webhook best practices
        >>> result = perplexityResearch(
        ...     query="Stripe webhook signature verification in Next.js 15",
        ...     model='sonar-pro',
        ...     search_recency_filter='month'
        ... )
        >>> print(result['answer'])
        >>> for citation in result['citations']:
        ...     print(f"- {citation['title']}: {citation['url']}")
    """
    import time
    start = time.time()
    
    # Get API key from environment
    api_key = os.getenv('PERPLEXITY_API_KEY')
    if not api_key:
        raise Exception(
            "PERPLEXITY_API_KEY not found in environment variables. "
            "Get your key at https://www.perplexity.ai/settings/api"
        )
    
    # API endpoint
    url = "https://api.perplexity.ai/chat/completions"
    
    # Build request payload
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a helpful research assistant. Provide accurate, "
                    "well-researched answers with specific examples and citations. "
                    "Focus on current best practices and recent information."
                )
            },
            {
                "role": "user",
                "content": query
            }
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "return_citations": return_citations,
        "return_images": False,
        "search_recency_filter": search_recency_filter,
        "stream": False
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        # Make API request
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract answer
        answer = data['choices'][0]['message']['content']
        
        # Extract citations
        citations = []
        if return_citations and 'citations' in data:
            citations = [
                {
                    'url': cit,
                    'title': cit.split('/')[2],  # Extract domain as title
                    'snippet': ''  # API doesn't return snippets by default
                }
                for cit in data.get('citations', [])
            ]
        
        # Calculate execution time
        exec_time = round(time.time() - start, 2)
        
        # Extract usage stats
        usage = data.get('usage', {})
        tokens_used = usage.get('total_tokens', 0)
        
        return {
            'answer': answer,
            'citations': citations,
            'model': model,
            'tokens_used': tokens_used,
            'execution_time': exec_time,
            'timestamp': datetime.now().isoformat(),
            'success': True
        }
    
    except requests.exceptions.RequestException as e:
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


# -----------------------------------------------------------------
# USAGE EXAMPLES
# -----------------------------------------------------------------

# Example 1: Research technical implementation
def example_research_stripe_webhooks():
    """Research Stripe webhook implementation for Next.js"""
    result = perplexityResearch(
        query=(
            "What are the best practices for Stripe webhook signature verification "
            "in Next.js 15? Include specific code examples and error handling."
        ),
        model='sonar-pro',
        search_recency_filter='month'
    )
    
    if result['success']:
        print("=" * 60)
        print("STRIPE WEBHOOK RESEARCH")
        print("=" * 60)
        print(result['answer'])
        print("\nSources:")
        for i, cite in enumerate(result['citations'], 1):
            print(f"{i}. {cite['url']}")
        print(f"\nTokens used: {result['tokens_used']}")
        print(f"Time: {result['execution_time']}s")
    else:
        print(f"Error: {result['error']}")


# Example 2: Debug error with context
def example_research_error_solution(error_message, tech_stack):
    """Research solution to specific error"""
    query = f"""
    I'm getting this error in {tech_stack}:
    
    {error_message}
    
    What are the most common causes and solutions?
    Include code examples for the fix.
    """
    
    result = perplexityResearch(
        query=query,
        model='sonar-pro',
        search_recency_filter='week'  # Very recent solutions
    )
    
    return result


# Example 3: Compare implementation approaches
def example_compare_approaches():
    """Compare different technical approaches"""
    result = perplexityResearch(
        query=(
            "Compare Supabase vs Firebase for a Next.js SaaS app with 1000 users. "
            "Focus on: cost, developer experience, scalability, and real-time features. "
            "Provide specific pricing examples."
        ),
        model='sonar-reasoning-pro',  # Use reasoning model for complex comparisons
        max_tokens=3000  # Longer response for detailed comparison
    )
    
    return result


# Example 4: Research for BMad story implementation
def research_for_story(story_title, requirements):
    """Research best practices before implementing a user story"""
    query = f"""
    User Story: {story_title}
    
    Requirements:
    {requirements}
    
    What are the best practices and common pitfalls for implementing this?
    Include:
    1. Recommended architecture patterns
    2. Security considerations
    3. Testing strategies
    4. Code examples from production apps
    """
    
    result = perplexityResearch(
        query=query,
        model='sonar-pro',
        search_recency_filter='month',
        max_tokens=2500
    )
    
    # Save research to docs folder for BMad workflow
    if result['success']:
        # Save for later reference
        filename = f"research-{story_title.lower().replace(' ', '-')}.md"
        with open(f"docs/research/{filename}", 'w') as f:
            f.write(f"# Research: {story_title}\n\n")
            f.write(f"**Generated:** {result['timestamp']}\n\n")
            f.write(f"## Requirements\n{requirements}\n\n")
            f.write(f"## Research Findings\n{result['answer']}\n\n")
            f.write("## Sources\n")
            for cite in result['citations']:
                f.write(f"- {cite['url']}\n")
        
        print(f"Research saved to docs/research/{filename}")
    
    return result


# Example 5: Competitive analysis
def research_competitors(product_category, focus_area='pricing'):
    """Research competitors in your SaaS niche"""
    result = perplexityResearch(
        query=(
            f"What are the top 5 {product_category} SaaS products in 2025? "
            f"Compare their {focus_area}, features, and target markets. "
            "Include specific numbers and URLs."
        ),
        model='sonar-pro',
        search_recency_filter='month',
        max_tokens=3000
    )
    
    return result


# Example 6: SEO keyword research
def research_seo_keywords(niche, target_audience):
    """Research SEO keywords for content strategy"""
    result = perplexityResearch(
        query=(
            f"What are the best SEO keywords for {niche} targeting {target_audience}? "
            "Include: search volume estimates, difficulty scores, and content ideas. "
            "Focus on long-tail keywords with 300-1000 monthly searches."
        ),
        model='sonar-pro',
        search_recency_filter='week'
    )
    
    return result


# -----------------------------------------------------------------
# INTEGRATION WITH BMAD METHOD
# -----------------------------------------------------------------

def bmad_story_research_workflow(story_md_path):
    """
    Complete research workflow for a BMad user story
    
    Args:
        story_md_path: Path to user story markdown file
    
    Returns:
        dict: Research results with recommendations
    """
    # Read story file
    with open(story_md_path, 'r') as f:
        story_content = f.read()
    
    # Extract story title and requirements
    lines = story_content.split('\n')
    story_title = lines[0].replace('#', '').strip()
    
    # Research in phases
    results = {}
    
    # Phase 1: Architecture research
    print("Phase 1: Researching architecture patterns...")
    results['architecture'] = perplexityResearch(
        query=f"Best architecture patterns for: {story_title}",
        model='sonar-pro'
    )
    
    # Phase 2: Security research
    print("Phase 2: Researching security considerations...")
    results['security'] = perplexityResearch(
        query=f"Security best practices for: {story_title}",
        model='sonar-pro',
        search_recency_filter='month'
    )
    
    # Phase 3: Implementation examples
    print("Phase 3: Finding implementation examples...")
    results['examples'] = perplexityResearch(
        query=f"Production code examples for: {story_title} in Next.js TypeScript",
        model='sonar-pro'
    )
    
    # Aggregate results
    total_time = sum(r['execution_time'] for r in results.values())
    total_tokens = sum(r['tokens_used'] for r in results.values())
    all_citations = []
    for r in results.values():
        all_citations.extend(r['citations'])
    
    return {
        'story': story_title,
        'research_phases': results,
        'summary': {
            'total_time': round(total_time, 2),
            'total_tokens': total_tokens,
            'total_citations': len(all_citations),
            'unique_sources': len(set(c['url'] for c in all_citations))
        }
    }


# -----------------------------------------------------------------
# COST TRACKING
# -----------------------------------------------------------------

class PerplexityResearchTracker:
    """Track Perplexity API usage and costs"""
    
    def __init__(self):
        self.requests = []
        # Pricing (as of Nov 2025)
        self.pricing = {
            'sonar': 1.0,        # $1 per 1M tokens
            'sonar-pro': 5.0,    # $5 per 1M tokens
            'sonar-reasoning-pro': 10.0  # $10 per 1M tokens
        }
    
    def track_request(self, result):
        """Track a research request"""
        self.requests.append({
            'timestamp': result['timestamp'],
            'model': result['model'],
            'tokens': result['tokens_used'],
            'time': result['execution_time']
        })
    
    def get_monthly_cost(self):
        """Calculate estimated monthly cost"""
        total_tokens = sum(r['tokens'] for r in self.requests)
        
        cost_by_model = {}
        for model, price_per_million in self.pricing.items():
            model_tokens = sum(
                r['tokens'] for r in self.requests 
                if r['model'] == model
            )
            cost_by_model[model] = (model_tokens / 1_000_000) * price_per_million
        
        return {
            'total_requests': len(self.requests),
            'total_tokens': total_tokens,
            'cost_by_model': cost_by_model,
            'estimated_monthly_cost': sum(cost_by_model.values()),
            'average_tokens_per_request': total_tokens / len(self.requests) if self.requests else 0
        }


# -----------------------------------------------------------------
# SETUP INSTRUCTIONS
# -----------------------------------------------------------------

"""
SETUP:

1. Get Perplexity API Key:
   - Go to https://www.perplexity.ai/settings/api
   - Click "Generate API Key"
   - Copy your pplx-xxxxxxxx key

2. Set Environment Variable:
   
   Linux/Mac:
   export PERPLEXITY_API_KEY="pplx-your-key-here"
   
   Windows (PowerShell):
   $env:PERPLEXITY_API_KEY="pplx-your-key-here"
   
   Or add to .env file:
   PERPLEXITY_API_KEY=pplx-your-key-here

3. Install dependencies:
   pip install requests

4. Test it:
   python
   >>> from perplexity_research import perplexityResearch
   >>> result = perplexityResearch("What is the capital of France?")
   >>> print(result['answer'])

USAGE IN CLINE/VS CODE:

1. Save this file to your project: src/skills/perplexity_research.py

2. In Cline chat:
   "Load the perplexityResearch skill and use it to research Stripe webhooks"

3. Cline will:
   - Import the skill
   - Call perplexityResearch() with your query
   - Use the research findings to implement code

COST ESTIMATE:

- Sonar Pro: ~$5 per 1M tokens
- Typical research query: 500-1500 tokens
- Cost per query: $0.0025-$0.0075 (less than 1 cent)
- 100 research queries/month: $0.25-$0.75
- Heavy usage (500 queries/month): $1.25-$3.75

MUCH cheaper than MCP server overhead and easier to maintain!
"""
