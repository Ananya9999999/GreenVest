from fastapi.testclient import TestClient
from src.api.app import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert len(data["capabilities"]) >= 10


def test_analyze():
    payload = {
        "location": "Nashik, Maharashtra",
        "area_hectares": 12.5,
        "soil_type": "Black soil",
        "water_availability": "Moderate",
        "budget": 500000.0,
        "investment_horizon_years": 15,
    }
    res = client.post("/api/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "smart_land" in data
    assert "greenscore" in data
    assert data["greenscore"]["overall_score"] > 0
    assert len(data["greenscore"]["factors"]) == 6
    assert "nature_impact" in data
    assert "climate_risk" in data
    assert len(data["strategies"]) == 3
    assert "comparison" in data
    assert len(data["carbon_forecasts"]) == 3

    # Verify ranges exist
    f20 = data["carbon_forecasts"][-1]
    assert f20["cumulative_max"] > f20["cumulative_min"]


def test_simulate():
    payload = {
        "land_input": {
            "land_id": "TEST-1",
            "location": "Nashik",
            "area_hectares": 10.0,
            "budget": 400000.0,
            "investment_horizon_years": 15,
            "health_score": 80.0,
        },
        "rainfall_change_percent": -20.0,
        "carbon_credit_price_usd": 20.0,
    }
    res = client.post("/api/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["rainfall_change_applied"] == -20.0
    assert "carbon_20y_range" in data
    assert "resilience_verdict" in data


def test_chat():
    res = client.post("/api/chat", json={"message": "Why did you recommend this?"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["reply"]) > 10


def test_satellite():
    res = client.get("/api/satellite/GV-2026-001")
    assert res.status_code == 200
    data = res.json()
    assert data["ndvi_current"] > 0
    assert len(data["timeseries"]) > 0


def test_auth_and_credit_score():
    import time
    ts = int(time.time() * 1000)
    unique_user = f"test_farmer_{ts}"
    payload = {
        "user_id": unique_user,
        "name": "Test Farmer",
        "email": f"testfarmer_{ts}@greenvest.org",
        "password": "securepassword",
        "user_type": "landowner",
        "verified_area_ha": 14.5,
        "budget_inr": 600000.0,
    }
    # Register
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    user = res.json()
    assert user["user_id"] == unique_user
    assert user["credit_score"] >= 700  # verified area and budget ensure prime tier
    assert len(user["credit_factors"]) == 4

    # Login
    login_res = client.post("/api/auth/login", json={"email_or_user_id": unique_user, "password": "securepassword"})
    assert login_res.status_code == 200
    assert login_res.json()["user_id"] == unique_user


def test_marketplace_and_direct_messaging():
    # 1. Fetch real marketplace lands
    res = client.get("/api/marketplace/lands")
    assert res.status_code == 200
    lands = res.json()
    assert len(lands) >= 5
    assert all(l["land_id"].startswith("LAND-") for l in lands)
    assert all(l["owner_user_id"] for l in lands)
    assert all(l["land_health_score"] > 0 for l in lands)

    # 2. Subscription upgrade
    sub_res = client.post("/api/subscription/subscribe", json={
        "user_id": "nashik_organic_agro",
        "plan_type": "landowner_listing",
        "amount_paid": 1999.0,
    })
    assert sub_res.status_code == 200
    assert sub_res.json()["subscription_tier"] == "landowner_listing"

    # 3. Create new land listing
    create_res = client.post("/api/marketplace/lands", json={
        "owner_user_id": "nashik_organic_agro",
        "title": "Certified Agroforestry Expansion Parcel",
        "location": "Nashik, MH",
        "area_hectares": 18.0,
        "soil_type": "Black soil",
        "water_availability": "Moderate",
        "asking_price_inr": 6200000.0,
    })
    assert create_res.status_code == 200
    new_land = create_res.json()
    assert new_land["land_id"].startswith("LAND-")
    assert new_land["land_health_score"] >= 75

    # 4. Direct user-to-user messaging via @userid
    msg_res = client.post("/api/messages", json={
        "sender_user_id": "greencorp_capital",
        "recipient_user_id": "nashik_organic_agro",
        "content": "Hello @nashik_organic_agro, we want to co-invest in your newly listed land.",
        "land_id": new_land["land_id"],
    })
    assert msg_res.status_code == 200
    assert msg_res.json()["sender_user_id"] == "greencorp_capital"

    # 5. Retrieve inbox messages
    inbox_res = client.get("/api/messages/nashik_organic_agro")
    assert inbox_res.status_code == 200
    msgs = inbox_res.json()
    assert len(msgs) >= 1

