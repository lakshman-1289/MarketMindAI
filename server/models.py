from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PricePoint(BaseModel):
    brand_name: str
    price: float
    source_url: str

class SentimentData(BaseModel):
    theme: str
    description: str
    impact_level: str # Low, Medium, High

class MarketReport(BaseModel):
    report_id: Optional[str] = None
    product_category: str
    status: str = "completed"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    price_analysis: List[PricePoint]
    sentiment_analysis: List[SentimentData]
    winning_strategy: str
    competitors: List[str]

class AnalysisRequest(BaseModel):
    product_category: str
