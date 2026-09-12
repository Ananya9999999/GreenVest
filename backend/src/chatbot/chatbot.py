"""
GreenVest context-aware land assistant.

- Rule-based answers grounded in the current AdvisorResult / LandInput
- Optional Groq LLM (set GROQ_API_KEY) for open-ended questions
- Never invents certified carbon credits or guaranteed returns
"""

from __future__ import annotations

import os
from typing import Optional, Any

from src.models.schemas import AdvisorResult, LandInput


class LandChatbot:
    """
    Context-aware assistant for land health, strategies, carbon, ROI, and risk.
    """

    def __init__(
        self,
        land: Optional[LandInput] = None,
        advisor_result: Optional[AdvisorResult] = None,
    ):
        self.land = land or LandInput()
        self.result = advisor_result
        self.best = advisor_result.best_match if advisor_result else None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def answer(self, question: str) -> str:
        q = (question or "").strip()
        if not q:
            return "Ask me about strategies, GreenScore, trees, carbon, ROI, cost, or climate risk."

        # Prefer structured answers when intent is clear
        rule = self._rule_answer(q.lower())
        if rule is not None:
            return rule

        # Open-ended → Groq if configured
        groq_reply = self._groq_answer(q)
        if groq_reply:
            return groq_reply

        return self._fallback()

    # ------------------------------------------------------------------
    # Rule router
    # ------------------------------------------------------------------

    def _rule_answer(self, q: str) -> Optional[str]:
        if any(w in q for w in ["why", "recommend", "reason", "chosen", "best strategy"]):
            return self._why_recommended()

        if any(w in q for w in ["greenscore", "green score", "health score", "land health"]):
            return self._about_greenscore()

        if any(w in q for w in ["nature impact", "biodiversity", "ecological"]):
            return self._about_nature_impact()

        if any(w in q for w in ["roi", "return", "profit", "breakeven", "break-even", "payback"]):
            return self._about_roi()

        if any(w in q for w in ["risk", "wildfire", "drought", "hazard", "safest", "climate risk"]):
            return self._about_risk()

        if any(w in q for w in ["carbon", "sequestr", "credit", "co2", "tco2"]):
            return self._about_carbon()

        if any(w in q for w in ["tree", "density", "sapling", "species", "how many", "plantation"]):
            return self._about_trees()

        if any(w in q for w in ["budget", "cost", "invest", "expensive", "breakdown", "price"]):
            return self._about_cost()

        if any(w in q for w in ["water", "irrigation", "rain", "weather", "plant now", "planting window"]):
            return self._about_water_and_weather()

        if any(w in q for w in ["what if", "simulate", "scenario", "rainfall"]):
            return self._about_what_if()

        if any(w in q for w in ["hello", "hi ", "hey", "help", "what can you"]):
            return self._fallback()

        # No clear intent → let Groq / fallback handle
        return None

    # ------------------------------------------------------------------
    # Rule responses (grounded in analysis context)
    # ------------------------------------------------------------------

    def _why_recommended(self) -> str:
        if not self.best:
            return (
                "Based on bio-climatic analysis, a **Balanced** agroforestry strategy is usually "
                "recommended for a practical mix of carbon, ROI, and lower risk. "
                "Run Analyze with your land inputs to get a parcel-specific ranking."
            )
        reason = getattr(self.best, "ai_recommendation_reason", None) or (
            f"It balances your stated priorities for this parcel at {self.land.location}."
        )
        return (
            f"**Recommended: {self.best.title}** ({self.best.approach})\n\n"
            f"{reason}\n\n"
            f"• Rank score: {getattr(self.best, 'rank_score', '—')}\n"
            f"• Expected ROI (indicative): {getattr(self.best, 'expected_roi_percent', '—')}%\n"
            f"• Risk level: {getattr(self.best, 'risk_level', '—')}\n\n"
            "_Figures are decision-support estimates, not guaranteed returns or certified credits._"
        )

    def _about_greenscore(self) -> str:
        gs = getattr(self.result, "green_score", None) if self.result else None
        if not gs:
            hs = getattr(self.land, "health_score", 82)
            return (
                f"Land Health for **{self.land.location}** is currently framed around a health score near "
                f"**{hs}/100**. Run a full analysis to get the full GreenScore factor breakdown "
                f"(soil, water, climate, vegetation, terrain)."
            )
        factors = getattr(gs, "factors", []) or []
        lines = [
            f"**GreenScore: {gs.overall_score}/100** — {gs.tier}",
            "",
            gs.summary or "",
            "",
            "Factor breakdown:",
        ]
        for f in factors[:6]:
            lines.append(
                f"• {f.name}: {f.score}/100 (weight {f.weight}) — {f.status}"
            )
        return "\n".join(lines)

    def _about_nature_impact(self) -> str:
        ni = getattr(self.result, "nature_impact", None) if self.result else None
        if not ni:
            return (
                "Nature Impact blends carbon, biodiversity, water, and soil improvement. "
                "Run Analyze to compute a parcel-specific Nature Impact Score."
            )
        return (
            f"**Nature Impact Score: {ni.overall_score}/100**\n\n"
            f"• Carbon: {ni.carbon_score}\n"
            f"• Biodiversity: {ni.biodiversity_score}\n"
            f"• Water impact: {ni.water_impact_score}\n"
            f"• Soil improvement: {ni.soil_improvement_score}\n\n"
            f"{getattr(ni, 'interpretation', '')}"
        )

    def _about_roi(self) -> str:
        if not self.best or not getattr(self.best, "investment", None):
            return (
                "ROI depends on strategy (Max Carbon / Max ROI / Balanced), area, and costs. "
                "Open Analyze to see projected ROI % and break-even years for each strategy. "
                "These are indicative models, not financial advice."
            )
        inv = self.best.investment
        return (
            f"**Investment snapshot — {self.best.title}**\n\n"
            f"• Initial cost: ₹{inv.initial_cost:,.0f}\n"
            f"• Indicative ROI: {inv.roi_percent}%\n"
            f"• Break-even: ~{inv.breakeven_years} years\n"
            f"• Carbon revenue (avg/yr, indicative): ₹{inv.carbon_revenue_annual_avg:,.0f}\n"
            f"• Harvest revenue (avg/yr, indicative): ₹{inv.harvest_revenue_annual_avg:,.0f}\n\n"
            "_Not a guarantee of returns. Validate with local agronomy and finance advisors._"
        )

    def _about_risk(self) -> str:
        risk = getattr(self.result, "climate_risk", None) if self.result else None
        if not risk:
            base = getattr(self.land, "climate_risk", 4.5)
            return (
                f"Baseline climate risk for this context is around **{base}/10**. "
                "Analyze the land to see hazard breakdown (drought, heat, extreme rain, etc.)."
            )
        hazards = getattr(risk, "hazards", []) or []
        lines = [
            f"**Climate risk score: {risk.overall_score}/10**",
            "",
            getattr(risk, "advisory", "") or "",
            "",
            "Hazards:",
        ]
        for h in hazards[:6]:
            lines.append(f"• {h.name}: {h.score}/10 — {h.note}")
        return "\n".join(lines)

    def _about_carbon(self) -> str:
        if not self.best:
            return (
                "Carbon potential depends on species mix, density, and survival. "
                "GreenVest shows **indicative** sequestration ranges and credit *potential* — "
                "not issued or certified carbon credits."
            )
        cpha = getattr(self.best, "carbon_potential_tco2e_per_ha", None)
        area = getattr(self.land, "area_hectares", 0) or 0
        total = (cpha * area) if cpha is not None else None
        cf = getattr(self.result, "carbon_forecast", None) if self.result else None
        extra = ""
        if cf:
            extra = (
                f"\n• Forecast horizon: {getattr(cf, 'horizon_years', '20')} years\n"
                f"• Summary: {getattr(cf, 'summary', '')}"
            )
        return (
            f"**Carbon (indicative) — {self.best.title}**\n\n"
            f"• Potential: ~{cpha} tCO₂e / ha / yr (model estimate)\n"
            f"• Parcel area: {area} ha\n"
            + (f"• Rough annual total: ~{total:,.1f} tCO₂e / yr\n" if total else "")
            + extra
            + "\n\n_Not certified credits. Real issuance needs MRV and a registered methodology._"
        )

    def _about_trees(self) -> str:
        if not self.best:
            return (
                "Tree density depends on strategy — e.g. denser native mixes vs commercial bamboo. "
                "Run Analyze to see species lists and trees per hectare."
            )
        species = getattr(self.best, "recommended_species", []) or []
        sp = "\n".join(f"• {s}" for s in species) or "• See strategy card for species mix"
        return (
            f"**Plantation plan — {self.best.title}**\n\n"
            f"• Density: {getattr(self.best, 'density_trees_per_ha', '—')} trees/ha\n"
            f"• Total trees (approx): {getattr(self.best, 'total_trees', '—')}\n"
            f"• Species:\n{sp}"
        )

    def _about_cost(self) -> str:
        if not self.best or not getattr(self.best, "cost_breakdown", None):
            return (
                "Costs typically include saplings, land preparation, irrigation, and fencing. "
                "Analyze a parcel to see a full cost breakdown for each strategy."
            )
        cb = self.best.cost_breakdown
        maint = getattr(self.best, "maintenance", None)
        maint_line = (
            f"• Annual maintenance: ~₹{maint.annual_cost:,.0f}/yr"
            if maint
            else ""
        )
        return (
            f"**Cost breakdown — {self.best.title}**\n\n"
            f"• Saplings: ₹{cb.saplings:,.0f}\n"
            f"• Land preparation: ₹{cb.land_preparation:,.0f}\n"
            f"• Irrigation: ₹{cb.irrigation_infrastructure:,.0f}\n"
            f"• Fencing & protection: ₹{cb.fencing_and_protection:,.0f}\n"
            f"• **Total initial:** ₹{cb.total_initial_cost:,.0f}\n"
            f"{maint_line}"
        )

    def _about_water_and_weather(self) -> str:
        water = getattr(self.land, "water_availability", None) or "Moderate"
        return (
            f"**Water & planting window**\n\n"
            f"• Recorded water availability: {water}\n"
            f"• Prefer planting ahead of reliable moisture (monsoon onset / irrigation readiness)\n"
            f"• Avoid heavy waterlogging windows for young saplings\n\n"
            "Live planting-window alerts use forecast APIs when enabled; until then treat this as guidance."
        )

    def _about_what_if(self) -> str:
        return (
            "**What-if scenarios**\n\n"
            "On the Analyze page, adjust rainfall (or related) scenarios to see directional changes "
            "in carbon, ROI, and climate risk. Lower rainfall usually stresses high-water monocultures "
            "more than deep-rooted mixed systems."
        )

    def _fallback(self) -> str:
        loc = getattr(self.land, "location", "your parcel")
        return (
            f"I'm the GreenVest land assistant for **{loc}**.\n\n"
            "Ask me about:\n"
            "• Why a strategy was recommended\n"
            "• GreenScore / land health\n"
            "• Trees, density & species\n"
            "• Carbon (indicative) & ROI / break-even\n"
            "• Cost breakdown\n"
            "• Climate risk & what-if scenarios\n\n"
            "Tip: run **Analyze** first so answers use your parcel’s results."
        )

    # ------------------------------------------------------------------
    # Optional Groq LLM
    # ------------------------------------------------------------------

    def _context_blob(self) -> str:
        parts = [
            f"Location: {self.land.location}",
            f"Area (ha): {self.land.area_hectares}",
            f"Soil: {getattr(self.land, 'soil_type', None)}",
            f"Water: {getattr(self.land, 'water_availability', None)}",
            f"Budget (INR): {getattr(self.land, 'budget', None)}",
            f"Horizon (years): {getattr(self.land, 'investment_horizon_years', None)}",
        ]
        if self.best:
            parts.append(f"Best strategy: {self.best.title} — {self.best.approach}")
            parts.append(f"Best ROI % (indicative): {getattr(self.best, 'expected_roi_percent', None)}")
            parts.append(f"Best risk level: {getattr(self.best, 'risk_level', None)}")
        if self.result and getattr(self.result, "strategies", None):
            titles = [s.title for s in self.result.strategies[:3]]
            parts.append("Top strategies: " + ", ".join(titles))
        return "\n".join(str(p) for p in parts if p is not None)

    def _groq_answer(self, question: str) -> Optional[str]:
        api_key = os.environ.get("GROQ_API_KEY", "").strip()
        if not api_key:
            return None
        try:
            from groq import Groq  # type: ignore
        except ImportError:
            return None

        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        system = (
            "You are GreenVest AI, a land intelligence assistant for India-focused "
            "plantation, carbon potential, and investment decision support. "
            "Be concise and practical. Never claim certified carbon credits or guaranteed ROI. "
            "Label uncertain numbers as estimates. If context is missing, say so.\n\n"
            f"Current parcel context:\n{self._context_blob()}"
        )
        try:
            client = Groq(api_key=api_key)
            res = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": question},
                ],
                temperature=0.3,
                max_tokens=700,
            )
            text = res.choices[0].message.content
            return (text or "").strip() or None
        except Exception:
            return None


# Convenience function used by tests / scripts
def answer_question(
    question: str,
    land: Optional[LandInput] = None,
    advisor_result: Optional[AdvisorResult] = None,
) -> str:
    return LandChatbot(land=land, advisor_result=advisor_result).answer(question)
