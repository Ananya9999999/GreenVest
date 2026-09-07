"""Seed sample marketplace listings for local development."""

import asyncio

from src.db.base import AsyncSessionLocal, init_db
from src.api.schemas import ParcelCreate, LandScoreIn
from src.land.service import create_parcel

SAMPLE_LISTINGS = [
    {
        "location": "Nashik, Maharashtra",
        "state": "Maharashtra",
        "district": "Nashik",
        "area_hectares": 12.5,
        "latitude": 19.9975,
        "longitude": 73.7898,
        "description": "Well-drained black cotton soil, near irrigation canal.",
        "listing_price": 4500000,
        "scores": {
            "health_score": 82,
            "soil_score": 78,
            "water_score": 70,
            "climate_score": 85,
            "vegetation_score": 75,
            "terrain_score": 80,
            "climate_risk": 4.5,
            "carbon_potential": 9.2,
            "soil_type": "black cotton",
        },
    },
    {
        "location": "Coimbatore, Tamil Nadu",
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "area_hectares": 8.0,
        "latitude": 11.0168,
        "longitude": 76.9558,
        "description": "Red soil parcel suitable for agroforestry.",
        "listing_price": 3200000,
        "scores": {
            "health_score": 74,
            "soil_score": 72,
            "water_score": 65,
            "climate_score": 80,
            "vegetation_score": 68,
            "terrain_score": 77,
            "climate_risk": 5.0,
            "carbon_potential": 7.8,
            "soil_type": "red soil",
        },
    },
    {
        "location": "Jhabua, Madhya Pradesh",
        "state": "Madhya Pradesh",
        "district": "Jhabua",
        "area_hectares": 25.0,
        "latitude": 22.7680,
        "longitude": 74.5900,
        "description": "Degraded fallow land — high restoration potential.",
        "listing_price": 1800000,
        "scores": {
            "health_score": 58,
            "soil_score": 55,
            "water_score": 48,
            "climate_score": 70,
            "vegetation_score": 40,
            "terrain_score": 72,
            "climate_risk": 6.5,
            "carbon_potential": 11.0,
            "soil_type": "sandy loam",
        },
    },
    {
        "location": "Wayanad, Kerala",
        "state": "Kerala",
        "district": "Wayanad",
        "area_hectares": 5.5,
        "latitude": 11.6854,
        "longitude": 76.1320,
        "description": "High-rainfall zone, ideal for mixed native forest.",
        "listing_price": 5500000,
        "scores": {
            "health_score": 91,
            "soil_score": 88,
            "water_score": 92,
            "climate_score": 90,
            "vegetation_score": 85,
            "terrain_score": 78,
            "climate_risk": 3.5,
            "carbon_potential": 12.5,
            "soil_type": "laterite",
        },
    },
]


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        for item in SAMPLE_LISTINGS:
            scores = LandScoreIn(**item.pop("scores"))
            data = ParcelCreate(
                **item,
                is_marketplace=True,
                scores=scores,
            )
            out = await create_parcel(db, data, owner_id=None)
            print(f"Seeded {out.land_id} — {out.location} (health={out.scores.health_score})")
        await db.commit()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(seed())
