# LangChain Agents (langchain-agents)

This folder contains a minimal Flask-based scaffold for LangChain AI agents
(customer service, operations).

Quick start (local):

1. Create and activate a Python virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the Flask app:

```bash
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000
```

4. Health check:

```bash
curl http://localhost:5000/
```

Deployment (Fly.io):

1. Build and deploy using the provided `Dockerfile.agents` and `fly.toml`.

```bash
flyctl launch --name xcellent1-langchain-agents --region dfw
flyctl deploy
```

Notes:

- The current implementation uses lightweight stubs for agents and tools.
  Replace with LangChain logic, Perplexity integration, and Supabase tools when
  ready.
- Keep API keys in Fly secrets or environment variables; do not commit them to
  the repo.
