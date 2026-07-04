# Brand Buster 🚀
> **Agentic Competitive Intelligence Platform**

Brand Buster is a next-generation market research tool powered by a **Multi-Agent System** (CrewAI). It autonomously scans the web, analyzes competitor pricing, extracts customer sentiment, and formulates winning business strategies in real-time.



---

## 🤖 The AI Crew
The core of Brand Buster involves three specialized AI agents working in sequence:

1.  **🕵️ Price Watcher**: Scans major retailers (Amazon, Walmart, etc.) to find real-time product pricing and reliable URLs using the Tavily Search API.
2.  **🧠 Sentiment Critic**: Digs into forums and reviews to identify clustered "pain points" (e.g., "short battery life," "expensive shipping") and rates their impact level.
3.  **👔 Strategy Consultant**: Synthesizes the raw data from the first two agents into a professional, actionable market strategy, formatted as a JSON report.

---

## ✨ Key Features
-   **Full-Stack Architecture**: Python FastAPI backend + React Vite frontend.
-   **Robust AI Pipeline**:  
    -   Primary: **Google Gemini 1.5 Flash** (250k TPM).
    -   Fallback: **Groq (Llama 3.1 8b)** for fault tolerance when rate limits are hit.
-   **Real-Time Visualization**:
    -   Interactive **Bar Charts** for pricing benchmarks.
    -   **Radar Charts** for sentiment/pain-point analysis.
-   **Premium UI**: Dark mode aesthetic with glassmorphism and `framer-motion` animations.
-   **Exportable Reports**: One-click professional PDF downloads.
-   **History Tracking**: MongoDB integration to save and retrieve past analyses.

---

## 🛠️ Technology Stack

### Backend
-   **Framework**: FastAPI
-   **Orchestration**: CrewAI
-   **Database**: MongoDB (Motor async driver)
-   **PDF Generation**: FPDF2
-   **Search Tool**: Tavily API

### Frontend
-   **Framework**: React (Vite)
-   **Styling**: Tailwind CSS
-   **Animations**: Framer Motion
-   **Charts**: Recharts
-   **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites
-   Python 3.10+
-   Node.js 18+
-   MongoDB (Running locally or Atlas URI)
-   API Keys: `GOOGLE_API_KEY`, `TAVILY_API_KEY`, `GROQ_API_KEY` (optional backup)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/brand-buster.git
    cd brand-buster
    ```

2.  **Backend Setup**
    ```bash
    cd server
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # Mac/Linux
    # source venv/bin/activate
    
    pip install -r requirements.txt
    ```

3.  **Frontend Setup**
    ```bash
    cd ../client
    npm install
    ```

4.  **Environment Variables**
    Create a `.env` file in `/server`:
    ```env
    GOOGLE_API_KEY=your_key
    TAVILY_API_KEY=your_key
    GROQ_API_KEY=your_key
    MONGODB_URI=mongodb://localhost:27017
    DB_NAME=brand_buster
    ALLOWED_ORIGINS=http://localhost:5173
    ```

### Running the App

**1. Start the Backend**
```bash
# In /server terminal
python main.py
```
*Server runs on `http://127.0.0.1:8001`*

**2. Start the Frontend**
```bash
# In /client terminal
npm run dev
```
*Client runs on `http://localhost:5173`*

---


