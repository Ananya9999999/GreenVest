"""
FastAPI application exposing the GreenVest AI Land Intelligence and Investment Engine.
"""

from typing import Optional, Dict, Any, List
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
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileResponse,
    MarketplaceLandItem,
    CreateLandRequest,
    SubscriptionRequest,
    SubscriptionResponse,
    SendMessageRequest,
    DirectMessageItem,
)
from src.advisor.advisor import recommend
from src.advisor.simulator import simulate_scenario
from src.chatbot.chatbot import LandChatbot
from src.satellite.monitor import get_satellite_monitoring_data
from src.db.database import (
    init_db,
    register_user,
    get_user_by_id,
    get_user_by_email,
    update_subscription,
    get_marketplace_lands,
    create_land_listing,
    send_direct_message,
    get_user_messages,
)


app = FastAPI(
    title="GreenVest Land Intelligence Engine",
    description="AI-driven decision engine for land, plantation strategies, carbon forecasts, and investment analysis.",
    version="1.0.0",
)

# Ensure database tables and seed data are ready immediately
init_db()

@app.on_event("startup")
def on_startup():
    init_db()

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


# ------------------- Authentication & User Profile -------------------

@app.post("/api/auth/register", response_model=UserProfileResponse)
def register(req: UserRegisterRequest):
    try:
        user = register_user(
            user_id=req.user_id,
            name=req.name,
            email=req.email,
            password=req.password,
            user_type=req.user_type,
            verified_area_ha=req.verified_area_ha,
            budget_inr=req.budget_inr,
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login", response_model=UserProfileResponse)
def login(req: UserLoginRequest):
    target = req.email_or_user_id.strip()
    if "@" in target and "." in target:
        user = get_user_by_email(target)
    else:
        user = get_user_by_id(target)

    if not user:
        raise HTTPException(status_code=404, detail="Account not found. Please check your @userid or email.")

    if user["password_hash"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid password credentials.")

    return user


@app.get("/api/auth/user/{user_id}", response_model=UserProfileResponse)
def get_profile(user_id: str):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User @{user_id} not found.")
    return user


# ------------------- Marketplace Lands -------------------

@app.get("/api/marketplace/lands", response_model=List[MarketplaceLandItem])
def list_marketplace_lands():
    try:
        return get_marketplace_lands()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketplace/lands", response_model=MarketplaceLandItem)
def create_land(req: CreateLandRequest):
    try:
        # Verify user exists
        user = get_user_by_id(req.owner_user_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"Owner user @{req.owner_user_id} not found.")

        # Check subscription or allow if active
        if user["subscription_tier"] == "free":
            raise HTTPException(
                status_code=403,
                detail="A Landowner Listing Subscription (₹1,999/listing) is required to list parcels on the marketplace with verified Land Health certification."
            )

        new_land = create_land_listing(
            owner_user_id=req.owner_user_id,
            title=req.title,
            location=req.location,
            area_hectares=req.area_hectares,
            soil_type=req.soil_type,
            water_availability=req.water_availability,
            asking_price_inr=req.asking_price_inr,
        )
        return new_land
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------- Subscriptions -------------------

@app.post("/api/subscription/subscribe", response_model=SubscriptionResponse)
def activate_subscription(req: SubscriptionRequest):
    try:
        user = get_user_by_id(req.user_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"User @{req.user_id} not found.")

        updated = update_subscription(
            user_id=req.user_id,
            plan_type=req.plan_type,
            amount_paid=req.amount_paid,
        )

        plan_name = "Landowner Listing Pro" if req.plan_type == "landowner_listing" else "Corporate Marketplace Pass"
        return SubscriptionResponse(
            user_id=updated["user_id"],
            subscription_tier=updated["subscription_tier"],
            credit_score=updated["credit_score"],
            credit_tier=updated["credit_tier"],
            message=f"Successfully upgraded to {plan_name}. Credit score increased to {updated['credit_score']}!"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------- Direct User-to-User Messages -------------------

@app.get("/api/messages/{user_id}", response_model=List[DirectMessageItem])
def get_messages(user_id: str):
    try:
        return get_user_messages(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/messages", response_model=DirectMessageItem)
def send_message(req: SendMessageRequest):
    try:
        # Check sender & recipient exist
        sender = get_user_by_id(req.sender_user_id)
        if not sender:
            raise HTTPException(status_code=404, detail=f"Sender @{req.sender_user_id} not found.")

        recipient = get_user_by_id(req.recipient_user_id)
        if not recipient:
            raise HTTPException(status_code=404, detail=f"Recipient @{req.recipient_user_id} not found.")

        msg = send_direct_message(
            sender_user_id=req.sender_user_id,
            recipient_user_id=req.recipient_user_id,
            content=req.content,
            land_id=req.land_id,
        )
        return msg
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

