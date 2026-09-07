"""
FastAPI application exposing the GreenVest AI Land Intelligence and Investment Engine.
"""

from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.models.schemas import (
    LandInput,
    PreferenceWeights,
    AdvisorResult,
    WhatIfRequest,
    WhatIfResult,
    ChatMessageRequest,
    ChatMessageResponse,
)
from src.advisor.advisor import recommend
from src.advisor.simulator import simulate_scenario
from src.chatbot.chatbot import LandChatbot
from src.satellite.monitor import get_satellite_monitoring_data


app = FastAPI(
    title="GreenVest Land Intelligence Engine",
    description="AI-driven decision engine for land, plantation strategies, carbon forecasts, and investment analysis.",
    version="1.0.0",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzePayload(BaseModel):
    land: Optional[LandInput] = None
    weights: Optional[PreferenceWeights] = None
    # Flat field support for convenience
    land_id: Optional[str] = None
    location: Optional[str] = None
    area_hectares: Optional[float] = None
    soil_type: Optional[str] = None
    water_availability: Optional[str] = None
    budget: Optional[float] = None
    investment_horizon_years: Optional[int] = None
    health_score: Optional[float] = None


# Keep latest analysis in memory to provide context to the chatbot
_CURRENT_CONTEXT: Dict[str, Any] = {}


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "GreenVest AI Land Intelligence Engine",
        "version": "1.0.0",
        "capabilities": [
            "Smart Land Analysis",
            "GreenScore (0-100)",
            "AI Plantation Strategy Generator",
            "Carbon Forecast with Uncertainty Ranges",
            "Investment & ROI Calculator",
            "Strategy Comparison Engine",
            "Climate Risk Analysis",
            "Nature Impact Score",
            "What-If Scenario Simulator",
            "Satellite NDVI Monitoring",
            "Context-Aware Chatbot",
        ],
    }


@app.post("/api/analyze", response_model=AdvisorResult)
def run_analysis(payload: AnalyzePayload):
    try:
        # Determine LandInput
        if payload.land:
            land = payload.land
        else:
            land = LandInput(
                land_id=payload.land_id or "GV-2026-001",
                location=payload.location or "Nashik, Maharashtra",
                area_hectares=payload.area_hectares or 12.5,
                soil_type=payload.soil_type or "Black soil",
                water_availability=payload.water_availability or "Moderate",
                budget=payload.budget or 500000.0,
                investment_horizon_years=payload.investment_horizon_years or 15,
                health_score=payload.health_score or 82.0,
            )

        weights = payload.weights or PreferenceWeights(
            carbon=7.0, roi=7.0, low_risk=6.0, biodiversity=7.0, water_efficiency=6.0
        )

        result = recommend(land, weights)

        # Cache for chatbot context
        _CURRENT_CONTEXT["land"] = land
        _CURRENT_CONTEXT["result"] = result

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulate", response_model=WhatIfResult)
def run_simulation(req: WhatIfRequest):
    try:
        return simulate_scenario(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat", response_model=ChatMessageResponse)
def chat_assistant(req: ChatMessageRequest):
    try:
        land = _CURRENT_CONTEXT.get("land")
        result = _CURRENT_CONTEXT.get("result")
        bot = LandChatbot(land=land, advisor_result=result)
        reply = bot.answer(req.message)
        return ChatMessageResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/satellite/{land_id}")
def satellite_data(land_id: str):
    try:
        return get_satellite_monitoring_data(land_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
