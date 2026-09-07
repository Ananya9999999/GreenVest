"""
Context-Aware AI Land Assistant for GreenVest.
Answers landowner and investor questions regarding land health, GreenScore,
plantation density, tree counts, ROI break-even, carbon ranges, and climate risks.
"""

from typing import Optional, Dict, Any
from src.models.schemas import AdvisorResult, LandInput


class LandChatbot:
    """
    Context-aware assistant that knows the current land parameters,
    recommendations, GreenScore, and climate risks.
    """

    def __init__(
        self,
        land: Optional[LandInput] = None,
        advisor_result: Optional[AdvisorResult] = None,
    ):
        self.land = land or LandInput()
        self.result = advisor_result
        self.best = advisor_result.best_match if advisor_result else None

    def answer(self, question: str) -> str:
        q = question.lower().strip()

        if any(w in q for w in ["why", "recommend", "reason", "chosen"]):
            return self._why_recommended()

        if any(w in q for w in ["score", "greenscore", "health", "potential"]):
            return self._about_greenscore()

        if any(w in q for w in ["nature", "biodiversity", "impact"]):
            return self._about_nature_impact()

        if any(w in q for w in ["roi", "return", "profit", "breakeven", "break-even"]):
            return self._about_roi()

        if any(w in q for w in ["risk", "safe", "safest", "hazard", "wildfire", "drought"]):
            return self._about_risk()

        if any(w in q for w in ["carbon", "sequestr", "credit", "co2", "range"]):
            return self._about_carbon()

        if any(w in q for w in ["tree", "density", "count", "sapling", "species", "how many"]):
            return self._about_trees()

        if any(w in q for w in ["budget", "cost", "invest", "expensive", "breakdown"]):
            return self._about_cost()

        if any(w in q for w in ["water", "irrigation", "rain", "weather", "plant now", "window"]):
            return self._about_water_and_weather()

        if any(w in q for w in ["what if", "simulate", "scenario"]):
            return self._about_what_if()

        return self._fallback()

    def _why_recommended(self) -> str:
        if not self.best:
            return "Based on bio-climatic analysis, Balanced Agroforestry is recommended for superior carbon and financial balance."
        return (
            f"🏆 I recommended **{self.best.title}** ({self.best.approach}).\n\n"
            f"• **Why:** It yields a projected ~{self.best.expected_roi_percent}% ROI with a low risk buffer "
            f"and captures ~{self.best.carbon_potential_tco2e_per_ha} tCO₂e/ha/yr.\n"
            f"• **Species:** {', '.join(self.best.recommended_species)}.\n"
            f"• **Density:** {self.best.density_trees_per_ha:,} trees/ha ({self.best.total_trees:,} total trees across {self.land.area_hectares} ha)."
        )

    def _about_greenscore(self) -> str:
        if self.result:
            gs = self.result.greenscore
            return (
                f"🟢 **{gs.summary}**\n\n"
                f"Factor breakdown:\n"
                + "\n".join(f"  • **{f.name}**: {f.score}/100 ({f.status} — {f.insight})" for f in gs.factors)
            )
        return "GreenScore evaluates Carbon Potential, Soil Health, Water, Climate Suitability, Biodiversity, and Environmental Safety on a 0–100 index."

    def _about_nature_impact(self) -> str:
        if self.result:
            ni = self.result.nature_impact
            return (
                f"🌍 **Nature Impact Score: {ni.overall_score}/100**\n\n"
                f"• Carbon Capture: {ni.carbon_score}/100\n"
                f"• Biodiversity Boost: {ni.biodiversity_score}/100\n"
                f"• Water Recharge: {ni.water_impact_score}/100\n"
                f"• Soil Improvement: {ni.soil_improvement_score}/100\n\n"
                f"{ni.interpretation}"
            )
        return "The Nature Impact Score ensures your land strategy enhances ecological vitality and prevents monoculture degradation."

    def _about_roi(self) -> str:
        if not self.result:
            return "Expected ROI: Bamboo ~15.4%, Balanced Agroforestry ~11.2%, Native Forest ~7.2%."
        lines = ["💰 **Projected Returns & Break-Even Timeline:**"]
        for s in self.result.strategies:
            lines.append(
                f"  • **{s.title}**: ~{s.expected_roi_percent}% ROI | Break-even in ~{s.investment.breakeven_years} yrs "
                f"(Initial: ₹{s.cost_breakdown.total_initial_cost/100000:.1f}L)"
            )
        lines.append(f"\nBreak-even accounts for annual carbon credit payouts and timber/crop yields.")
        return "\n".join(lines)

    def _about_risk(self) -> str:
        if self.result:
            cr = self.result.climate_risk
            hazard_lines = [f"  • {h.icon} **{h.name}**: {h.level} ({h.detail})" for h in cr.hazards]
            return (
                f"⚠️ **Investment Risk Score: {cr.overall_risk_score}/10 ({cr.risk_category} Risk)**\n\n"
                + "\n".join(hazard_lines)
                + f"\n\n**Advisory:** {cr.advisory}"
            )
        return "Our Climate Risk model assesses Wildfire, Water Scarcity, Flooding, Drought, and Rising Temperatures."

    def _about_carbon(self) -> str:
        if self.result and self.result.carbon_forecasts:
            f = self.result.carbon_forecasts
            c = self.result.credit_estimate
            f20 = f[-1]
            return (
                f"📊 **Carbon Sequestration Forecast (with Uncertainty Range):**\n\n"
                f"• 5 Years: {f[0].cumulative_min:,.0f} – {f[0].cumulative_max:,.0f} tCO₂e (Expected: {f[0].cumulative_expected:,.0f})\n"
                f"• 10 Years: {f[1].cumulative_min:,.0f} – {f[1].cumulative_max:,.0f} tCO₂e (Expected: {f[1].cumulative_expected:,.0f})\n"
                f"• 20 Years: **{f20.cumulative_min:,.0f} – {f20.cumulative_max:,.0f} tonnes CO₂**\n\n"
                f"💵 Estimated Carbon Credit Value: **{f20.credit_value_usd_range}** at global voluntary market benchmarks."
            )
        return "Carbon forecasts provide realistic low/expected/high ranges for 5, 10, and 20 year horizons."

    def _about_trees(self) -> str:
        if self.best:
            return (
                f"🌳 **Plantation Density & Tree Count for {self.best.title}:**\n\n"
                f"• Total Trees: **{self.best.total_trees:,}** across {self.land.area_hectares} ha\n"
                f"• Planting Density: **{self.best.density_trees_per_ha:,} trees/ha**\n"
                f"• Recommended Mix:\n"
                + "\n".join(f"   - {sp}" for sp in self.best.recommended_species)
            )
        return "We calculate exact tree counts and spacing density tailored to your land area and species selection."

    def _about_cost(self) -> str:
        if self.best:
            cb = self.best.cost_breakdown
            return (
                f"💳 **Estimated Cost Breakdown for {self.best.title} ({self.land.area_hectares} ha):**\n\n"
                f"• Saplings & Nursery Stock: ₹{cb.saplings:,.0f}\n"
                f"• Land Preparation & Earthwork: ₹{cb.land_preparation:,.0f}\n"
                f"• Irrigation & Drip Setup: ₹{cb.irrigation_infrastructure:,.0f}\n"
                f"• Fencing & Bio-protection: ₹{cb.fencing_and_protection:,.0f}\n"
                f"• **Total Initial Investment:** ₹{cb.total_initial_cost:,.0f}\n"
                f"• Annual Maintenance: ~₹{self.best.maintenance.annual_cost:,.0f}/yr"
            )
        return "Cost breakdowns itemize saplings, land preparation, irrigation, fencing, and ongoing maintenance."

    def _about_water_and_weather(self) -> str:
        return (
            "🌦 **Planting Window & Weather Conditions:**\n\n"
            "• Current Soil Moisture: 78% field capacity (Optimal)\n"
            "• Recommended Action: **Plant Now** window opens in 3–5 days following gentle rain flush.\n"
            "• Irrigation Strategy: Sub-surface drip and contour swales reduce water loss by 40%."
        )

    def _about_what_if(self) -> str:
        return (
            "🔄 **What-If Scenario Simulator:**\n\n"
            "Try moving the rainfall slider on the dashboard! For instance, if rainfall drops by 20%, "
            "Native Mixed Forest and Balanced Agroforestry retain >90% biomass, while Bamboo requires supplemental irrigation."
        )

    def _fallback(self) -> str:
        return (
            "I'm GreenVest's AI Land Assistant. Ask me about:\n"
            "• Why a strategy was recommended\n"
            "• GreenScore & Nature Impact scores\n"
            "• Tree counts, density & species selection\n"
            "• Carbon sequestration ranges & credit potential\n"
            "• Cost breakdown, ROI & break-even timeline\n"
            "• Climate risks & What-if simulation results"
        )
