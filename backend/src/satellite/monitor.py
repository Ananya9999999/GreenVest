"""
Satellite-based monitoring module for GreenVest.
Provides NDVI vegetation health index tracking, canopy coverage expansion,
and historical satellite trend modeling for plantation health verification.
"""

from typing import Optional


def get_satellite_monitoring_data(land_id: str = "GV-2026-001") -> dict:
    """
    Returns simulated high-resolution Sentinel-2 / Landsat NDVI time-series,
    current vegetation vigor indices, canopy coverage, and recent alerts.
    """
    # 6-month historical Sentinel-2 NDVI observation series
    timeseries = [
        {"date": "Mar 2026", "ndvi": 0.42, "soil_moisture": 48, "label": "Early Post-Planting"},
        {"date": "Apr 2026", "ndvi": 0.46, "soil_moisture": 44, "label": "Root Establishment"},
        {"date": "May 2026", "ndvi": 0.49, "soil_moisture": 39, "label": "Dry Season Retention"},
        {"date": "Jun 2026", "ndvi": 0.58, "soil_moisture": 72, "label": "Monsoon Flush"},
        {"date": "Jul 2026", "ndvi": 0.64, "soil_moisture": 81, "label": "Rapid Canopy Expansion"},
        {"date": "Aug 2026", "ndvi": 0.71, "soil_moisture": 78, "label": "Peak Biomass Vigor"},
    ]

    recent_alerts = [
        {
            "id": "alt-1",
            "type": "opportunity",
            "title": "Optimal Soil Hydration Detected",
            "description": "Monsoon infiltration at root layer optimal (78% field capacity). Ideal window for intercrop legume seeding.",
            "timestamp": "2 days ago",
            "status": "active",
        },
        {
            "id": "alt-2",
            "type": "positive",
            "title": "Vegetation Vigor Surge (+12%)",
            "description": "NDVI index climbed from 0.64 to 0.71 across southern parcel boundary, exceeding regional baseline.",
            "timestamp": "1 week ago",
            "status": "resolved",
        },
        {
            "id": "alt-3",
            "type": "advisory",
            "title": "Micro-Thermal Anomaly Insignificant",
            "description": "Border buffer swales prevented dry edge burn-in during pre-monsoon heat wave.",
            "timestamp": "3 weeks ago",
            "status": "resolved",
        },
    ]

    return {
        "land_id": land_id,
        "ndvi_current": 0.71,
        "ndvi_baseline": 0.38,
        "ndvi_trend_percent": 12.4,
        "vegetation_health_status": "Vigorous / Rapid Growth",
        "canopy_cover_percent": 34.5,
        "biomass_density_index": "High",
        "timeseries": timeseries,
        "recent_alerts": recent_alerts,
    }
