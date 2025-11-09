# Perplexity Research Skill - Quick Guide

## What It Does
Real-time web research powered by Perplexity AI. Use it to research technical solutions, debug errors, and find best practices while building your lawn care SaaS.

## Setup (1 minute)

1. Get API key: https://www.perplexity.ai/settings/api
2. Add to your `.env`:
```bash
PERPLEXITY_API_KEY=pplx-your-key-here
```

## Quick Examples

### Research Before Building a Feature
```python
from perplexity_research import perplexityResearch

# Before implementing SMS notifications
result = perplexityResearch(
    query="Twilio SMS webhook verification best practices Deno Deploy",
    model='sonar-pro'
)

print(result['answer'])
# See citations
for citation in result['citations']:
    print(f"→ {citation['url']}")
```

### Debug an Error
```python
# Got an error? Research the solution
result = perplexityResearch(
    query="""
    I'm getting this error in Deno Deploy:
    'Supabase RLS policy denying INSERT on jobs table'
    
    What are common causes and solutions?
    """,
    search_recency_filter='week'  # Very recent solutions
)
```

### Compare Tech Options
```python
# Deciding between solutions
result = perplexityResearch(
    query="""
    Compare Twilio vs Vonage for SMS notifications in a small business app:
    - Cost for 1000 SMS/month
    - Reliability
    - Ease of integration with Deno
    """,
    model='sonar-reasoning-pro',  # Better for comparisons
    max_tokens=3000
)
```

## Cost Tracking

```python
from perplexity_research import PerplexityResearchTracker

tracker = PerplexityResearchTracker()

# After each research call
tracker.track_request(result)

# Check monthly estimate
cost = tracker.get_monthly_cost()
print(f"Estimated monthly cost: ${cost['estimated_monthly_cost']:.2f}")
print(f"Average tokens per request: {cost['average_tokens_per_request']:.0f}")
```

### Pricing
- **sonar**: $1 per 1M tokens (~$0.002 per research)
- **sonar-pro**: $5 per 1M tokens (~$0.01 per research)
- **sonar-reasoning-pro**: $10 per 1M tokens (~$0.02 per research)

**Reality check:** 50 researches/month with sonar-pro = ~$0.50

## When to Use It

**✅ Great for:**
- Research best practices before implementing features
- Debug errors with latest solutions
- Compare technology options
- Find code examples
- Learn about new libraries/APIs

**❌ Don't use for:**
- Information you already know
- Simple Google searches
- Stable, well-known concepts
- Local file analysis (use Desktop Commander for that)

## Integration with Your Workflow

### Option 1: Run Directly in Python
```bash
cd /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care
python3 -c "from src.skills.perplexity_research import perplexityResearch; \
result = perplexityResearch('Supabase RLS best practices'); \
print(result['answer'])"
```

### Option 2: Quick Script
Create `quick-research.py`:
```python
#!/usr/bin/env python3
import sys
from src.skills.perplexity_research import perplexityResearch

query = ' '.join(sys.argv[1:])
result = perplexityResearch(query, model='sonar-pro')

print("\n" + "="*60)
print("RESEARCH RESULTS")
print("="*60 + "\n")
print(result['answer'])
print("\n\nSOURCES:")
for i, cite in enumerate(result['citations'], 1):
    print(f"{i}. {cite['url']}")
print(f"\nTokens: {result['tokens_used']} | Time: {result['execution_time']}s")
```

Run it:
```bash
chmod +x quick-research.py
./quick-research.py "Best way to handle Stripe webhooks in Deno"
```

### Option 3: Use with BMad Workflow
The file already has `research_for_story()` function - use it before implementing user stories.

## Real-World Example

```python
# You're building the SMS notification feature
# Research first, implement second

result = perplexityResearch(
    query="""
    I'm building SMS notifications for a lawn care app with Deno Deploy + Supabase.
    
    Requirements:
    - Send job completion notifications to customers
    - Send weekly digest to owner
    - Handle Twilio webhooks securely
    
    What's the best architecture and code structure?
    Include Deno-specific examples.
    """,
    model='sonar-pro',
    max_tokens=2500
)

# Save the research
with open('docs/research/sms-notifications-research.md', 'w') as f:
    f.write(f"# SMS Notifications Research\n\n")
    f.write(result['answer'])
    f.write("\n\n## Sources\n")
    for cite in result['citations']:
        f.write(f"- {cite['url']}\n")

print("Research saved! Now you can implement with confidence.")
```

## Tips for Better Results

1. **Be specific**: "Stripe webhook verification Deno Deploy" > "How to use Stripe"
2. **Include context**: Mention your tech stack (Deno, Supabase, etc.)
3. **Ask for examples**: "Include code examples" gets you actual code
4. **Set recency**: Use `search_recency_filter='week'` for fast-moving topics
5. **Use right model**: 
   - `sonar`: Quick lookups
   - `sonar-pro`: Most research (default)
   - `sonar-reasoning-pro`: Complex comparisons

## Next Steps

1. Try a quick research now:
```bash
cd /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care
python3 -c "from src.skills.perplexity_research import perplexityResearch; print(perplexityResearch('Supabase Row Level Security quickstart')['answer'])"
```

2. Use it before your next feature implementation

3. Track your usage and costs

That's it! Keep it simple. Research when you need it, build when you're ready.
