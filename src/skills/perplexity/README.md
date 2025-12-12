# Perplexity Research Skill (ARCHIVED - Future Implementation)

> Status: Paused — Research skill for AI agents is archived and not used in
> production. This folder contains helper code and prototypes that are planned
> for future agent integration (e.g., LangChain). For now, AI components are on
> hold; re-enable when AI features are accepted and supported in production.

## Overview

Token-efficient research skill for AI agents using Perplexity API. Provides
real-time web research capabilities without bloating agent prompts.

## Why This Skill?

Based on the Claude extended context article, skills should:

- ✅ Be **compact and focused** (saves tokens)
- ✅ Have **clear input/output contracts**
- ✅ Be **reusable across agents**
- ✅ **Reduce repetitive prompt instructions**

## Installation

```bash
# Python environment
cd /path/to/Xcellent1-Lawn-Care
source venv/bin/activate
pip install -r src/skills/perplexity/requirements.txt
```

## Configuration

Add to your `.env`:

```bash
PERPLEXITY_API_KEY=pplx-your-key-here
ENABLE_AI_PROTOTYPES=true  # must be set to enable the archived prototype modules
```

## Usage

### 1. Quick Research (Python)

```python
from src.skills.perplexity.skill import research

# Simple query
result = research("Best practices for Stripe webhooks in Next.js")
print(result['answer'])
print(result['citations'])
```

### 2. Agent Integration (LangChain)

```python
from langchain.tools import Tool
from src.skills.perplexity.skill import research

# Create tool for your agent
research_tool = Tool(
    name="web_research",
    description="Search the web for current information and best practices",
    func=lambda query: research(query)['answer']
)

# Use in agent
from langchain.agents import initialize_agent
agent = initialize_agent(
    tools=[research_tool, ...],
    llm=your_llm,
    verbose=True
)
```

### 3. TypeScript/Deno Integration

```typescript
import { PerplexityResearch } from "./skill.ts";

const research = new PerplexityResearch(Deno.env.get("PERPLEXITY_API_KEY"));

const result = await research.query(
  "Latest lawn care industry trends 2025",
);
console.log(result.answer);
```

## API Reference

### `research(query, options)`

**Parameters:**

- `query` (string): Research question
- `options` (object, optional):
  - `model`: 'sonar-pro' | 'sonar' | 'sonar-reasoning-pro' (default:
    'sonar-pro')
  - `max_tokens`: 1000-4000 (default: 2000)
  - `recency`: 'day' | 'week' | 'month' | 'year' (default: 'month')
  - `temperature`: 0.0-1.0 (default: 0.2)

**Returns:**

```python
{
    'answer': str,  # Research findings
    'citations': [{'url': str, 'title': str}],  # Sources
    'model': str,  # Model used
    'tokens_used': int,  # Token count
    'execution_time': float,  # Seconds
    'success': bool
}
```

## Example Use Cases

### For Intake Agent

```python
# Research customer question
result = research(
    "How to handle grass clippings after mowing residential lawns",
    recency='month'
)
# Agent can now answer with current best practices
```

### For Quote Agent

```python
# Competitive pricing research
result = research(
    "Average lawn mowing prices LaPlace Louisiana 2025",
    recency='week'
)
# Use findings to validate pricing
```

### For Marketing Agent

```python
# Content research
result = research(
    "Best SEO keywords for local lawn care business",
    model='sonar-reasoning-pro',  # More thoughtful analysis
    max_tokens=3000
)
# Generate blog post from research
```

## Token Efficiency

**Before (embedded in prompt):**

```
Agent Prompt: 1500 tokens
+ Research instructions: 500 tokens
+ Example responses: 300 tokens
= 2300 tokens per call
```

**After (using skill):**

```
Agent Prompt: 800 tokens
+ Skill call: research("query")
= 800 tokens + skill execution
```

**Savings**: ~65% fewer tokens in agent prompts!

## Cost Tracking

```python
from src.skills.perplexity.skill import ResearchTracker

tracker = ResearchTracker()

# After each research call
result = research("query")
tracker.track(result)

# View costs
print(tracker.get_monthly_cost())
# Output: {'total_calls': 45, 'estimated_cost': $2.15}
```

## Integration with BMad Agents

### Step 1: Add to Agent Manifest

```yaml
# bmad/agents/intake/agent.yaml
tools:
  - name: web_research
    type: perplexity_skill
    path: src/skills/perplexity/skill.py
```

### Step 2: Use in Handler

```python
# bmad/agents/intake/handler.ts (via Python bridge)
from src.skills.perplexity.skill import research

async def handle_customer_question(question: str):
    # Quick research if needed
    if requires_research(question):
        context = research(question, recency='week')
        return generate_response(question, context)
    else:
        return generate_response(question)
```

## Testing

```bash
# Run skill tests
python src/skills/perplexity/test_skill.py

# Test specific scenario
python src/skills/perplexity/test_skill.py --scenario "pricing_research"
```

## Monitoring

View skill usage in agent audit logs:

```sql
SELECT 
    agent_name,
    COUNT(*) as research_calls,
    AVG((tool_calls->0->>'execution_time')::float) as avg_time
FROM agent_audit
WHERE tool_calls @> '[{"tool": "web_research"}]'
GROUP BY agent_name;
```

## Best Practices

1. **Cache common queries**: Store frequently asked research in database
2. **Set appropriate recency**: Don't use 'day' for stable information
3. **Choose right model**:
   - `sonar`: Fast, simple queries
   - `sonar-pro`: Most use cases (recommended)
   - `sonar-reasoning-pro`: Complex analysis/comparisons
4. **Monitor costs**: Track token usage per agent
5. **Fallback gracefully**: Handle API errors without breaking agent

## Troubleshooting

**Issue**: "API key not found"

```bash
# Check .env file
cat .env | grep PERPLEXITY_API_KEY

# Re-export if needed
export PERPLEXITY_API_KEY=pplx-your-key
```

**Issue**: Slow responses

- Use `sonar` instead of `sonar-pro` for speed
- Reduce `max_tokens` to 1500
- Check API rate limits

**Issue**: Poor quality answers

- Increase `temperature` to 0.3-0.5
- Use `sonar-reasoning-pro` for complex queries
- Make queries more specific

## Files in This Skill

```
src/skills/perplexity/
├── README.md           # This file
├── skill.py            # Main Python implementation  
├── skill.ts            # TypeScript/Deno version
├── requirements.txt    # Python dependencies
├── test_skill.py       # Unit tests
└── examples/           # Usage examples
    ├── agent_integration.py
    ├── bmad_workflow.py
    └── cost_tracking.py
```

## Next Steps

1. ✅ Read this README
2. ⬜ Install dependencies: `pip install -r requirements.txt`
3. ⬜ Test the skill: `python test_skill.py`
4. ⬜ Integrate with your first agent
5. ⬜ Monitor usage and costs

## Support

- 📧 Questions? Check `bmad/agents/README.md`
- 🐛 Issues? Create ticket in project tracker
- 💡 Ideas? Submit to improvements backlog
