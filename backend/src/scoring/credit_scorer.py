"""
Individual Green Credit Scorer for GreenVest.
Calculates a 300–900 creditworthiness and sustainability credit score
based on verified land equity, ecological stewardship, capital commitment, and platform verification.
"""

from typing import Dict, Any


def calculate_user_credit_score(
    user_type: str = "landowner",
    verified_area_ha: float = 10.0,
    land_health_score: float = 80.0,
    stated_budget_inr: float = 500000.0,
    has_active_subscription: bool = True,
    completed_transactions: int = 1,
) -> Dict[str, Any]:
    """
    Computes sustainability & financial credit score on a standard 300–900 scale.
    Breakdown:
      - Base Score: 400
      - Land Collateral / Equity (30%): Up to 150 pts
      - Ecological Stewardship & Land Health (30%): Up to 150 pts
      - Capital / Financial Standing (25%): Up to 125 pts
      - Platform Verification & Subscription (15%): Up to 75 pts
    """
    base_score = 400

    # 1. Land Equity (0 to 150)
    # 20 ha maxes out equity points for individual landowners
    area_factor = min(1.0, verified_area_ha / 20.0)
    equity_pts = int(round(area_factor * 150))

    # 2. Ecological Stewardship (0 to 150)
    # Based on average land health score
    health_factor = min(1.0, max(0.0, land_health_score / 100.0))
    stewardship_pts = int(round(health_factor * 150))

    # 3. Capital / Financial Standing (0 to 125)
    # Stated budget / capital reserves: ₹10L maxes out
    budget_factor = min(1.0, stated_budget_inr / 1000000.0)
    financial_pts = int(round(budget_factor * 125))

    # 4. Platform Verification & Subscription (0 to 75)
    verification_pts = 35 if has_active_subscription else 10
    verification_pts += min(40, completed_transactions * 20)

    total_score = min(900, max(300, base_score + equity_pts + stewardship_pts + financial_pts + verification_pts))

    if total_score >= 780:
        tier = "Prime Green A+ (Tier 1 Verified)"
        status = "Excellent"
        interest_discount = "1.5% APR green financing discount"
    elif total_score >= 700:
        tier = "Tier 1 Sustainable Sponsor"
        status = "Very Good"
        interest_discount = "1.0% APR green financing discount"
    elif total_score >= 620:
        tier = "Tier 2 Standard Operator"
        status = "Good"
        interest_discount = "Standard market rates"
    else:
        tier = "Probationary / Emerging"
        status = "Developing"
        interest_discount = "Collateral verification required"

    factors = [
        {
            "name": "Land Equity & Asset Base",
            "points": equity_pts,
            "max_points": 150,
            "description": f"Verified {verified_area_ha:.1f} ha landholding collateral",
        },
        {
            "name": "Ecological Health & Stewardship",
            "points": stewardship_pts,
            "max_points": 150,
            "description": f"Average Land Health Score {land_health_score:.0f}/100",
        },
        {
            "name": "Financial Capacity & Reserves",
            "points": financial_pts,
            "max_points": 125,
            "description": f"₹{stated_budget_inr/100000:.1f} Lakhs capital verified",
        },
        {
            "name": "Verification & Platform Standing",
            "points": verification_pts,
            "max_points": 75,
            "description": "Active subscription & verified identity",
        },
    ]

    return {
        "credit_score": total_score,
        "tier": tier,
        "status": status,
        "green_financing_incentive": interest_discount,
        "factors": factors,
    }
