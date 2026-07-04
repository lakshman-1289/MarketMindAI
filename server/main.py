import asyncio
import os
import sys
import uuid
from datetime import datetime
import io
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Import local modules
from models import MarketReport, AnalysisRequest
import db
from agents import run_brand_buster
from pdf_generator import generate_report_pdf

app = FastAPI(title="Brand Buster API")

# Enable CORS
# Enable CORS with explicit origins or fallback to allow all
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Error Handlers
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_msg = str(exc)
    sys.stderr.write(f"\n[ERROR] Unhandled Exception: {err_msg}\n")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error": err_msg[:200]},
    )

# In-memory status tracking
analysis_status = {}

@app.on_event("startup")
async def startup_db_client():
    connected = await db.get_database()
    if connected is not None:
        sys.stdout.write("\n==================================================\n")
        sys.stdout.write("✅ DATABASE STATUS: Connected to MongoDB!\n")
        sys.stdout.write("==================================================\n")
    else:
        sys.stdout.write("\n❌ DATABASE ERROR: Could not connect to MongoDB.\n")

async def run_analysis_task(product_category: str, report_id: str):
    """Background task to run CrewAI analysis"""
    analysis_status[report_id] = "processing"
    
    try:
        sys.stdout.write(f"\n[SERVER] 🚀 STARTING RESEARCH FOR: {product_category}\n")
        
        # Run the crew - Added a small delay to ensure API keys are ready
        await asyncio.sleep(1)
        
        # Using to_thread for the CPU-intensive agent run
        result = await asyncio.to_thread(run_brand_buster, product_category)
        
        if result:
            # Set the ID tracking
            result.report_id = report_id
            
            # Save to MongoDB
            await db.save_report(result.dict())
            analysis_status[report_id] = "completed"
            sys.stdout.write(f"✅ [SERVER] SUCCESS: Report saved for {product_category}\n")
        else:
            analysis_status[report_id] = "failed"

    except Exception as e:
        error_msg = str(e)
        sys.stderr.write(f"\n❌ [SERVER] CRITICAL ERROR: {error_msg}\n")
        analysis_status[report_id] = "failed"

@app.get("/")
async def root():
    return {"message": "Brand Buster API is running"}

@app.post("/analyze")
async def analyze_brand(request: AnalysisRequest, background_tasks: BackgroundTasks):
    report_id = str(uuid.uuid4())
    sys.stdout.write(f"📥 [API] Received Request for: {request.product_category}\n")
    background_tasks.add_task(run_analysis_task, request.product_category, report_id)
    return {"status": "started", "report_id": report_id}

@app.get("/reports")
async def get_reports():
    reports = await db.get_all_reports()
    return reports

@app.get("/reports/{report_id}")
async def get_report(report_id: str):
    report = await db.get_report_by_id(report_id)
    if report:
        return report
    raise HTTPException(status_code=404, detail="Report not found")

@app.get("/reports/{report_id}/download")
async def download_report_pdf(report_id: str):
    report = await db.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    try:
        # Generate PDF bytes
        pdf_bytes = generate_report_pdf(report)
        
        # Create a nice filename
        category = report.get("product_category", "report").replace(" ", "_")
        filename = f"BrandBuster_{category}_{report_id[:8]}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        sys.stderr.write(f"PDF Generation Error: {e}\n")
        raise HTTPException(status_code=500, detail="Could not generate PDF")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
