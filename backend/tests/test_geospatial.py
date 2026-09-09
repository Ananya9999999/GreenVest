import pytest
from fastapi.testclient import TestClient
from src.api.app import app
from src.scoring.health_scorer_v2 import calculate_land_health_score_v2
from src.geospatial.enricher import enrich_geospatial_point, get_grid_cell_key

client = TestClient(app)


def test_geospatial_enrich_endpoint():
    # Test enrichment for Nashik coordinates
    lat = 19.9975
    lon = 73.7898
    resp = client.get(f"/api/geospatial/enrich?lat={lat}&lon={lon}")
    assert resp.status_code == 200
    data = resp.json()

    assert "soil_type" in data
    assert "distance_to_road_km" in data
    assert "distance_to_market_km" in data
    assert "sources" in data
    assert len(data["sources"]) >= 2
    assert "bhuvan_context" in data
    assert data["bhuvan_context"]["recommended_layers"] is not None

    # Test cache stability: repeat query returns from cache
    resp2 = client.get(f"/api/geospatial/enrich?lat={lat}&lon={lon}")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["soil_type"] == data["soil_type"]
    assert data2["distance_to_road_km"] == data["distance_to_road_km"]
    assert data2["from_cache"] is True


def test_health_score_v2_breakdown():
    # Test high quality parcel
    res_high = calculate_land_health_score_v2(
        soil_type="Black Vertisol",
        soil_ph=7.4,
        organic_carbon_pct=1.2,
        water_availability="Abundant (Canal & High Water Table)",
        climate_risk_score=2.5,
        distance_to_road_km=0.3,
        distance_to_market_km=4.0,
        vegetation_score=85.0,
    )
    assert res_high["land_health_score"] >= 85
    assert "Grade A+" in res_high["grade"]
    assert len(res_high["factors"]) == 5

    # Test low proximity & constrained parcel
    res_low = calculate_land_health_score_v2(
        soil_type="Sandy Loam",
        soil_ph=8.2,
        organic_carbon_pct=0.3,
        water_availability="Rainfed / Constrained",
        climate_risk_score=7.8,
        distance_to_road_km=8.0,
        distance_to_market_km=32.0,
        vegetation_score=40.0,
    )
    # Score should be significantly lower when proximity, water, and soil degrade
    assert res_low["land_health_score"] < res_high["land_health_score"]
    assert res_low["proximity_score"] < res_high["proximity_score"]


def test_analyze_with_geospatial_enrichment():
    payload = {
        "land": {
            "land_id": "TEST-GEO-001",
            "location": "Nashik, Maharashtra",
            "area_hectares": 10.0,
            "latitude": 19.9975,
            "longitude": 73.7898,
            "budget": 500000.0,
            "investment_horizon_years": 15,
            "health_score": 80.0,
        }
    }
    resp = client.post("/api/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "health_score_v2" in data
    assert data["health_score_v2"] is not None
    assert data["health_score_v2"]["land_health_score"] > 0
    assert len(data["health_score_v2"]["factors"]) == 5


def test_create_land_with_auto_geospatial():
    # Verify user exists
    user_id = "nashik_organic_agro"
    payload = {
        "owner_user_id": user_id,
        "title": "Geospatial Automated Auto-Enriched Farm",
        "location": "Pune rural, MH",
        "area_hectares": 5.0,
        "latitude": 18.5204,
        "longitude": 73.8567,
        "water_availability": "Moderate (Borewell)",
        "asking_price_inr": 2000000.0,
    }
    resp = client.post("/api/marketplace/lands", json=payload)
    assert resp.status_code == 200
    land = resp.json()
    assert land["distance_to_road_km"] is not None
    assert land["distance_to_market_km"] is not None
    assert land["soil_type"] is not None
    assert land["land_health_score"] >= 50
