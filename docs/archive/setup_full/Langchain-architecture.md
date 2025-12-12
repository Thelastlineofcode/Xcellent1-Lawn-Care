LangChain AI Agent Architecture Core Agent Setup

Flask + LangChain Integration - Your existing Deno backend will integrate with
Python microservices for AI functionality. Deploy LangChain agents as separate
Flask APIs that your main Deno app calls via REST endpoints.​

Perplexity Integration - LangChain has native Perplexity support, making it
perfect for your use case:​

python from langchain_community.chat_models import ChatPerplexity from
langchain.agents import AgentExecutor, create_react_agent from langchain.tools
import Tool import os

# Set up Perplexity

os.environ["PPLX_API_KEY"] = "your_perplexity_key"

llm = ChatPerplexity( model="sonar-pro", temperature=0.7, max_tokens=1000 )
Multi-Agent System Design

Customer Service Agent - Handles inquiries, quotes, and booking:​

Retrieves customer history from Supabase

Generates instant quotes based on property size and services

Schedules appointments by checking crew availability

Sends confirmation emails via Zoho

Operations Agent - Manages daily business workflows:​

Optimizes crew routes based on weather and traffic

Monitors job completion status

Triggers invoice generation after photo uploads

Sends payment reminders for overdue accounts

Marketing Agent - Automates content and outreach:​

Generates LaPlace-specific blog posts about lawn care

Creates social media posts from completed job photos

Responds to Google Business reviews

Manages email campaigns for seasonal services

Hiring Agent - Streamlines recruitment process:

Screens applications against job requirements

Schedules interviews based on your calendar

Sends onboarding materials to new hires

Tracks training progress and certifications

LangChain Tools & Integrations

Custom Tools for Your Business:​

python from langchain.tools import Tool

# Supabase Database Tool

def query_customer_data(customer_id): # Query Supabase for customer info return
customer_history

# Crew Availability Tool

def check_crew_schedule(date): # Check crew calendar availability return
available_slots

# Quote Calculator Tool

def calculate_quote(property_size, services): # Generate pricing based on
parameters return quote_amount

# Email Sender Tool (Zoho)

def send_customer_email(to, subject, body): # Send via Zoho API return status

tools = [ Tool(name="CustomerLookup", func=query_customer_data),
Tool(name="ScheduleCheck", func=check_crew_schedule),
Tool(name="QuoteGenerator", func=calculate_quote), Tool(name="EmailSender",
func=send_customer_email) ] Implementation Architecture

Microservices Structure:​

text xcellent1-lawn-care/ ├── deno-app/ # Main Deno/React application │ ├──
server.ts # Your existing Deno server │ ├── web/ # React frontend │ └──
supabase/ # Database configs │ ├── langchain-agents/ # New Python microservice │
├── app.py # Flask API server │ ├── agents/ │ │ ├── customer_agent.py │ │ ├──
operations_agent.py │ │ ├── marketing_agent.py │ │ └── hiring_agent.py │ ├──
tools/ │ │ ├── supabase_tool.py │ │ ├── zoho_tool.py │ │ ├── calendar_tool.py │
│ └── quote_tool.py │ ├── memory/ │ │ └── conversation_memory.py │ └──
requirements.txt │ └── fly.toml # Deploy both services Flask API Endpoints:​

python from flask import Flask, request, jsonify from flask_cors import CORS
from agents.customer_agent import customer_service_agent from
agents.operations_agent import operations_agent

app = Flask(**name**) CORS(app)

# Customer inquiry endpoint

@app.route('/api/agent/inquiry', methods=['POST']) def handle_inquiry(): data =
request.json user_message = data.get('message') customer_id =
data.get('customer_id')

    response = customer_service_agent.invoke({
        "input": user_message,
        "customer_id": customer_id
    })

    return jsonify({"response": response})

# Auto-schedule jobs

@app.route('/api/agent/schedule', methods=['POST']) def auto_schedule(): data =
request.json date = data.get('date')

    schedule = operations_agent.invoke({
        "task": "optimize_schedule",
        "date": date
    })

    return jsonify({"schedule": schedule})

Memory & Conversation Management

Session-Based Memory:​

python from langchain.memory import ConversationBufferMemory from
langchain.chains import ConversationChain

# Store conversations per customer

customer_memories = {}

def get_agent_with_memory(customer_id): if customer_id not in customer_memories:
customer_memories[customer_id] = ConversationBufferMemory( return_messages=True,
memory_key="chat_history" )

    return ConversationChain(
        llm=llm,
        memory=customer_memories[customer_id],
        verbose=True
    )

RAG for Business Knowledge

Retrieval-Augmented Generation - Index your business documents for context-aware
responses:​

python from langchain.vectorstores import SupabaseVectorStore from
langchain.embeddings import OpenAIEmbeddings from langchain.chains import
RetrievalQA

# Store service guides, FAQs, policies

vector_store = SupabaseVectorStore( client=supabase_client,
embedding=OpenAIEmbeddings(), table_name="business_knowledge" )

# Create RAG chain

qa_chain = RetrievalQA.from_chain_type( llm=llm,
retriever=vector_store.as_retriever(), return_source_documents=True ) Autonomous
Agent Workflows

ReAct Loop for Complex Tasks:​

python from langchain.agents import create_react_agent from langchain.prompts
import PromptTemplate

# Define agent prompt

prompt = PromptTemplate( template="""You are Xcellent1 Lawn Care's AI assistant.

    Use these tools to help customers:
    {tools}

    Current conversation:
    {chat_history}

    Customer: {input}
    {agent_scratchpad}""",
    input_variables=["tools", "chat_history", "input", "agent_scratchpad"]

)

# Create ReAct agent

agent = create_react_agent(llm, tools, prompt) agent_executor = AgentExecutor(
agent=agent, tools=tools, verbose=True, max_iterations=5 ) Real-World Use Cases

1. Automated Quote Generation:​

Customer submits property address via website

Agent queries property size from public records

Calculates quote using your pricing rules

Sends detailed estimate via email

Follows up in 2 days if no response

2. Smart Job Scheduling:

Agent checks weather forecast for LaPlace

Optimizes crew routes to minimize drive time

Sends morning briefing with job list

Reschedules automatically if rain predicted

Updates customers proactively

3. Invoice Automation:

Crew uploads completion photos

Agent generates itemized invoice

Emails invoice with photos to customer

Sends payment reminder after 7 days

Updates accounting records in Supabase

4. Application Screening:

Candidate applies via careers page

Agent extracts key qualifications

Scores against job requirements

Schedules top candidates for interview

Sends rejection emails to others

Deployment Strategy

Dual-Service Fly.io Setup:​

text

# fly.toml for LangChain service

app = "xcellent1-langchain-agents"

[build] dockerfile = "Dockerfile.agents"

[env] FLASK_ENV = "production" PPLX_API_KEY = "your_key" SUPABASE_URL =
"your_url"

[[services]] internal_port = 5000 protocol = "tcp"

[[services.ports]] port = 80 handlers = ["http"] Environment Variables:

bash PPLX_API_KEY=your_perplexity_api_key SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key ZOHO_API_KEY=your_zoho_key
LANGSMITH_API_KEY=your_langsmith_key # For monitoring Monitoring & Observability

LangSmith Integration - Track agent performance, token usage, and conversation
quality in real-time. Debug issues by replaying exact agent interactions.​

Cost Optimization

Perplexity Sonar Models:​

sonar - $0.20/1M tokens (standard queries)

sonar-pro - $1.00/1M tokens (complex reasoning)

Start with $5 credit for testing

Agent Efficiency Tips:

Cache frequent queries (service prices, availability)

Use streaming for real-time responses

Implement rate limiting to prevent abuse

Set max_tokens limits per agent type

Integration with Your Workflow

Connect to Existing Deno App:

typescript // In your Deno server.ts async function getAIResponse(message:
string, customerId: string) { const response = await
fetch('https://xcellent1-langchain-agents.fly.dev/api/agent/inquiry', { method:
'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
message, customer_id: customerId }) });

return await response.json(); Step 5: Create config.py

python

# config.py

import os from dotenv import load_dotenv

load_dotenv()

class Config: FLASK_ENV = os.getenv('FLASK_ENV', 'production') DEBUG = FLASK_ENV
== 'development'

    # Perplexity - Using regular Sonar
    PPLX_API_KEY = os.getenv('PPLX_API_KEY')
    PPLX_MODEL = 'sonar'  # $0.20 per 1M tokens

    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')

    # Zoho
    ZOHO_API_KEY = os.getenv('ZOHO_API_KEY')
    ZOHO_FROM_EMAIL = 'info@xcellent1lawncare.com'

    # Business Pricing
    BASE_PRICE_PER_SQFT = 0.02
    MINIMUM_JOB_PRICE = 35.00

    SERVICE_PRICES = {
        'mowing': 35.00,
        'edging': 15.00,
        'fertilization': 45.00,
        'weed_control': 40.00,
        'aeration': 60.00,
        'cleanup': 50.00
    }

    SERVICE_AREAS = ['LaPlace', 'Norco', 'Hahnville', 'Destrehan']

Step 6: Create Agent Files

Create folder structure:

bash mkdir agents tools touch agents/**init**.py tools/**init**.py
agents/customer_agent.py:

python from langchain_community.chat_models import ChatPerplexity from
langchain.agents import AgentExecutor, create_react_agent from langchain.prompts
import PromptTemplate from langchain.tools import Tool from config import Config
import os

def get_quote_tool(): def calculate_quote(input_str): # Parse input like "5000
sqft, mowing, edging" parts = input_str.lower().split(',') sqft = 5000 # default
services = []

        for part in parts:
            part = part.strip()
            if 'sqft' in part or 'sq ft' in part:
                try:
                    sqft = int(''.join(filter(str.isdigit, part)))
                except:
                    pass
            else:
                services.append(part)

        # Calculate price
        total = Config.BASE_PRICE_PER_SQFT * sqft

        for service in services:
            for key, price in Config.SERVICE_PRICES.items():
                if key in service:
                    total += price

        total = max(total, Config.MINIMUM_JOB_PRICE)

        return f"Quote: ${total:.2f} for {sqft} sq ft with services: {', '.join(services)}"

    return Tool(
        name="QuoteCalculator",
        func=calculate_quote,
        description="Calculate lawn care quotes. Input format: '5000 sqft, mowing, edging'"
    )

def get_customer_agent(): # Initialize Perplexity with Sonar model llm =
ChatPerplexity( api_key=Config.PPLX_API_KEY, model='sonar', # Regular Sonar -
$0.20/1M tokens temperature=0.7, max_tokens=500 )

    tools = [get_quote_tool()]

    prompt = PromptTemplate(
        template="""You are Xcellent1 Lawn Care's customer service AI assistant.

Service areas: LaPlace, Norco, Hahnville, Destrehan (Louisiana) Services: Weekly
mowing, edging, fertilization, weed control, aeration, seasonal cleanup

Available tools: {tools}

Customer inquiry: {input}

Provide helpful, professional responses. Use the QuoteCalculator tool when
customers ask about pricing.

{agent_scratchpad}""", input_variables=["tools", "input", "agent_scratchpad"] )

    agent = create_react_agent(llm, tools, prompt)

    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        max_iterations=3,
        handle_parsing_errors=True
    )

agents/operations_agent.py:

python from langchain_community.chat_models import ChatPerplexity from
langchain.agents import AgentExecutor, create_react_agent from langchain.prompts
import PromptTemplate from config import Config

def get_operations_agent(): llm = ChatPerplexity( api_key=Config.PPLX_API_KEY,
model='sonar', temperature=0.5, max_tokens=500 )

    prompt = PromptTemplate(
        template="""You are Xcellent1 Lawn Care's operations manager AI.

Your role: Optimize crew schedules, route planning, and job assignments for
LaPlace, LA area.

Task: {input}

Provide actionable scheduling recommendations considering:

- Drive time between jobs
- Weather conditions in LaPlace
- Crew availability
- Job priority

{agent_scratchpad}""", input_variables=["input", "agent_scratchpad"] )

    agent = create_react_agent(llm, [], prompt)

    return AgentExecutor(
        agent=agent,
        tools=[],
        verbose=True,
        max_iterations=2,
        handle_parsing_errors=True
    )

agents/hiring_agent.py:

python from langchain_community.chat_models import ChatPerplexity from
langchain.agents import AgentExecutor, create_react_agent from langchain.prompts
import PromptTemplate from config import Config

def get_hiring_agent(): llm = ChatPerplexity( api_key=Config.PPLX_API_KEY,
model='sonar', temperature=0.3, max_tokens=400 )

    prompt = PromptTemplate(
        template="""You are Xcellent1 Lawn Care's hiring manager AI.

Job requirements:

- Reliable transportation
- Ability to work outdoors in Louisiana heat/humidity
- Experience preferred but will train
- Starting pay: $17/hour

Application to screen: {input}

Provide a screening assessment with:

1. Strengths
2. Concerns
3. Recommendation (Interview/Reject)

{agent_scratchpad}""", input_variables=["input", "agent_scratchpad"] )

    agent = create_react_agent(llm, [], prompt)

    return AgentExecutor(
        agent=agent,
        tools=[],
        verbose=True,
        max_iterations=2,
        handle_parsing_errors=True
    )

Step 7: Create Main Flask App (app.py)

python from flask import Flask, request, jsonify from flask_cors import CORS
from dotenv import load_dotenv import os from agents.customer_agent import
get_customer_agent from agents.operations_agent import get_operations_agent from
agents.hiring_agent import get_hiring_agent

load_dotenv() app = Flask(**name**)

CORS(app, origins=[ "https://xcellent1lawncare.com", "http://localhost:8000" ])

@app.route('/health', methods=['GET']) def health_check(): return jsonify({
"status": "healthy", "service": "xcellent1-langchain-agents", "model":
"perplexity-sonar" })

@app.route('/api/agent/inquiry', methods=['POST']) def
handle_customer_inquiry(): try: data = request.json message =
data.get('message')

        if not message:
            return jsonify({"error": "Message required"}), 400

        agent = get_customer_agent()
        response = agent.invoke({"input": message})

        return jsonify({
            "response": response.get("output", ""),
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/agent/schedule', methods=['POST']) def auto_schedule(): try:
data = request.json date = data.get('date')

        agent = get_operations_agent()
        response = agent.invoke({
            "input": f"Optimize crew schedule for {date}"
        })

        return jsonify({"schedule": response.get("output", "")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/agent/screen-application', methods=['POST']) def
screen_application(): try: data = request.json application =
data.get('application')

        agent = get_hiring_agent()
        response = agent.invoke({
            "input": f"Screen: {application}"
        })

        return jsonify({"result": response.get("output", "")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if **name** == '**main**': port = int(os.environ.get('PORT', 5000))
app.run(host='0.0.0.0', port=port, debug=True) Step 8: Create Deployment Files

Procfile:

text web: gunicorn app:app fly.toml:

text app = "xcellent1-langchain-agents" primary_region = "iad"

[build] builder = "paketobuildpacks/builder:base"

[env] PORT = "8080"

[[services]] internal_port = 8080 protocol = "tcp"

[[services.ports]] handlers = ["http"] port = 80

[[services.ports]] handlers = ["tls", "http"] port = 443 .gitignore:

text venv/ \*.pyc **pycache**/ .env .DS_Store Step 9: Test Locally

bash flask run Visit http://127.0.0.1:5000/health - should see:

json {"status": "healthy", "service": "xcellent1-langchain-agents", "model":
"perplexity-sonar"} Test customer agent:

bash curl -X POST http://127.0.0.1:5000/api/agent/inquiry\
-H "Content-Type: application/json"\
-d '{"message": "How much for 5000 sq ft lawn with mowing and edging?"}' Step
10: Deploy to Fly.io

bash fly launch

# Choose name: xcellent1-langchain-agents

# Choose region: iad (close to Houston)

fly secrets set PPLX_API_KEY=your_actual_key fly secrets set
SUPABASE_URL=your_supabase_url fly secrets set SUPABASE_KEY=your_supabase_key
fly secrets set ZOHO_API_KEY=your_zoho_key

fly deploy

fly status Step 11: Connect to Your Deno App

Update your server.ts:

typescript const AGENT_URL = "https://xcellent1-langchain-agents.fly.dev";

app.post("/api/contact", async (c) => { const { message, email } = await
c.req.json();

const response = await fetch(`${AGENT_URL}/api/agent/inquiry`, { method: "POST",
headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message,
customer_id: email }) });

const data = await response.json(); return c.json(data); }); Cost Analysis
(Sonar Model) Price: $0.20 per 1M tokens

Average customer inquiry: ~500 tokens = $0.0001 (1/100th of a penny)

1,000 inquiries: $0.10

10,000 inquiries: $1.00

Your $5 credit: ~25M tokens = months of testing!

Monitoring View live logs:

bash fly logs -a xcellent1-langchain-agents
