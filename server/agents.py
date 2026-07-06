"""
MarketMindAI - Multi-Agent Competitive Intelligence Platform
Uses CrewAI with 3 specialized agents for market research.

Powered by Google Gemini with automatic rate limit handling.
"""

import os
import sys
import time
import json
from crewai import Agent, Task, Crew, Process, LLM
from crewai_tools import TavilySearchTool
from dotenv import load_dotenv
from models import MarketReport, PricePoint, SentimentData

load_dotenv()

# Set dummy key for CrewAI check
os.environ["OPENAI_API_KEY"] = "NA"

# --- API Keys ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Backup
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

print(f"\n[INIT] GEMINI_API_KEY: {'✅ Loaded' if GOOGLE_API_KEY else '❌ MISSING!'}")
print(f"[INIT] GROQ_API_KEY: {'✅ Loaded (backup)' if GROQ_API_KEY else '❌ MISSING!'}")
print(f"[INIT] TAVILY_API_KEY: {'✅ Loaded' if TAVILY_API_KEY else '❌ MISSING!'}")

# --- LLM Configuration ---
# Try Gemini 1.5 Flash (more generous free tier than 2.0)
# Falls back to Groq if Gemini quota is exhausted

def create_llm():
    try:
        # Fallback to Groq since Gemini is hitting rate limits (429)
        llm = LLM(
            model="groq/llama-3.1-8b-instant",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.1,
            max_tokens=400, # Reduced for Groq limit
            timeout=60,
        )
        print("[LLM] Using Groq Llama 3.1 8b (Fallback)")
        return llm

    except Exception as e:
        print(f"[LLM] Gemini failed: {e}")
        llm = LLM(
            model="groq/llama-3.1-8b-instant",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.1,
            max_tokens=400,
            timeout=60,
        )
        print("[LLM] Falling back to Groq")
        return llm


llm = create_llm()

# --- Search Tool ---
search_tool = TavilySearchTool()

# ============================================
# AGENT 1: Price Watcher
# Role: Structured Data Extraction & Market Scanning
# ============================================
price_watcher = Agent(
    role='Price Watcher',
    goal='Find exactly 3 real product prices for {product_category}.',
    backstory='''You are a market scanner specialized in pricing data extraction.
    You search major retailers and return ONLY raw data: product name, price, and source URL.
    Be extremely concise. No explanations needed.''',
    tools=[search_tool],
    llm=llm,
    verbose=True,
    max_rpm=2,
    max_iter=2,
    memory=False,
    allow_delegation=False
)

# ============================================
# AGENT 2: Sentiment Critic  
# Role: Thematic Analysis & Customer Experience Mapping
# ============================================
sentiment_critic = Agent(
    role='Sentiment Critic',
    goal='Find 5 real user complaints about {product_category}.',
    backstory='''You analyze customer reviews and forums to identify pain points.
    Focus on recurring themes like durability, value, or quality issues.
    Be extremely concise. Return only: theme, description, impact level.''',
    tools=[search_tool],
    llm=llm,
    verbose=True,
    max_rpm=2,
    max_iter=2,
    memory=False,
    allow_delegation=False
)

# ============================================
# AGENT 3: Strategy Consultant
# Role: Strategic Synthesis & Gap Analysis
# ============================================
strategy_consultant = Agent(
    role='Strategy Consultant',
    goal='Create a JSON market report for {product_category}.',
    backstory='''You are a senior business strategist.
    You take pricing data and sentiment analysis from other agents and synthesize a winning strategy.
    IMPORTANT: Your final output must be ONLY a valid JSON object, no other text.''',
    llm=llm,
    verbose=True,
    max_rpm=2,
    max_iter=2,
    memory=False,
    allow_delegation=False
)

# ============================================
# TASK DEFINITIONS
# ============================================

price_task = Task(
    description='''Search for 3 real {product_category} products and their prices.
    Return a list with: brand_name, price (as number), source_url for each product.''',
    expected_output='A list of 3 products with prices and URLs.',
    agent=price_watcher
)

sentiment_task = Task(
    description='''Search for common user complaints about {product_category}.
    Return 5 pain points with: theme, description, impact_level (High/Medium/Low).''',
    expected_output='5 user pain points with impact assessments.',
    agent=sentiment_critic
)

strategy_task = Task(
    description='''Using the pricing and sentiment data from previous tasks, create a MarketReport.
    
    OUTPUT FORMAT (return ONLY this JSON, no other text):
    {{
      "product_category": "{product_category}",
      "price_analysis": [
        {{"brand_name": "Name", "price": 99.99, "source_url": "https://example.com"}}
      ],
      "sentiment_analysis": [
        {{"theme": "Issue", "description": "Description", "impact_level": "High"}}
      ],
      "winning_strategy": "One sentence strategy under 30 words",
      "competitors": ["Brand1", "Brand2", "Brand3"]
    }}''',
    expected_output='A valid JSON object matching the MarketReport schema.',
    agent=strategy_consultant,
    context=[price_task, sentiment_task]
)

# ============================================
# MAIN EXECUTION FUNCTION
# ============================================

def run_market_mind_ai(product_category: str) -> MarketReport:
    """
    Execute the 3-agent CrewAI pipeline for market analysis.
    Includes automatic retry with delays for rate limits.
    """
    print(f"\n{'='*60}")
    print(f"🚀 CREWAI MULTI-AGENT ANALYSIS: {product_category}")
    print(f"{'='*60}")
    print(f"[INFO] Using 3 agents: Price Watcher, Sentiment Critic, Strategy Consultant")
    
    # Create the Crew
    crew = Crew(
        agents=[price_watcher, sentiment_critic, strategy_consultant],
        tasks=[price_task, sentiment_task, strategy_task],
        process=Process.sequential,
        verbose=True,
        max_rpm=2
    )
    
    max_retries = 3
    retry_delay = 60  # seconds
    
    for attempt in range(max_retries):
        try:
            print(f"\n[CREW] Attempt {attempt + 1}/{max_retries} - Starting execution...")
            
            # Execute the crew
            result = crew.kickoff(inputs={'product_category': product_category})
            
            print(f"\n[CREW] Execution completed!")
            
            # Extract raw output
            if hasattr(result, 'pydantic') and result.pydantic:
                print("[SUCCESS] ✅ CrewAI returned Pydantic model directly!")
                return result.pydantic
            
            if hasattr(result, 'raw'):
                raw_output = result.raw
            else:
                raw_output = str(result)
            
            # Parse JSON from the output
            json_str = raw_output.replace('```json', '').replace('```', '').strip()
            
            # Find JSON object in the output
            start_idx = json_str.find('{')
            end_idx = json_str.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = json_str[start_idx:end_idx]
                data = json.loads(json_str)
                
                print("[SUCCESS] ✅ Parsed real API data from CrewAI!")
                return MarketReport(**data)
            else:
                raise ValueError("No valid JSON found in agent output")
                
        except Exception as e:
            error_str = str(e).lower()
            print(f"\n[ERROR] Attempt {attempt + 1} failed: {str(e)[:100]}...")
            
            # Check for rate limit errors
            if "429" in str(e) or "rate" in error_str or "quota" in error_str or "exhausted" in error_str:
                if attempt < max_retries - 1:
                    print(f"\n[RATE LIMIT] Waiting {retry_delay} seconds before retry...")
                    time.sleep(retry_delay)
                    continue
            
            # If last attempt or non-retryable error, raise
            if attempt == max_retries - 1:
                raise e
    
    raise Exception("All retry attempts exhausted")
