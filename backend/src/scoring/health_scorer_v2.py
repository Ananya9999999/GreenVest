"""
Land Health Score v2 Engine for GreenVest.
Implements a multi-factor, explainable, empirical ecological and infrastructural scoring model:
1. Soil Pedology & Chemistry (Max 30 pts):
   - Texture & Soil taxonomy (Vertisols/Alluvium/Alfisols vs Sandy/Degraded)
   - Organic carbon % & pH balance (6.2 - 7.8 optimal)
2. Hydrological Resilience & Water Proxy (Max 25 pts):
   - Perennial / canal / borewell water access
   - Sub-surface percolation & groundwater table stability
3. Climate & Hazard Buffer (Max 20 pts):
   - Inverted climate risk score (wildfire, drought, heat stress resilience)
4. Infrastructure & Market Proximity (Max 15 pts):
   - Distance to nearest motorable road (penalties if > 3 km, bonus if < 1 km)
   - Distance to nearest town / mandi (penalties if > 15 km, bonus if < 8 km)
5. Baseline Vegetative Cover / Biomass Headroom (Max 10 pts):
   - Remote sensing NDVI baseline / vegetation score
Total: 0 to 100 points, mapped to explainable breakdown and credit grades.
"""

from typing import Dict, Any, List, Optional
import math


def calculate_land_health_score_v2(
    soil_type: str = "Black Vertisol",
    soil_ph: float = 7.4,
    organic_carbon_pct: float = 0.85,
    water_availability: str = "Moderate",
    climate_risk_score: float = 4.5,
    distance_to_road_km: float = 1.0,
    distance_to_market_km: float = 6.0,
    vegetation_score: Optional[float] = 75.0,
) -> Dict[str, Any]:
    """
    Computes Land Health Score v2 with explainable factor breakdown.
    """
    soil_lower = (soil_type or "").lower()
    water_lower = (water_availability or "").lower()

    # 1. Soil Pedology & Chemistry (0 to 30 pts)
    # Texture base
    if "black" in soil_lower or "vertisol" in soil_lower:
        soil_base = 22.0
    elif "alluvial" in soil_lower or "river" in soil_lower:
        soil_base = 24.0
    elif "red" in soil_lower or "alfisol" in soil_lower:
        soil_base = 20.0
    elif "laterite" in soil_lower:
        soil_base = 18.0
    elif "sandy" in soil_lower:
        soil_base = 13.0
    else:
        soil_base = 18.0

    # Organic carbon bonus (up to +4 pts for organic carbon >= 1.0%)
    soc_bonus = min(4.0, max(0.0, organic_carbon_pct * 3.5))

    # pH penalty if acidic (< 5.8) or highly alkaline (> 8.5)
    if 6.2 <= soil_ph <= 7.8:
        ph_bonus = 2.0
    elif 5.8 <= soil_ph <= 8.3:
        ph_bonus = 1.0
    else:
        ph_bonus = 0.0

    soil_score = round(min(30.0, max(5.0, soil_base + soc_bonus + ph_bonus)), 1)
    soil_detail = f"{soil_type} with pH {soil_ph:.1f} and {organic_carbon_pct:.2f}% organic carbon"

    # 2. Hydrological Resilience (0 to 25 pts)
    if "abundant" in water_lower or "canal" in water_lower or "perennial" in water_lower:
        water_pts = 24.0
        water_detail = "Year-round surface irrigation & high aquifer security"
    elif "moderate" in water_lower or "borewell" in water_lower or "well" in water_lower:
        water_pts = 19.5
        water_detail = "Borewell / seasonal aquifer recharge with moderate water table"
    elif "tank" in water_lower or "seasonal" in water_lower:
        water_pts = 15.0
        water_detail = "Seasonal percolation tank and surface runoff dependence"
    else:  # rainfed / constrained
        water_pts = 11.0
        water_detail = "Strictly rainfed; requires dry-season moisture conservation"

    # 3. Climate & Hazard Buffer (0 to 20 pts)
    # climate_risk_score is 0-10 (10 being highest danger)
    safe_risk = min(10.0, max(0.0, climate_risk_score))
    climate_pts = round(max(4.0, 20.0 - (safe_risk * 1.5)), 1)
    if safe_risk < 3.5:
        climate_detail = "Low multi-hazard vulnerability (minimal flood/wildfire stress)"
    elif safe_risk < 6.0:
        climate_detail = "Balanced micro-climate with seasonal dry spells"
    else:
        climate_detail = "Elevated climatic hazard profile; drought-hardy species required"

    # 4. Infrastructure & Market Proximity (0 to 15 pts)
    # Motorable Road factor (max 8 pts)
    if distance_to_road_km <= 0.5:
        road_pts = 8.0
    elif distance_to_road_km <= 1.5:
        road_pts = 7.0
    elif distance_to_road_km <= 3.0:
        road_pts = 5.5
    elif distance_to_road_km <= 5.0:
        road_pts = 3.5
    else:
        road_pts = 1.5

    # Agri Market / Mandi factor (max 7 pts)
    if distance_to_market_km <= 5.0:
        market_pts = 7.0
    elif distance_to_market_km <= 10.0:
        market_pts = 5.5
    elif distance_to_market_km <= 20.0:
        market_pts = 4.0
    elif distance_to_market_km <= 35.0:
        market_pts = 2.5
    else:
        market_pts = 1.0

    proximity_pts = round(road_pts + market_pts, 1)
    proximity_detail = f"{distance_to_road_km:.1f} km to motorable road, {distance_to_market_km:.1f} km to APMC mandi"

    # 5. Vegetative Baseline & Biomass Headroom (0 to 10 pts)
    veg_raw = vegetation_score if vegetation_score is not None else 75.0
    veg_pts = round(min(10.0, max(2.0, (veg_raw / 100.0) * 10.0)), 1)
    veg_detail = f"Baseline photosynthetic canopy vigor index {veg_raw:.0f}/100"

    # Total Score
    total_health = int(round(soil_score + water_pts + climate_pts + proximity_pts + veg_pts))
    total_health = min(98, max(40, total_health))

    if total_health >= 85:
        grade = "Grade A+ (Prime Ecological Asset)"
        verdict = "Outstanding agroforestry potential with premier soil fertility and optimal logistics access."
    elif total_health >= 75:
        grade = "Grade A (High Productivity)"
        verdict = "Robust vegetative capacity and favorable soil-water parameters for commercial agroforestry."
    elif total_health >= 65:
        grade = "Grade B (Moderate Potential)"
        verdict = "Good restoration potential; benefits from micro-irrigation and soil organic amendments."
    else:
        grade = "Grade C (Developing Parcel)"
        verdict = "Challenging terrain or constrained access; best suited for pioneer species & soil reclamation."

    factors = [
        {
            "name": "Soil Pedology & Chemistry",
            "score": soil_score,
            "max_score": 30,
            "weight_percent": 30,
            "detail": soil_detail,
        },
        {
            "name": "Hydrological Resilience",
            "score": water_pts,
            "max_score": 25,
            "weight_percent": 25,
            "detail": water_detail,
        },
        {
            "name": "Climate & Hazard Buffer",
            "score": climate_pts,
            "max_score": 20,
            "weight_percent": 20,
            "detail": climate_detail,
        },
        {
            "name": "Infrastructure & Market Proximity",
            "score": proximity_pts,
            "max_score": 15,
            "weight_percent": 15,
            "detail": proximity_detail,
        },
        {
            "name": "Vegetative Canopy Baseline",
            "score": veg_pts,
            "max_score": 10,
            "weight_percent": 10,
            "detail": veg_detail,
        },
    ]

    return {
        "land_health_score": total_health,
        "grade": grade,
        "verdict": verdict,
        "factors": factors,
        "soil_score": soil_score,
        "water_score": water_pts,
        "climate_score": climate_pts,
        "proximity_score": proximity_pts,
        "vegetation_score": veg_pts,
    }
