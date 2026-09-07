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
