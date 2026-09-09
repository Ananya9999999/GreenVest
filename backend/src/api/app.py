"""
FastAPI application exposing the GreenVest AI Land Intelligence and Investment Engine.
"""

from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.core.config import get_settings
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
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    SendMessageRequest,
    DirectMessageItem,
    GeospatialEnrichResponse,
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
    activate_paid_subscription,
    get_user_subscriptions,
    get_marketplace_lands,
    create_land_listing,
    send_direct_message,
    get_user_messages,
)
from src.services.payment_service import payment_service



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


@app.get("/api/geospatial/enrich", response_model=GeospatialEnrichResponse)
def get_geospatial_enrichment(lat: float, lon: float):
    """
    Enriches arbitrary latitude/longitude with real geospatial signals:
    - ISRIC SoilGrids v2.0 physical pedology (clay/sand/silt/SOC/pH) & NBSS-LUP ICAR fallbacks
    - OpenStreetMap Overpass proximity (distance to motorable road & mandi/town in km)
    - ISRO Bhuvan open thematic metadata
    - High-performance grid-cell caching
    """
    try:
        from src.geospatial.enricher import enrich_geospatial_point
        enriched = enrich_geospatial_point(lat, lon)
        return enriched
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geospatial enrichment failed: {str(e)}")


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

        # Enrich geospatial signals if coordinates are provided
        if land.latitude is not None and land.longitude is not None:
            try:
                from src.geospatial.enricher import enrich_geospatial_point
                enriched_data = enrich_geospatial_point(land.latitude, land.longitude)
                if not land.soil_type or land.soil_type == "Black soil":
                    land.soil_type = enriched_data.get("soil_type", land.soil_type)
                land.distance_to_road_km = float(enriched_data.get("distance_to_road_km", land.distance_to_road_km or 1.0))
                land.distance_to_market_km = float(enriched_data.get("distance_to_market_km", land.distance_to_market_km or 6.0))
                land.soil_ph = float(enriched_data.get("soil_ph", land.soil_ph or 7.4))
                land.organic_carbon_pct = float(enriched_data.get("organic_carbon_pct", land.organic_carbon_pct or 0.85))
                setattr(land, "_geospatial_enrichment", enriched_data)
            except Exception:
                pass

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


@app.get("/api/satellite")
@app.get("/api/satellite/{land_id}")
def satellite_data(
    land_id: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
):
    try:
        return get_satellite_monitoring_data(land_id=land_id, latitude=lat, longitude=lon)
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
def list_marketplace_lands(user_id: Optional[str] = None):
    try:
        # Check corporate access / paid plan if user_id is provided
        if user_id:
            user = get_user_by_id(user_id)
            if not user:
                raise HTTPException(status_code=404, detail=f"User @{user_id} not found.")
            if user["subscription_tier"] == "free":
                raise HTTPException(
                    status_code=403,
                    detail="A Corporate Access Pass (₹9,999) or Landowner Listing Plan is required to load verified marketplace lands.",
                )
        return get_marketplace_lands()
    except HTTPException:
        raise
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
            latitude=req.latitude,
            longitude=req.longitude,
            distance_to_road_km=req.distance_to_road_km,
            distance_to_market_km=req.distance_to_market_km,
        )
        return new_land
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------- Real Razorpay Payments -------------------

@app.post("/api/payments/create-order", response_model=CreateOrderResponse)
def create_payment_order(req: CreateOrderRequest):
    try:
        order_data = payment_service.create_order(
            user_id=req.user_id,
            plan_type=req.plan_type,
            amount=req.amount,
        )
        return CreateOrderResponse(**order_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payments/verify", response_model=VerifyPaymentResponse)
def verify_payment_checkout(req: VerifyPaymentRequest):
    try:
        user = get_user_by_id(req.user_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"User @{req.user_id} not found.")

        # Cryptographically verify the signature
        is_valid = payment_service.verify_payment_signature(
            razorpay_order_id=req.razorpay_order_id,
            razorpay_payment_id=req.razorpay_payment_id,
            razorpay_signature=req.razorpay_signature,
        )

        if not is_valid:
            from src.db.database import record_payment_event
            record_payment_event(
                event_id=None,
                event_type="payment.verification_failed",
                payment_id=req.razorpay_payment_id,
                order_id=req.razorpay_order_id,
                user_id=req.user_id,
                payload_json=f'{{"error": "Invalid signature", "received_sig": "{req.razorpay_signature}"}}',
                status="rejected",
            )
            raise HTTPException(
                status_code=400,
                detail="Payment signature verification failed. Untrusted checkout attempt rejected.",
            )

        settings = get_settings()
        plan_amount = settings.PLANS.get(req.plan_type, {}).get("price_inr", 1999.0)

        updated_user = activate_paid_subscription(
            user_id=req.user_id,
            plan_type=req.plan_type,
            amount=plan_amount,
            payment_id=req.razorpay_payment_id,
            order_id=req.razorpay_order_id,
        )

        from src.db.database import record_payment_event
        record_payment_event(
            event_id=None,
            event_type="payment.verification_success",
            payment_id=req.razorpay_payment_id,
            order_id=req.razorpay_order_id,
            user_id=req.user_id,
            payload_json=f'{{"status": "verified", "plan_type": "{req.plan_type}"}}',
            status="verified",
        )

        plan_name = settings.PLANS.get(req.plan_type, {}).get("name", req.plan_type)
        return VerifyPaymentResponse(
            success=True,
            user_id=updated_user["user_id"],
            subscription_tier=updated_user["subscription_tier"],
            credit_score=updated_user["credit_score"],
            credit_tier=updated_user["credit_tier"],
            message=f"Payment verified! Successfully activated {plan_name}. Green Credit score boosted to {updated_user['credit_score']}.",
            payment_id=req.razorpay_payment_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payments/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
):
    """
    Razorpay Webhook: Single source of truth for payment lifecycle events
    (payment.captured, order.paid, payment.failed).
    Works even if user closes browser immediately after checkout.
    """
    raw_body = await request.body()
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body in webhook")

    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")

    try:
        result = payment_service.process_webhook_event(
            payload=payload,
            raw_body=raw_body,
            signature_header=x_razorpay_signature,
        )
        return {"status": "ok", "result": result}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------- Legacy Subscriptions (Backward Compatibility) -------------------

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

        # Gate direct messaging to active paid subscribers
        if sender["subscription_tier"] == "free":
            raise HTTPException(
                status_code=403,
                detail="A Corporate Access Pass (₹9,999) or Landowner Listing Plan is required to initiate direct landowner messaging.",
            )

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


