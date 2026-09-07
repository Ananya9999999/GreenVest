"""
AI Land Assistant — simple rule-based chatbot (starter).

Replace the response logic with an LLM (OpenAI / local model) + RAG
over land data and strategy recommendations for production.
"""

from typing import Optional
from src.models.schemas import AdvisorResult, LandInput


class LandChatbot:
    """
    Context-aware assistant that knows the current land and recommendation.
    """

    def __init__(
        self,
        land: LandInput,
        advisor_result: AdvisorResult,
    ):
        self.land = land
        self.result = advisor_result
        self.best = advisor_result.best_match

    def answer(self, question: str) -> str:
        q = question.lower().strip()

        if any(w in q for w in ["why", "recommend", "reason", "chosen"]):
            return self._why_recommended()

        if any(w in q for w in ["roi", "return", "profit", "money"]):
            return self._about_roi()

        if any(w in q for w in ["risk", "safe", "safest"]):
            return self._about_risk()

        if any(w in q for w in ["carbon", "sequestr", "credit"]):
            return self._about_carbon()

        if any(w in q for w in ["budget", "cost", "invest", "expensive"]):
            return self._about_cost()

        if any(w in q for w in ["water", "irrigation", "drought"]):
            return self._about_water()

        if any(w in q for w in ["species", "plant", "tree", "what to grow"]):
            return self._about_species()

        if any(w in q for w in ["health", "score", "soil"]):
            return self._about_health()

        return self._fallback()

    def _why_recommended(self) -> str:
        return (
            f"I recommended **{self.best.title}** ({self.best.approach}) because "
            f"it best matches your priorities. "
            f"Rank score: {self.best.rank_score:.1f}/10. "
            f"It balances carbon potential ({self.best.scores.carbon}/10), "
            f"ROI outlook, and risk ({self.best.risk_level})."
        )

    def _about_roi(self) -> str:
        lines = ["Expected ROI by strategy:"]
        for s in self.result.strategies:
            lines.append(f"  • {s.title}: ~{s.expected_roi_percent}%")
        lines.append(f"\nBest match ({self.best.title}) targets ~{self.best.expected_roi_percent}% ROI.")
        return "\n".join(lines)

    def _about_risk(self) -> str:
        safest = min(self.result.strategies, key=lambda s: s.scores.risk)
        return (
            f"Risk levels:\n"
            + "\n".join(f"  • {s.title}: {s.risk_level}" for s in self.result.strategies)
            + f"\n\nSafest option: **{safest.title}** ({safest.risk_level})."
        )

    def _about_carbon(self) -> str:
        f = self.result.carbon_forecasts
        c = self.result.credit_estimate
        return (
            f"Under the recommended strategy, estimated cumulative sequestration:\n"
            + "\n".join(f"  • Year {x.years}: {x.cumulative_tco2e:,.0f} tCO2e" for x in f)
            + f"\n\nIndicative credits: ~{c.estimated_credits:,.0f} "
            f"(value range ${c.value_low_usd:,.0f}–${c.value_high_usd:,.0f}). "
            f"{c.note}"
        )

    def _about_cost(self) -> str:
        return (
            f"Estimated investment for **{self.best.title}**: "
            f"₹{self.best.estimated_investment:,.0f} "
            f"(for {self.land.area_hectares} ha).\n"
            f"Your stated budget: ₹{self.land.budget:,.0f}."
        )

    def _about_water(self) -> str:
        return (
            f"Water efficiency score for the recommended strategy: "
            f"{self.best.scores.water_efficiency}/10.\n"
            f"Land water score: {self.land.water_score or 'N/A'}. "
            f"Consider drought-tolerant species and efficient irrigation if water is constrained."
        )

    def _about_species(self) -> str:
        return (
            f"Recommended species for **{self.best.title}**:\n"
            + "\n".join(f"  • {sp}" for sp in self.best.recommended_species)
        )

    def _about_health(self) -> str:
        return (
            f"Land Health Score: **{self.land.health_score}/100**.\n"
            f"Soil: {self.land.soil_score} | Water: {self.land.water_score} | "
            f"Climate: {self.land.climate_score} | Vegetation: {self.land.vegetation_score}."
        )

    def _fallback(self) -> str:
        return (
            "I can help with questions about the recommendation, ROI, risk, carbon potential, "
            "costs, species, water, or land health. Try asking e.g. "
            "“Why did you recommend this?” or “What is the safest option?”"
        )
