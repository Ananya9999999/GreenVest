"""
Example run of the AI Land Advisor.
"""

from src.models.schemas import LandInput, PreferenceWeights
from src.advisor.advisor import recommend


def main():
    land = LandInput(
        land_id="GV-2026-001",
        location="Nashik, Maharashtra",
        area_hectares=12.5,
        budget=500000,
        investment_horizon_years=15,
        health_score=82,
        soil_score=78,
        water_score=70,
        climate_score=85,
        vegetation_score=75,
        terrain_score=80,
        climate_risk=4.5,
    )

    # User cares most about carbon + biodiversity
    weights = PreferenceWeights(
        carbon=10,
        roi=6,
        low_risk=7,
        biodiversity=9,
        water_efficiency=5,
    )

    result = recommend(land, weights)

    print("=" * 60)
    print(f"Land: {result.land_id} | {land.location}")
    print(f"Area: {land.area_hectares} ha | Health Score: {land.health_score}/100")
    print("=" * 60)
    print("\n🏆 Best Match:", result.best_match.title)
    print(f"   Approach: {result.best_match.approach}")
    print(f"   Rank score: {result.best_match.rank_score:.2f}")
    print(f"   Investment: ₹{result.best_match.estimated_investment:,.0f}")
    print(f"   Expected ROI: {result.best_match.expected_roi_percent}%")
    print(f"   Risk: {result.best_match.risk_level}")
    print(f"   Species: {', '.join(result.best_match.recommended_species)}")

    print("\n📋 All Strategies (ranked):")
    for s in result.strategies:
        print(f"  #{s.rank} {s.title:20} score={s.rank_score:.2f}  ROI={s.expected_roi_percent}%  Risk={s.risk_level}")

    print("\n🌱 Carbon Forecast (best strategy):")
    for f in result.carbon_forecasts:
        print(f"  Year {f.years:2d}: +{f.sequestered_tco2e:,.1f} tCO2e  |  Cumulative {f.cumulative_tco2e:,.1f} tCO2e")

    print("\n💳 Credit Potential:")
    c = result.credit_estimate
    print(f"  ~{c.estimated_credits:,.0f} credits")
    print(f"  Value range: ${c.value_low_usd:,.0f} – ${c.value_high_usd:,.0f}")
    print(f"  Note: {c.note}")


if __name__ == "__main__":
    main()
