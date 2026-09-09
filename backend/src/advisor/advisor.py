"""
AI Land Advisor — generates top 3 plantation strategies, Smart Land Analysis,
GreenScore, Nature Impact Score, and comparative metrics for a given land parcel.
"""

from typing import List, Optional
from src.models.schemas import (
    LandInput,
    PreferenceWeights,
    StrategyType,
    StrategyScores,
    StrategyRecommendation,
    CostBreakdown,
    MaintenanceSchedule,
    InvestmentMetrics,
    SmartLandAnalysis,
    GreenScore,
    GreenScoreFactor,
    NatureImpactScore,
    ClimateRiskAnalysis,
    ClimateRiskHazard,
    ComparisonMetricRow,
    StrategyComparisonEngine,
    AdvisorResult,
    HealthScoreV2Factor,
    HealthScoreV2Breakdown,
    GeospatialEnrichResponse,
)
from src.ranker.ranker import rank_strategies
from src.carbon.forecaster import forecast_sequestration, estimate_credits
from src.climate.risk_analyzer import analyze_climate_risk


# Base templates for the 3 distinct investment strategies
STRATEGY_TEMPLATES = {
    StrategyType.MAX_CARBON: {
        "title": "Maximum Carbon",
        "approach": "Native mixed forest restoration",
        "species": ["Native hardwoods (Neem, Teak, Terminalia)", "Clumping bamboo (B. tulda)", "Nitrogen-fixing trees (Pongamia, Albizia)"],
        "density_per_ha": 1600,
        "cost_per_ha": 175000.0,  # ₹1.75L/ha
        "cost_weights": {"saplings": 0.35, "prep": 0.25, "irrigation": 0.20, "fencing": 0.20},
        "annual_maintenance_per_ha": 14000.0,
        "scores": StrategyScores(carbon=9.6, roi=4.5, risk=2.8, biodiversity=9.4, water_efficiency=7.5),
        "carbon_potential_tco2e_per_ha": 12.0,
        "harvest_rev_annual_per_ha": 18000.0,  # Sustainable non-timber forest produce
        "risk_level": "Low",
        "roi_percent": 7.2,
        "breakeven_years": 6.2,
        "maintenance_schedule": {
            "irrigation": "Initial 2 years dry-season drip; rainfed naturalized thereafter",
            "weeding": "Semi-annual mulch weeding and bio-strip ring management",
            "soil": "Organic mycorrhizal inoculation & nitrogen-fixing leaf litter fall",
        },
        "comparison_stars": {"carbon": "⭐⭐⭐⭐⭐", "roi": "⭐⭐", "risk": "Low", "biodiversity": "⭐⭐⭐⭐⭐", "water": "Medium"},
    },
    StrategyType.MAX_ROI: {
        "title": "Maximum ROI",
        "approach": "Commercial high-yield bamboo plantation",
        "species": ["Dendrocalamus strictus (Solid bamboo)", "Bambusa balcooa (Timber bamboo)", "High-value companion intercrops (Turmeric/Ginger)"],
        "density_per_ha": 1200,
        "cost_per_ha": 230000.0,  # ₹2.30L/ha
        "cost_weights": {"saplings": 0.38, "prep": 0.22, "irrigation": 0.25, "fencing": 0.15},
        "annual_maintenance_per_ha": 22000.0,
        "scores": StrategyScores(carbon=6.5, roi=9.4, risk=5.2, biodiversity=4.5, water_efficiency=5.5),
        "carbon_potential_tco2e_per_ha": 7.5,
        "harvest_rev_annual_per_ha": 68000.0,  # Rapid culm thinning from year 4 + intercrops
        "risk_level": "Medium",
        "roi_percent": 15.4,
        "breakeven_years": 3.8,
        "maintenance_schedule": {
            "irrigation": "Sub-surface drip system with automated soil sensor fertigation",
            "weeding": "Selective clump grooming, annual thinning of mature culms",
            "soil": "Compost dressing and potassium enrichment every pre-monsoon",
        },
        "comparison_stars": {"carbon": "⭐⭐⭐⭐", "roi": "⭐⭐⭐⭐⭐", "risk": "Medium", "biodiversity": "⭐⭐", "water": "High"},
    },
    StrategyType.BALANCED: {
        "title": "Balanced",
        "approach": "Agroforestry (Carbon + ROI + Biodiversity)",
        "species": ["Teak & Mahogany border shelterbelts", "Fruit & cash trees (Amla, Moringa, Guava)", "Understory legumes & stylo fodder grass"],
        "density_per_ha": 950,
        "cost_per_ha": 195000.0,  # ₹1.95L/ha
        "cost_weights": {"saplings": 0.34, "prep": 0.24, "irrigation": 0.22, "fencing": 0.20},
        "annual_maintenance_per_ha": 18000.0,
        "scores": StrategyScores(carbon=8.2, roi=7.8, risk=3.4, biodiversity=8.0, water_efficiency=7.0),
        "carbon_potential_tco2e_per_ha": 9.8,
        "harvest_rev_annual_per_ha": 42000.0,  # Seasonal fruit/seed sales + long term timber
        "risk_level": "Low",
        "roi_percent": 11.2,
        "breakeven_years": 4.6,
        "maintenance_schedule": {
            "irrigation": "Precision micro-sprinklers for fruit canopy, trench infiltration for timber",
            "weeding": "Rotational inter-row pruning and alley cropping management",
            "soil": "Legume green-manuring cycles to regenerate topsoil vitality",
        },
        "comparison_stars": {"carbon": "⭐⭐⭐⭐", "roi": "⭐⭐⭐⭐", "risk": "Low", "biodiversity": "⭐⭐⭐⭐", "water": "Medium"},
    },
}


def generate_smart_land_analysis(land: LandInput) -> SmartLandAnalysis:
    """Generates detailed bio-climatic and soil diagnostics."""
    loc = land.location.lower()
    soil = (land.soil_type or "Black soil").lower()
    water = (land.water_availability or "Moderate").lower()

    if "coimbatore" in loc or "tamil" in loc:
        climate = "Semi-Arid Rain Shadow (Tamil Nadu Uplands)"
        rainfall = 680.0
        seasonality = "NE Monsoon (Oct–Dec) dominant, secondary SW showers"
        temp = "19°C – 36°C"
        avg_temp = 27.5
    elif "pune" in loc or "nashik" in loc or "maharashtra" in loc:
        climate = "Tropical Wet-and-Dry / Semi-Arid Deccan"
        rainfall = 750.0
        seasonality = "SW Monsoon (June–September) intense flush"
        temp = "13°C – 39°C"
        avg_temp = 26.2
    elif "indore" in loc or "madhya" in loc:
        climate = "Sub-Tropical Malwa Plateau"
        rainfall = 920.0
        seasonality = "SW Monsoon (July–August) peak precipitation"
        temp = "11°C – 41°C"
        avg_temp = 25.8
    else:
        climate = "Tropical Monsoon Agro-Ecological Zone"
        rainfall = 850.0
        seasonality = "Monsoon concentrated across 4 months"
        temp = "16°C – 38°C"
        avg_temp = 26.8

    if "black" in soil:
        suitability = "High water-retention Vertisol. Exceptional for deep-rooting native timber, bamboo, and pulses."
        fertility = 82.0
        ph = 7.4
    elif "red" in soil:
        suitability = "Porous Alfisol with good root penetration. Suitable for agroforestry, fruit trees, and hardy timbers."
        fertility = 74.0
        ph = 6.6
    elif "alluvial" in soil:
        suitability = "Rich nutrient-dense sediment. High growth potential for fast-rotation commercial bamboo and agroforestry."
        fertility = 88.0
        ph = 7.1
    else:
        suitability = "Moderately fertile loamy soil. Benefits from nitrogen-fixing nurse species and mulching."
        fertility = 72.0
        ph = 6.8

    if "abundant" in water or "canal" in water:
        water_level = "Abundant (Canal & High Perennial Surface Water)"
        gw_depth = 7.5
    elif "rainfed" in water or "low" in water:
        water_level = "Rainfed Dependent (Seasonal Runoff Capture Essential)"
        gw_depth = 24.0
    else:
        water_level = "Moderate (Borewell & Seasonal Aquifer Recharge)"
        gw_depth = 14.2

    overview = (
        f"{land.location} presents an agro-climatic profile characterized by {climate.lower()} "
        f"with ~{rainfall:.0f} mm annual rainfall. The predominant {soil} offers {suitability.lower()} "
        f"Water availability is categorized as {water_level.lower()}."
    )

    return SmartLandAnalysis(
        climate_type=climate,
        annual_rainfall_mm=rainfall,
        rainfall_seasonality=seasonality,
        temperature_range_celsius=temp,
        avg_annual_temp_celsius=avg_temp,
        soil_suitability=suitability,
        soil_fertility_index=fertility,
        soil_ph=ph,
        water_availability_level=water_level,
        groundwater_table_depth_m=gw_depth,
        overview_text=overview,
    )


def compute_greenscore(land: LandInput, smart: SmartLandAnalysis, risk_score: float) -> GreenScore:
    """Computes the signature 0-100 GreenScore and individual factor breakdown."""
    carbon_pot = min(98.0, max(50.0, 70.0 + (land.area_hectares * 0.5) + (smart.soil_fertility_index * 0.2)))
    soil_health = smart.soil_fertility_index
    
    if "abundant" in smart.water_availability_level.lower():
        water_score = 92.0
    elif "moderate" in smart.water_availability_level.lower():
        water_score = 76.0
    else:
        water_score = 58.0

    climate_suit = min(95.0, max(55.0, 60.0 + (smart.annual_rainfall_mm / 25.0)))
    biodiversity = min(95.0, max(50.0, 65.0 + (land.vegetation_score or 75.0) * 0.25))
    env_safety = max(20.0, 100.0 - (risk_score * 9.0))

    factors = [
        GreenScoreFactor(name="Carbon Potential", score=round(carbon_pot, 1), weight=0.25, status="Optimal", insight="High biomass growth headroom"),
        GreenScoreFactor(name="Soil Health", score=round(soil_health, 1), weight=0.20, status="Good", insight=f"pH {smart.soil_ph:.1f} with active organic horizon"),
        GreenScoreFactor(name="Water Availability", score=round(water_score, 1), weight=0.20, status="Stable", insight=smart.water_availability_level),
        GreenScoreFactor(name="Climate Suitability", score=round(climate_suit, 1), weight=0.15, status="Favorable", insight=f"~{smart.annual_rainfall_mm:.0f} mm precipitation"),
        GreenScoreFactor(name="Biodiversity Potential", score=round(biodiversity, 1), weight=0.10, status="High", insight="Strong pollinator and canopy habitat capacity"),
        GreenScoreFactor(name="Environmental Safety", score=round(env_safety, 1), weight=0.10, status="Controlled", insight=f"Risk buffer index {env_safety:.0f}/100"),
    ]

    overall = sum(f.score * f.weight for f in factors)
    overall_int = int(round(overall))

    if overall_int >= 80:
        tier = "High Potential"
    elif overall_int >= 70:
        tier = "Prime Sustainable"
    elif overall_int >= 55:
        tier = "Moderate Potential"
    else:
        tier = "Marginal Potential"

    summary = f"GreenScore: {overall_int}/100 — {tier}"

    return GreenScore(
        overall_score=overall_int,
        tier=tier,
        factors=factors,
        summary=summary,
    )


def compute_nature_impact_score(land: LandInput, greenscore: GreenScore) -> NatureImpactScore:
    """Computes the Nature Impact Score (0-100) ensuring balanced ecological integrity."""
    factor_map = {f.name: f.score for f in greenscore.factors}
    carbon = factor_map.get("Carbon Potential", 80.0)
    biodiversity = factor_map.get("Biodiversity Potential", 82.0)
    water_impact = factor_map.get("Water Availability", 76.0)
    soil_imp = factor_map.get("Soil Health", 80.0)

    # Holistic composite avoiding monoculture bias
    nature_impact = int(round(carbon * 0.30 + biodiversity * 0.30 + water_impact * 0.20 + soil_imp * 0.20))

    interpretation = (
        "High nature-positive balance. The proposed planting frameworks actively regenerate "
        "micro-watershed moisture retention and pollinator biodiversity rather than degrading topsoil."
    )

    return NatureImpactScore(
        overall_score=nature_impact,
        carbon_score=round(carbon, 1),
        biodiversity_score=round(biodiversity, 1),
        water_impact_score=round(water_impact, 1),
        soil_improvement_score=round(soil_imp, 1),
        interpretation=interpretation,
    )


def _build_strategy(
    strategy_type: StrategyType,
    land: LandInput,
) -> StrategyRecommendation:
    t = STRATEGY_TEMPLATES[strategy_type]
    area = land.area_hectares
    health_factor = 0.85 + (land.health_score / 100.0) * 0.30

    density = t["density_per_ha"]
    total_trees = int(round(density * area))

    total_initial = round(t["cost_per_ha"] * area * health_factor, 0)
    weights = t["cost_weights"]
    breakdown = CostBreakdown(
        saplings=round(total_initial * weights["saplings"], 0),
        land_preparation=round(total_initial * weights["prep"], 0),
        irrigation_infrastructure=round(total_initial * weights["irrigation"], 0),
        fencing_and_protection=round(total_initial * weights["fencing"], 0),
        total_initial_cost=total_initial,
    )

    annual_maint = round(t["annual_maintenance_per_ha"] * area, 0)
    m_info = t["maintenance_schedule"]
    maintenance = MaintenanceSchedule(
        annual_cost=annual_maint,
        irrigation_frequency=m_info["irrigation"],
        weeding_and_pruning=m_info["weeding"],
        soil_enrichment=m_info["soil"],
    )

    # 20-year financial metrics
    cum_maint_20y = annual_maint * 20.0
    annual_harvest = round(t["harvest_rev_annual_per_ha"] * area, 0)
    # Carbon credit revenue ~ $15/tCO2e -> ₹1250/tCO2e
    annual_carbon_rev = round(t["carbon_potential_tco2e_per_ha"] * area * 1250.0, 0)

    total_gross_returns_20y = (annual_harvest * 16.0) + (annual_carbon_rev * 18.0)
    net_profit = total_gross_returns_20y - (total_initial + cum_maint_20y)
    roi_pct = round(max(5.0, (net_profit / (total_initial + cum_maint_20y)) * 100.0 / 20.0), 1)

    investment = InvestmentMetrics(
        initial_cost=total_initial,
        cumulative_maintenance_20y=cum_maint_20y,
        carbon_revenue_annual_avg=annual_carbon_rev,
        harvest_revenue_annual_avg=annual_harvest,
        total_projected_returns=total_gross_returns_20y,
        roi_percent=t["roi_percent"],
        breakeven_years=t["breakeven_years"],
    )

    # --- Elaborate area allocation & cashflow narrative ---
    allocations, detailed_plan, short_term, long_term = _generate_area_allocations(
        strategy_type, land, t
    )

    return StrategyRecommendation(
        strategy_type=strategy_type,
        title=t["title"],
        approach=t["approach"],
        recommended_species=t["species"],
        density_trees_per_ha=density,
        total_trees=total_trees,
        scores=t["scores"],
        carbon_potential_tco2e_per_ha=t["carbon_potential_tco2e_per_ha"],
        cost_breakdown=breakdown,
        maintenance=maintenance,
        investment=investment,
        estimated_investment=total_initial,
        expected_roi_percent=t["roi_percent"],
        risk_level=t["risk_level"],
        area_allocations=allocations,
        detailed_plan=detailed_plan,
        short_term_income=short_term,
        long_term_upside=long_term,
    )


def _generate_area_allocations(
    strategy_type: StrategyType,
    land: LandInput,
    template: dict,
) -> tuple:
    """
    Produce concrete area splits so the user sees e.g.
    'Plant maize + lablab on 1 acre for 4-month cash cycles;
     timber on remaining 4 acres for 15-20 yr capital gain.'
    """
    area_ha = max(0.1, land.area_hectares)
    budget = land.budget or 500000.0
    horizon = land.investment_horizon_years or 15
    soil = (land.soil_type or "Black soil").lower()
    water = (land.water_availability or "Moderate").lower()

    # Convert to acres for more intuitive Indian landowner messaging (1 ha ≈ 2.47 acre)
    area_acre = round(area_ha * 2.471, 1)

    if strategy_type == StrategyType.MAX_ROI:
        # Prioritise short-cycle cash + high-yield bamboo
        short_frac = 0.25 if area_ha > 1.5 else 0.35
        short_ha = round(area_ha * short_frac, 2)
        bamboo_ha = round(area_ha - short_ha, 2)
        allocations = [
            {
                "crop_or_species": "Maize + Lablab (or Turmeric/Ginger intercrop)",
                "area_hectares": short_ha,
                "area_acres": round(short_ha * 2.471, 1),
                "area_percent": round(short_frac * 100, 0),
                "purpose": "Short-cycle cash flow",
                "expected_cashflow_cycle": "Every 3–4 months (grain + fodder/legume)",
                "notes": "Provides working capital while bamboo establishes.",
            },
            {
                "crop_or_species": "Dendrocalamus strictus / Bambusa balcooa (commercial bamboo)",
                "area_hectares": bamboo_ha,
                "area_acres": round(bamboo_ha * 2.471, 1),
                "area_percent": round((1 - short_frac) * 100, 0),
                "purpose": "High annual harvest revenue from year 4",
                "expected_cashflow_cycle": "Annual culm thinning + intercrop from year 3–4",
                "notes": "Primary ROI engine; culms sold for scaffolding, paper, charcoal.",
            },
        ]
        detailed = (
            f"On your {area_acre} acres ({area_ha} ha) with ~₹{budget:,.0f} budget: "
            f"allocate ~{allocations[0]['area_acres']} acres to short-cycle maize + lablab "
            f"(or turmeric/ginger) for income every 3–4 months. Plant commercial bamboo on the remaining "
            f"{allocations[1]['area_acres']} acres. This mix meets frequent cash needs while building "
            f"a high-yield perennial asset that starts generating strong annual returns from year 4."
        )
        short_term = f"Expect first cash from intercrops within 3–4 months on the {allocations[0]['area_acres']}-acre block."
        long_term = f"Bamboo block becomes the main profit centre from year 4; cumulative ROI targets {template['roi_percent']}% with breakeven ~{template['breakeven_years']} years."

    elif strategy_type == StrategyType.MAX_CARBON:
        # Heavy on permanent native forest, small nurse/legume strip
        nurse_frac = 0.15
        nurse_ha = round(area_ha * nurse_frac, 2)
        forest_ha = round(area_ha - nurse_ha, 2)
        allocations = [
            {
                "crop_or_species": "Nitrogen-fixing nurse + understory legumes (Pongamia, Albizia, Stylo)",
                "area_hectares": nurse_ha,
                "area_acres": round(nurse_ha * 2.471, 1),
                "area_percent": round(nurse_frac * 100, 0),
                "purpose": "Soil building + early biomass",
                "expected_cashflow_cycle": "Limited; primarily ecological function + possible seed/NTFP later",
                "notes": "Accelerates soil organic carbon and supports hardwood establishment.",
            },
            {
                "crop_or_species": "Native hardwood mix (Teak, Neem, Terminalia) + clumping bamboo",
                "area_hectares": forest_ha,
                "area_acres": round(forest_ha * 2.471, 1),
                "area_percent": round((1 - nurse_frac) * 100, 0),
                "purpose": "Maximum permanent carbon sequestration + biodiversity",
                "expected_cashflow_cycle": "Carbon credits from year 5–7; selective NTFP / thinning later",
                "notes": "Designed for long-horizon climate + legacy value.",
            },
        ]
        detailed = (
            f"For maximum carbon on {area_acre} acres: dedicate ~{allocations[1]['area_acres']} acres to a dense native "
            f"hardwood + bamboo canopy (Teak/Neem/Terminalia + B. tulda). Use the remaining "
            f"{allocations[0]['area_acres']} acres as a nitrogen-fixing nurse strip to build soil quickly. "
            f"This configuration maximises tCO2e/ha while still allowing limited early biomass income."
        )
        short_term = "Early years focus on establishment; limited cash until carbon credit eligibility (~year 5)."
        long_term = f"Highest permanent carbon stock and biodiversity score; ROI is secondary but still positive at ~{template['roi_percent']}% with strong climate-asset upside."

    else:  # BALANCED
        # Classic agroforestry: fruit/cash + timber + understory
        cash_frac = 0.30
        timber_frac = 0.50
        under_frac = 0.20
        cash_ha = round(area_ha * cash_frac, 2)
        timber_ha = round(area_ha * timber_frac, 2)
        under_ha = round(area_ha - cash_ha - timber_ha, 2)
        allocations = [
            {
                "crop_or_species": "Fruit & cash trees (Amla, Moringa, Guava) + seasonal legumes",
                "area_hectares": cash_ha,
                "area_acres": round(cash_ha * 2.471, 1),
                "area_percent": round(cash_frac * 100, 0),
                "purpose": "Regular seasonal income",
                "expected_cashflow_cycle": "Every 4–6 months once trees mature (year 2–3 onward)",
                "notes": "Provides the 'frequent money' stream the user often seeks.",
            },
            {
                "crop_or_species": "Timber shelterbelts (Teak, Mahogany) + border bamboo",
                "area_hectares": timber_ha,
                "area_acres": round(timber_ha * 2.471, 1),
                "area_percent": round(timber_frac * 100, 0),
                "purpose": "Long-term capital appreciation + windbreak",
                "expected_cashflow_cycle": "Major harvest year 12–20; intermediate thinning possible",
                "notes": "The 'hefty money after 10–20 yrs' component.",
            },
            {
                "crop_or_species": "Understory legumes / stylo fodder + soil-building cover",
                "area_hectares": under_ha,
                "area_acres": round(under_ha * 2.471, 1),
                "area_percent": round(under_frac * 100, 0),
                "purpose": "Soil regeneration + minor fodder income",
                "expected_cashflow_cycle": "Seasonal cut-and-carry fodder",
                "notes": "Improves overall system resilience and fertility.",
            },
        ]
        detailed = (
            f"Balanced plan for {area_acre} acres and ~₹{budget:,.0f} budget aimed at both frequent income and long-term wealth: "
            f"• {allocations[0]['area_acres']} acres → Amla/Moringa/Guava + legumes for cash every 4–6 months after year 2. "
            f"• {allocations[1]['area_acres']} acres → Teak/Mahogany timber + bamboo borders for major capital gain in 12–20 years. "
            f"• {allocations[2]['area_acres']} acres → understory legumes/fodder to keep soil healthy and add minor seasonal income. "
            f"This allocation directly answers the classic 'money every 4 months + hefty long-term investment' requirement while matching local soil ({soil}) and water ({water}) conditions."
        )
        short_term = f"First meaningful cash expected from the fruit/cash block within 18–30 months; legumes can give earlier minor returns."
        long_term = f"Timber block delivers the bulk of terminal value around year {horizon}; overall ROI target ~{template['roi_percent']}% with balanced risk."

    return allocations, detailed, short_term, long_term


def build_comparison_matrix(strategies: List[StrategyRecommendation], best: StrategyRecommendation) -> StrategyComparisonEngine:
    """Builds side-by-side comparison table."""
    strat_map = {s.strategy_type: s for s in strategies}
    s_carbon = strat_map.get(StrategyType.MAX_CARBON)
    s_roi = strat_map.get(StrategyType.MAX_ROI)
    s_bal = strat_map.get(StrategyType.BALANCED)

    c_stars = STRATEGY_TEMPLATES[StrategyType.MAX_CARBON]["comparison_stars"]
    r_stars = STRATEGY_TEMPLATES[StrategyType.MAX_ROI]["comparison_stars"]
    b_stars = STRATEGY_TEMPLATES[StrategyType.BALANCED]["comparison_stars"]

    rows = [
        ComparisonMetricRow(
            metric="Carbon Sequestration",
            native_forest=c_stars["carbon"],
            bamboo=r_stars["carbon"],
            agroforestry=b_stars["carbon"],
        ),
        ComparisonMetricRow(
            metric="Financial ROI",
            native_forest=c_stars["roi"],
            bamboo=r_stars["roi"],
            agroforestry=b_stars["roi"],
        ),
        ComparisonMetricRow(
            metric="Climate Risk Profile",
            native_forest=c_stars["risk"],
            bamboo=r_stars["risk"],
            agroforestry=b_stars["risk"],
        ),
        ComparisonMetricRow(
            metric="Biodiversity Value",
            native_forest=c_stars["biodiversity"],
            bamboo=r_stars["biodiversity"],
            agroforestry=b_stars["biodiversity"],
        ),
        ComparisonMetricRow(
            metric="Water Requirement",
            native_forest=c_stars["water"],
            bamboo=r_stars["water"],
            agroforestry=b_stars["water"],
        ),
        ComparisonMetricRow(
            metric="Plantation Density",
            native_forest=f"{s_carbon.density_trees_per_ha:,} trees/ha" if s_carbon else "1,600 trees/ha",
            bamboo=f"{s_roi.density_trees_per_ha:,} clumps/ha" if s_roi else "1,200 clumps/ha",
            agroforestry=f"{s_bal.density_trees_per_ha:,} trees/ha" if s_bal else "950 trees/ha",
        ),
        ComparisonMetricRow(
            metric="Initial Investment",
            native_forest=f"₹{s_carbon.estimated_investment/100000:.1f}L" if s_carbon else "₹2.2L",
            bamboo=f"₹{s_roi.estimated_investment/100000:.1f}L" if s_roi else "₹2.9L",
            agroforestry=f"₹{s_bal.estimated_investment/100000:.1f}L" if s_bal else "₹2.4L",
        ),
        ComparisonMetricRow(
            metric="Break-Even Period",
            native_forest="6.2 Years",
            bamboo="3.8 Years",
            agroforestry="4.6 Years",
        ),
    ]

    rationale = (
        f"🏆 **AI Recommended Strategy: {best.title}** ({best.approach})\n\n"
        f"Selected as the top fit because it optimizes your priority allocation "
        f"while maintaining a resilient risk buffer ({best.risk_level} risk) and strong ecological co-benefits."
    )

    return StrategyComparisonEngine(
        matrix=rows,
        ai_recommended_strategy=best.title,
        recommendation_rationale=rationale,
    )


def recommend(
    land: LandInput,
    weights: PreferenceWeights,
) -> AdvisorResult:
    """
    Main entry point for GreenVest Land Advisor.
    Returns ranked top-3 strategies + smart land diagnostics + GreenScore +
    Nature Impact Score + carbon forecasts with ranges + climate risk analysis + comparison.
    """
    # 1. Smart Land Analysis
    smart = generate_smart_land_analysis(land)

    # 2. Climate Risk Analysis
    risk_data = analyze_climate_risk(
        location=land.location,
        soil_type=land.soil_type,
        water_availability=land.water_availability,
        base_climate_risk=land.climate_risk,
    )
    hazards = [ClimateRiskHazard(**h) for h in risk_data["hazards"]]
    climate_risk = ClimateRiskAnalysis(
        overall_risk_score=risk_data["overall_risk_score"],
        risk_category=risk_data["risk_category"],
        hazards=hazards,
        advisory=risk_data["advisory"],
    )

    # 3. GreenScore
    greenscore = compute_greenscore(land, smart, climate_risk.overall_risk_score)

    # 4. Land Health Score v2 (Multi-factor explainable pedology & proximity engine)
    from src.scoring.health_scorer_v2 import calculate_land_health_score_v2
    health_v2_raw = calculate_land_health_score_v2(
        soil_type=land.soil_type or "Black Vertisol",
        soil_ph=getattr(land, "soil_ph", 7.4) or 7.4,
        organic_carbon_pct=getattr(land, "organic_carbon_pct", 0.85) or 0.85,
        water_availability=land.water_availability or "Moderate",
        climate_risk_score=climate_risk.overall_risk_score,
        distance_to_road_km=getattr(land, "distance_to_road_km", 1.0) or 1.0,
        distance_to_market_km=getattr(land, "distance_to_market_km", 6.0) or 6.0,
        vegetation_score=land.vegetation_score or 75.0,
    )
    health_score_v2 = HealthScoreV2Breakdown(
        land_health_score=health_v2_raw["land_health_score"],
        grade=health_v2_raw["grade"],
        verdict=health_v2_raw["verdict"],
        factors=[HealthScoreV2Factor(**f) for f in health_v2_raw["factors"]],
        soil_score=health_v2_raw["soil_score"],
        water_score=health_v2_raw["water_score"],
        climate_score=health_v2_raw["climate_score"],
        proximity_score=health_v2_raw["proximity_score"],
        vegetation_score=health_v2_raw["vegetation_score"],
    )

    # 5. Nature Impact Score
    nature_impact = compute_nature_impact_score(land, greenscore)

    # 5. Build Top 3 Strategies (rule-based with elaborate area allocations)
    strategies = [
        _build_strategy(StrategyType.MAX_CARBON, land),
        _build_strategy(StrategyType.MAX_ROI, land),
        _build_strategy(StrategyType.BALANCED, land),
    ]

    # 5b. Optional Grok refinement — richer, context-aware plans when XAI_API_KEY is set
    try:
        from src.services.grok_advisor import refine_strategies_with_grok
        base_for_grok = [
            {
                "strategy_type": s.strategy_type.value,
                "title": s.title,
                "approach": s.approach,
                "species": s.recommended_species,
                "area_allocations": s.area_allocations,
                "detailed_plan": s.detailed_plan,
            }
            for s in strategies
        ]
        grok_enhanced = refine_strategies_with_grok(land, weights, base_for_grok)
        if grok_enhanced:
            type_map = {s.strategy_type.value: s for s in strategies}
            for g in grok_enhanced:
                st = g.get("strategy_type")
                if st in type_map:
                    target = type_map[st]
                    if g.get("area_allocations"):
                        target.area_allocations = g["area_allocations"]
                    if g.get("detailed_plan"):
                        target.detailed_plan = g["detailed_plan"]
                    if g.get("short_term_income"):
                        target.short_term_income = g["short_term_income"]
                    if g.get("long_term_upside"):
                        target.long_term_upside = g["long_term_upside"]
                    if g.get("ai_recommendation_reason"):
                        target.ai_recommendation_reason = g["ai_recommendation_reason"]
                    if g.get("recommended_species"):
                        target.recommended_species = g["recommended_species"]
                    if g.get("title"):
                        target.title = g["title"]
                    if g.get("approach"):
                        target.approach = g["approach"]
    except Exception:
        pass  # Never break the pipeline for optional AI enhancement

    # 6. Rank Strategies
    ranked = rank_strategies(strategies, weights)
    best = ranked[0]

    # Assign reason to best (if Grok did not already set a richer one)
    if not best.ai_recommendation_reason or "Ranked #1" in (best.ai_recommendation_reason or ""):
        best.ai_recommendation_reason = (
            f"Ranked #1 for your profile. Combines {best.approach} with projected {best.expected_roi_percent}% ROI "
            f"and {best.carbon_potential_tco2e_per_ha} tCO₂e/ha/yr carbon sequestration."
        )

    # 7. Carbon forecast with ranges
    forecasts = forecast_sequestration(
        strategy_type=best.strategy_type,
        area_hectares=land.area_hectares,
        years=[5, 10, 20],
        health_score=greenscore.overall_score,
    )
    credit = estimate_credits(forecasts[-1].cumulative_expected)

    # 8. Strategy Comparison Matrix
    comparison = build_comparison_matrix(ranked, best)

    return AdvisorResult(
        land_id=land.land_id,
        smart_land=smart,
        greenscore=greenscore,
        health_score_v2=health_score_v2,
        geospatial_enrichment=getattr(land, "_geospatial_enrichment", None),
        nature_impact=nature_impact,
        strategies=ranked,
        carbon_forecasts=forecasts,
        credit_estimate=credit,
        climate_risk=climate_risk,
        comparison=comparison,
        best_match=best,
    )
