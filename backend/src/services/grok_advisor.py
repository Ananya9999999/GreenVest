"""
Optional Grok-powered strategy refinement for GreenVest.
Calls xAI Grok API (OpenAI-compatible) when XAI_API_KEY is set.
Falls back silently to rule-based strategies if unavailable.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

import requests

from src.models.schemas import LandInput, PreferenceWeights, StrategyType


GROK_API_URL = "https://api.x.ai/v1/chat/completions"
DEFAULT_MODEL = os.getenv("GROK_MODEL", "grok-3-mini")  # cost-effective default


def _get_api_key() -> Optional[str]:
    return os.getenv("XAI_API_KEY") or os.getenv("X_AI_API_KEY") or os.getenv("GROK_API_KEY")


def refine_strategies_with_grok(
    land: LandInput,
    weights: PreferenceWeights,
    base_strategies: List[Dict[str, Any]],
) -> Optional[List[Dict[str, Any]]]:
    """
    Ask Grok to produce more context-aware, elaborate plantation strategies
    (area splits, species suited to soil/climate/budget/goals).
    Returns list of enhanced strategy dicts or None on any failure.
    """
    api_key = _get_api_key()
    if not api_key:
        return None

    prompt = _build_prompt(land, weights, base_strategies)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": DEFAULT_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are GreenVest's senior agroforestry investment advisor. "
                    "You produce precise, actionable plantation strategies for Indian land parcels. "
                    "Always respond with valid JSON only — no markdown, no commentary."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 2500,
    }

    try:
        resp = requests.post(GROK_API_URL, headers=headers, json=payload, timeout=45)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        # Strip possible markdown fences
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1]
            if content.endswith("```"):
                content = content.rsplit("```", 1)[0]
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "strategies" in parsed:
            return parsed["strategies"]
        if isinstance(parsed, list):
            return parsed
        return None
    except Exception:
        return None


def _build_prompt(
    land: LandInput,
    weights: PreferenceWeights,
    base_strategies: List[Dict[str, Any]],
) -> str:
    area_acre = round(land.area_hectares * 2.471, 1)
    return f"""
Given this land parcel and investor profile, produce 3 elaborate plantation strategies
that improve on the base templates. Emphasise concrete area allocations (hectares + acres),
cash-flow timing, and species suited to the site.

LAND
- Location: {land.location}
- Area: {land.area_hectares} ha ({area_acre} acres)
- Lat/Lon: {land.latitude}, {land.longitude}
- Soil: {land.soil_type}
- Water: {land.water_availability}
- Health score: {land.health_score}
- Budget (INR): {land.budget}
- Investment horizon (years): {land.investment_horizon_years}
- Soil pH: {land.soil_ph}, Organic carbon %: {land.organic_carbon_pct}

INVESTOR PREFERENCE WEIGHTS (0-10)
- Carbon: {weights.carbon}
- ROI: {weights.roi}
- Low risk: {weights.low_risk}
- Biodiversity: {weights.biodiversity}
- Water efficiency: {weights.water_efficiency}

BASE STRATEGY TEMPLATES (improve on these — do not ignore them)
{json.dumps(base_strategies, indent=2)[:3000]}

OUTPUT STRICT JSON FORMAT:
{{
  "strategies": [
    {{
      "strategy_type": "maximum_carbon" | "maximum_roi" | "balanced",
      "title": "...",
      "approach": "...",
      "recommended_species": ["...", "..."],
      "area_allocations": [
        {{
          "crop_or_species": "...",
          "area_hectares": 0.0,
          "area_acres": 0.0,
          "area_percent": 0,
          "purpose": "...",
          "expected_cashflow_cycle": "...",
          "notes": "..."
        }}
      ],
      "detailed_plan": "2-4 sentence paragraph explaining exactly what to plant where and why it matches budget + goals",
      "short_term_income": "...",
      "long_term_upside": "...",
      "ai_recommendation_reason": "Why this ranks well for the user"
    }}
  ]
}}

Rules:
- Total area_allocations must sum to approximately {land.area_hectares} ha.
- Respect the budget; do not propose plans that obviously exceed ₹{land.budget:,.0f}.
- Prefer species proven in the agro-climatic zone of {land.location}.
- For users wanting frequent money (high ROI weight) + long-term capital, always include a short-cycle block + a timber/carbon block.
- Keep language practical and farmer-friendly.
"""
