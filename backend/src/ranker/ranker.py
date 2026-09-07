"""
Strategy Ranker — ranks plantation strategies using user preference weights.
"""

from src.models.schemas import (
    PreferenceWeights,
    StrategyRecommendation,
    StrategyScores,
)


def invert_risk(risk_score: float) -> float:
    """Risk is better when lower. Convert 0–10 risk into 0–10 'low-risk' score."""
    return max(0.0, 10.0 - risk_score)


def compute_rank_score(
    scores: StrategyScores,
    weights: PreferenceWeights,
) -> float:
    """
    Weighted sum of factor scores.
    Risk is inverted so higher weight on low_risk prefers safer strategies.
    """
    total_weight = (
        weights.carbon
        + weights.roi
        + weights.low_risk
        + weights.biodiversity
        + weights.water_efficiency
    )
    if total_weight == 0:
        return 0.0

    weighted = (
        scores.carbon * weights.carbon
        + scores.roi * weights.roi
        + invert_risk(scores.risk) * weights.low_risk
        + scores.biodiversity * weights.biodiversity
        + scores.water_efficiency * weights.water_efficiency
    )
    return weighted / total_weight


def rank_strategies(
    strategies: list[StrategyRecommendation],
    weights: PreferenceWeights,
) -> list[StrategyRecommendation]:
    """
    Assign rank_score and rank (1 = best) to each strategy.
    Returns strategies sorted best → worst.
    """
    for s in strategies:
        s.rank_score = compute_rank_score(s.scores, weights)

    ranked = sorted(strategies, key=lambda x: x.rank_score, reverse=True)
    for i, s in enumerate(ranked, start=1):
        s.rank = i

    return ranked
