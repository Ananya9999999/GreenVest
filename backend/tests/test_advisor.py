from src.models.schemas import LandInput, PreferenceWeights
from src.advisor.advisor import recommend


def test_recommend_returns_three_strategies():
    land = LandInput(
        land_id="TEST-001",
        location="Test",
        area_hectares=10,
        budget=300000,
        investment_horizon_years=10,
        health_score=75,
    )
    weights = PreferenceWeights(carbon=8, roi=7, low_risk=6, biodiversity=5, water_efficiency=5)
    result = recommend(land, weights)

    assert len(result.strategies) == 3
    assert result.best_match.rank == 1
    assert len(result.carbon_forecasts) == 3
    assert result.credit_estimate.estimated_credits > 0
