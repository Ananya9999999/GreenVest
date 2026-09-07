from src.models.schemas import PreferenceWeights, StrategyScores
from src.ranker.ranker import compute_rank_score, invert_risk


def test_invert_risk():
    assert invert_risk(0) == 10
    assert invert_risk(10) == 0
    assert invert_risk(3) == 7


def test_compute_rank_score_prefers_carbon():
    scores = StrategyScores(carbon=9, roi=4, risk=3, biodiversity=8, water_efficiency=6)
    weights = PreferenceWeights(carbon=10, roi=1, low_risk=1, biodiversity=1, water_efficiency=1)
    score = compute_rank_score(scores, weights)
    assert score > 7  # heavily weighted toward carbon
