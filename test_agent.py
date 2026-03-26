# QA Scaffold: General Agent Tests
#
# Test agent initialization
# Test valid request handling
# Test invalid request/error handling
#
# Implement with your preferred test runner
from saas_agents import create_dev_agent
import os

# Set your OpenAI API key
os.environ["OPENAI_API_KEY"] = "your-key-here"

# Create agent
agent = create_dev_agent()

# Test it
config = {"configurable": {"thread_id": "test-1"}}
response = agent.invoke(
    {"messages": [{"role": "user", "content": "Help me create a Flask API"}]},
    config=config
)

print(response["messages"][-1].content)
