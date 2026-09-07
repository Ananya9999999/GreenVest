"""
Climate & Environmental Risk Analyzer for GreenVest.
Evaluates multi-hazard risks (Wildfire, Water Scarcity, Flooding, Drought, Heat Stress)
and provides an overall risk score and mitigation advisory.
"""

from typing import Optional


def analyze_climate_risk(
    location: str,
    soil_type: Optional[str] = "Black soil",
    water_availability: Optional[str] = "Moderate",
    base_climate_risk: Optional[float] = None,
) -> dict:
    """
    Computes hazard ratings and actionable environmental risk advisory.
    """
    loc = location.lower()
    soil = (soil_type or "").lower()
    water = (water_availability or "").lower()

    # Hazard calculation heuristics based on geography and soil moisture retention
    # 1. Wildfire Risk
    if any(k in loc for k in ["arid", "rajasthan", "gujarat", "dry"]):
        wildfire_score = 6.8
        wildfire_level = "High"
        wildfire_desc = "High summer dry-matter load; firebreaks and buffer species recommended."
    elif any(k in loc for k in ["western ghats", "kerala", "coimbatore", "assam"]):
        wildfire_score = 2.4
        wildfire_level = "Low"
        wildfire_desc = "Humid micro-climate minimizes wildfire initiation risks."
    else:
        wildfire_score = 4.2
        wildfire_level = "Moderate"
        wildfire_desc = "Seasonal dry spells during pre-monsoon heat; maintain weeded perimeter firebreaks."

    # 2. Water Scarcity
    if "rainfed" in water or "low" in water or "constrained" in water:
        water_score = 7.8
        water_level = "High"
        water_desc = "Reliance on seasonal precipitation poses vulnerability in low-monsoon years."
    elif "abundant" in water or "canal" in water or "high" in water:
        water_score = 2.2
        water_level = "Low"
        water_desc = "Year-round surface/canal irrigation ensures steady sapling hydration."
    else:
        water_score = 4.8
        water_level = "Moderate"
        water_desc = "Groundwater accessible; drip irrigation and mulching optimize moisture retention."

    # 3. Flooding Risk
    if "alluvial" in soil or any(k in loc for k in ["delta", "river", "bihar", "assam", "coastal"]):
        flood_score = 6.5
        flood_level = "Moderate to High"
        flood_desc = "Monsoon waterlogging potential; raised bunds and water drainage channels needed."
    elif "sandy" in soil:
        flood_score = 1.8
        flood_level = "Low"
        flood_desc = "Rapid percolation and permeable sub-stratum prevent water stagnation."
    else:
        flood_score = 3.2
        flood_level = "Low"
        flood_desc = "Standard contour bunding sufficient for peak runoff events."

    # 4. Drought Risk
    if "sandy" in soil or "rainfed" in water or any(k in loc for k in ["vidarbha", "marathwada", "deccan", "nashik", "rayalaseema"]):
        drought_score = 6.4
        drought_level = "Moderate to High"
        drought_desc = "Decadal trends indicate longer dry spells between rain events. Deep-rooting native species advised."
    elif "black" in soil:
        drought_score = 4.0
        drought_level = "Moderate"
        drought_desc = "Black cotton soil holds moisture well during brief droughts, buffering root zones."
    else:
        drought_score = 3.5
        drought_level = "Low"
        drought_desc = "Moderate precipitation regime buffers against prolonged moisture deficits."

    # 5. Rising Temperatures / Heat Stress
    heat_score = 5.2
    heat_level = "Moderate"
    heat_desc = "Projected 1.2°C rise over 15 years; canopy-shading agroforestry cushions delicate understory."

    # Composite Risk Score (0–10 scale)
    raw_composite = (
        wildfire_score * 0.20
        + water_score * 0.30
        + flood_score * 0.15
        + drought_score * 0.25
        + heat_score * 0.10
    )

    if base_climate_risk is not None and base_climate_risk > 0:
        overall_score = round((raw_composite * 0.6 + base_climate_risk * 0.4), 1)
    else:
        overall_score = round(raw_composite, 1)

    if overall_score < 3.5:
        risk_category = "Low"
    elif overall_score < 6.5:
        risk_category = "Medium"
    else:
        risk_category = "High"

    advisory = (
        f"Drought and water scarcity risk is expected to remain {drought_level.lower()} over the next 10 years. "
        "Drought-resistant native species, contour swales, and drip irrigation scheduling are recommended "
        "to de-risk capital investment and maximize timber and carbon yields."
    )

    hazards = [
        {
            "name": "Wildfire",
            "icon": "🔥",
            "level": wildfire_level,
            "score": wildfire_score,
            "detail": wildfire_desc,
        },
        {
            "name": "Water Scarcity",
            "icon": "💧",
            "level": water_level,
            "score": water_score,
            "detail": water_desc,
        },
        {
            "name": "Flooding",
            "icon": "🌊",
            "level": flood_level,
            "score": flood_score,
            "detail": flood_desc,
        },
        {
            "name": "Drought",
            "icon": "🏜",
            "level": drought_level,
            "score": drought_score,
            "detail": drought_desc,
        },
        {
            "name": "Rising Temperatures",
            "icon": "🌡",
            "level": heat_level,
            "score": heat_score,
            "detail": heat_desc,
        },
    ]

    return {
        "overall_risk_score": overall_score,
        "risk_category": risk_category,
        "hazards": hazards,
        "advisory": advisory,
    }
