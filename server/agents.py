"""
MarketMindAI - Multi-Agent Competitive Intelligence Platform
Uses CrewAI with 3 specialized agents for market research.

Powered by Google Gemini with automatic rate limit handling.
"""

import os
import sys
import time
import json

# Fix for Groq / non-Anthropic models: prevent CrewAI from injecting unsupported 'cache_breakpoint' property into messages
try:
    import crewai.llms.cache as _crewai_cache
    _crewai_cache.mark_cache_breakpoint = lambda msg: msg
except Exception:
    pass

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')
from crewai import Agent, Task, Crew, Process, LLM
from crewai_tools import TavilySearchTool
from dotenv import load_dotenv
from models import MarketReport, PricePoint, SentimentData

load_dotenv()

# Set dummy key for CrewAI check
os.environ["OPENAI_API_KEY"] = "NA"

# --- API Keys ---
# Helper to extract key, ignoring placeholders
def get_clean_key(env_name: str) -> str:
    val = os.getenv(env_name, "")
    if not val or val.strip().startswith("your_"):
        return ""
    return val.strip()

GEMINI_API_KEY = get_clean_key("GEMINI_API_KEY") or get_clean_key("GOOGLE_API_KEY")
GROQ_API_KEY = get_clean_key("GROQ_API_KEY")
TAVILY_API_KEY = get_clean_key("TAVILY_API_KEY")

# Set clean keys in environ for downstream services/tools
if GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
    os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
if GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY
if TAVILY_API_KEY:
    os.environ["TAVILY_API_KEY"] = TAVILY_API_KEY

print(f"\n[INIT] GEMINI_API_KEY: {'✅ Loaded' if GEMINI_API_KEY else '❌ MISSING!'}")
print(f"[INIT] GROQ_API_KEY: {'✅ Loaded (backup)' if GROQ_API_KEY else '❌ MISSING!'}")
print(f"[INIT] TAVILY_API_KEY: {'✅ Loaded' if TAVILY_API_KEY else '❌ MISSING!'}")

# --- LLM Configuration ---
# Try Gemini 1.5 Flash (more generous free tier than 2.0)
# Falls back to Groq if Gemini quota is exhausted

def create_llm():
    # Try Gemini first as it is natively supported by CrewAI
    try:
        if GEMINI_API_KEY:
            llm = LLM(
                model="gemini/gemini-1.5-flash",
                api_key=GEMINI_API_KEY,
                temperature=0.1,
            )
            print("[LLM] Using Gemini 1.5 Flash (Primary)")
            return llm
    except Exception as e:
        print(f"[LLM] Gemini initialization failed: {e}")

    # Fallback to Groq if Gemini fails or isn't configured
    try:
        if GROQ_API_KEY:
            llm = LLM(
                model="groq/llama-3.1-8b-instant",
                api_key=GROQ_API_KEY,
                temperature=0.1,
                max_tokens=400,
                timeout=60,
            )
            print("[LLM] Using Groq Llama 3.1 8b (Fallback)")
            return llm
    except Exception as e:
        print(f"[LLM] Groq initialization failed: {e}")
        raise e


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

def task_cooldown_callback(task_output):
    """Wait for 60 seconds to reset token rate limits on Groq free tier"""
    global GEMINI_API_KEY
    if not GEMINI_API_KEY and GROQ_API_KEY:
        print("\n[COOLDOWN] Groq active: Waiting 60 seconds to reset API rate limits...")
        time.sleep(60)

price_task = Task(
    description='''Search for 3 real {product_category} products and their prices.
    Return a list with: brand_name, price (as number), source_url for each product.''',
    expected_output='A list of 3 products with prices and URLs.',
    agent=price_watcher,
    callback=task_cooldown_callback
)

sentiment_task = Task(
    description='''Search for common user complaints about {product_category}.
    Return 5 pain points with: theme, description, impact_level (High/Medium/Low).''',
    expected_output='5 user pain points with impact assessments.',
    agent=sentiment_critic,
    callback=task_cooldown_callback
)

strategy_task = Task(
    description='''Using the pricing and sentiment data from previous tasks, compile a comprehensive MarketReport for {product_category}.''',
    expected_output='A structured MarketReport Pydantic object containing the finalized competitive analysis and winning strategy.',
    agent=strategy_consultant,
    output_pydantic=MarketReport,
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
            print(f"\n[ERROR] Attempt {attempt + 1} failed: {str(e)[:120]}...")
            
            # If Gemini fails (e.g. invalid key 404, or rate limits), fallback to Groq dynamically!
            global GEMINI_API_KEY
            if GEMINI_API_KEY and GROQ_API_KEY:
                print("\n[FALLBACK] Gemini failed. Dynamically switching agents to Groq fallback LLM...")
                try:
                    fallback_llm = LLM(
                        model="groq/llama-3.1-8b-instant",
                        api_key=GROQ_API_KEY,
                        temperature=0.1,
                        max_tokens=400,
                        timeout=60,
                    )
                    # Hot-swap LLMs for all agents
                    price_watcher.llm = fallback_llm
                    sentiment_critic.llm = fallback_llm
                    strategy_consultant.llm = fallback_llm
                    
                    # Update global key tracking so that task cooldowns are activated
                    GEMINI_API_KEY = ""
                    
                    # Re-create crew with updated agents
                    crew = Crew(
                        agents=[price_watcher, sentiment_critic, strategy_consultant],
                        tasks=[price_task, sentiment_task, strategy_task],
                        process=Process.sequential,
                        verbose=True,
                        max_rpm=2
                    )
                    
                    print("[FALLBACK] Fallback successful. Retrying execution with Groq LLM...")
                    continue
                except Exception as fallback_err:
                    print(f"[FALLBACK] Failed to switch to Groq fallback: {fallback_err}")
            
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
