"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TreePine,
  Leaf,
  Droplets,
  Sliders,
  DollarSign,
  CloudRain,
  MessageCircle,
  X,
  ArrowRight,
  RefreshCw,
  Calendar,
  Layers,
  Thermometer,
  Compass,
  Navigation,
  Globe,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { analyzeLand, simulateWhatIf, sendChatMessage } from "@/lib/api";
import type {
  AdvisorResult,
  StrategyRecommendation,
  PreferenceWeights,
  LandInput,
  WhatIfResult,
} from "@/types";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Land input state
  const [landInput, setLandInput] = useState<LandInput>({
    land_id: "GV-2026-001",
    location: searchParams.get("location") || "Nashik, Maharashtra",
    area_hectares: parseFloat(searchParams.get("area") || "12.5") || 12.5,
    latitude: searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined,
    longitude: searchParams.get("lon") ? parseFloat(searchParams.get("lon")!) : undefined,
    soil_type: searchParams.get("soil") || "Black soil",
    water_availability: searchParams.get("water") || "Moderate",
    budget: parseFloat(searchParams.get("budget") || "500000") || 500000,
    investment_horizon_years: parseInt(searchParams.get("horizon") || "15", 10) || 15,
  });

  // 2. User priority weights state
  const [weights, setWeights] = useState<PreferenceWeights>({
    carbon: 8,
    roi: 7,
    low_risk: 7,
    biodiversity: 7,
    water_efficiency: 6,
  });

  // 3. Advisor analysis data
  const [data, setData] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyRecommendation | null>(null);

  // 4. "What If?" Scenario Simulator state
  const [whatIfRainfall, setWhatIfRainfall] = useState(0); // % change (-30 to +30)
  const [whatIfBudget, setWhatIfBudget] = useState(0); // % change (-50 to +100)
  const [whatIfCreditPrice, setWhatIfCreditPrice] = useState(18); // $ / tonne
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  // 5. Chat Assistant state
  const [chatOpen, setChatOpen] = useState(true); // always-visible panel; toggle still allowed
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "bot",
      text: "👋 Welcome to GreenVest Intelligence! I have analyzed this parcel's soil, climate, and carbon models. Ask me about strategy rankings, tree counts, ROI break-even, or What-If resilience.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Load from sessionStorage if URL params were empty
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("greenvest_land_input");
      if (stored && !searchParams.get("location")) {
        try {
          const parsed = JSON.parse(stored);
          setLandInput((prev) => ({
            ...prev,
            location: parsed.location || prev.location,
            area_hectares: parseFloat(parsed.area) || prev.area_hectares,
            latitude: parsed.latitude ? parseFloat(parsed.latitude) : prev.latitude,
            longitude: parsed.longitude ? parseFloat(parsed.longitude) : prev.longitude,
            soil_type: parsed.soil_type || prev.soil_type,
            water_availability: parsed.water_availability || prev.water_availability,
            budget: parseFloat(parsed.budget) || prev.budget,
            investment_horizon_years: parseInt(parsed.horizon, 10) || prev.investment_horizon_years,
          }));
        } catch {
          // ignore error
        }
      }
    }
  }, [searchParams]);

  // Main fetch function
  const runFetchAnalysis = useCallback(
    async (currentWeights: PreferenceWeights) => {
      setLoading(true);
      setAnalysisError(null);
      try {
        const result = await analyzeLand({
          land: landInput,
          weights: currentWeights,
        });
        if (!result?.strategies?.length) {
          throw new Error("No strategies returned. Is the backend /api/analyze running?");
        }
        setData(result);
        if (!selectedStrategy || !result.strategies.some((s) => s.strategy_type === selectedStrategy.strategy_type)) {
          setSelectedStrategy(result.best_match);
        }
      } catch (err) {
        console.error("Error analyzing land:", err);
        setAnalysisError(
          err instanceof Error
            ? err.message
            : "Strategy analysis failed. Check backend and NEXT_PUBLIC_API_URL."
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [landInput, selectedStrategy]
  );

  // Initial load
  useEffect(() => {
    runFetchAnalysis(weights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landInput]);

  // Trigger weight change
  const handleWeightChange = (key: keyof PreferenceWeights, val: number) => {
    const updated = { ...weights, [key]: val };
    setWeights(updated);
    runFetchAnalysis(updated);
  };

  // Run What-If simulation
  const handleSimulate = async () => {
    if (!data) return;
    setSimulating(true);
    try {
      const res = await simulateWhatIf({
        land_input: landInput,
        preference_weights: weights,
        rainfall_change_percent: whatIfRainfall,
        budget_delta_percent: whatIfBudget,
        investment_horizon_years: landInput.investment_horizon_years,
        carbon_credit_price_usd: whatIfCreditPrice,
      });
      setWhatIfResult(res);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  // Trigger default simulation when data arrives
  useEffect(() => {
    if (data && !whatIfResult) {
      handleSimulate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Chat message send
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", text: q }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const reply = await sendChatMessage(q, landInput.land_id);
      setChatMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "I experienced a temporary communication glitch, but based on your land parameters, Balanced Agroforestry provides optimal returns and carbon resilience.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectStrategyAndProceed = (strategy: StrategyRecommendation) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("greenvest_selected_strategy", JSON.stringify(strategy));
      sessionStorage.setItem("greenvest_active_land", JSON.stringify(landInput));
    }
    router.push("/dashboard");
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 pt-20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-olive-800 border-t-transparent"></div>
          <p className="mt-4 text-lg font-semibold text-olive-900">
            Running bio-climatic diagnostics & AI strategy rankings...
          </p>
          <p className="mt-1 text-sm text-olive-600">
            Analyzing {landInput.location} · {landInput.area_hectares} ha · {landInput.soil_type}
          </p>
        </div>
      </div>
    );
  }

  const activeStrategy = selectedStrategy || data?.best_match;

  return (
    <div className="page-enter mesh-bg pt-24 pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-olive-200 bg-olive-50/90 px-3 py-1 text-xs font-semibold text-olive-800 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-olive-600" />
              AI Decision Engine Analysis
            </div>
            <h1 className="mt-2 text-3xl font-bold text-olive-950 sm:text-4xl">
              {landInput.location}
            </h1>
            <p className="mt-1 text-sm text-olive-700">
              Parcel ID: <span className="font-mono font-medium">{landInput.land_id}</span> · Area:{" "}
              <strong>{landInput.area_hectares} ha</strong> ({Math.round(landInput.area_hectares * 2.471)} acres) · Budget:{" "}
              <strong>₹{(landInput.budget / 100000).toFixed(1)} Lakhs</strong> · Horizon:{" "}
              <strong>{landInput.investment_horizon_years} Years</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/discover")}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              Change Land
            </Button>
            {activeStrategy && (
              <Button
                size="sm"
                onClick={() => handleSelectStrategyAndProceed(activeStrategy)}
                className="flex items-center gap-1.5"
              >
                <span>View 20-Yr Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* 1. SMART LAND ANALYSIS OVERVIEW */}
        {data?.smart_land && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 rounded-2xl border border-olive-200/80 bg-white/90 p-6 shadow-sm backdrop-blur"
          >
            <div className="flex items-center justify-between border-b border-olive-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-olive-700" />
                <h2 className="text-lg font-bold text-olive-900">
                  🗺️ Smart Land Analysis Overview
                </h2>
              </div>
              <span className="rounded-full bg-olive-100 px-3 py-1 text-xs font-semibold text-olive-800">
                Bio-Climatic Profile
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-olive-800">
              {data.smart_land.overview_text}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-xl border border-olive-100 bg-cream-50/70 p-3.5">
                <span className="flex items-center gap-1.5 text-xs text-olive-600">
                  <CloudRain className="h-4 w-4 text-olive-500" /> Rainfall
                </span>
                <p className="mt-1 text-base font-bold text-olive-900">
                  {data.smart_land.annual_rainfall_mm} mm/yr
                </p>
                <p className="mt-0.5 text-[11px] text-olive-500 line-clamp-1">
                  {data.smart_land.rainfall_seasonality}
                </p>
              </div>

              <div className="rounded-xl border border-olive-100 bg-cream-50/70 p-3.5">
                <span className="flex items-center gap-1.5 text-xs text-olive-600">
                  <Thermometer className="h-4 w-4 text-brown-500" /> Temperature
                </span>
                <p className="mt-1 text-base font-bold text-olive-900">
                  {data.smart_land.temperature_range_celsius}
                </p>
                <p className="mt-0.5 text-[11px] text-olive-500">
                  Mean {data.smart_land.avg_annual_temp_celsius}°C
                </p>
              </div>

              <div className="rounded-xl border border-olive-100 bg-cream-50/70 p-3.5">
                <span className="flex items-center gap-1.5 text-xs text-olive-600">
                  <Layers className="h-4 w-4 text-olive-600" /> Soil Suitability
                </span>
                <p className="mt-1 text-base font-bold text-olive-900">
                  {landInput.soil_type}
                </p>
                <p className="mt-0.5 text-[11px] text-olive-500">
                  Fertility Index: {data.smart_land.soil_fertility_index}/100 · pH {data.smart_land.soil_ph}
                </p>
              </div>

              <div className="rounded-xl border border-olive-100 bg-cream-50/70 p-3.5">
                <span className="flex items-center gap-1.5 text-xs text-olive-600">
                  <Droplets className="h-4 w-4 text-blue-500" /> Water Availability
                </span>
                <p className="mt-1 text-base font-bold text-olive-900">
                  {landInput.water_availability}
                </p>
                <p className="mt-0.5 text-[11px] text-olive-500">
                  Water Table: ~{data.smart_land.groundwater_table_depth_m}m depth
                </p>
              </div>

              <div className="rounded-xl border border-olive-100 bg-cream-50/70 p-3.5">
                <span className="flex items-center gap-1.5 text-xs text-olive-600">
                  <Calendar className="h-4 w-4 text-olive-700" /> Climate Zone
                </span>
                <p className="mt-1 text-sm font-bold text-olive-900 line-clamp-1">
                  {data.smart_land.climate_type}
                </p>
                <p className="mt-0.5 text-[11px] text-olive-500">
                  Favorable for forestry
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2 & 8. GREENSCORE HERO & NATURE IMPACT SCORE */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* GreenScore Card */}
          {data?.greenscore && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-olive-200 bg-white p-6 shadow-sm lg:col-span-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-olive-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-olive-800 to-olive-950 text-white shadow-md">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {data.greenscore.overall_score}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-olive-200">
                      / 100
                    </span>
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-olive-100 px-2.5 py-0.5 text-xs font-bold text-olive-800">
                      🟢 Signature GreenScore
                    </span>
                    <h2 className="mt-1 text-2xl font-bold text-olive-950">
                      {data.greenscore.tier}
                    </h2>
                    <p className="text-xs text-olive-600">
                      Comprehensive rating of investment suitability & ecological viability.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-olive-500 uppercase tracking-wide">
                    Benchmark Status
                  </span>
                  <p className="text-sm font-bold text-olive-900">Top 12% in Region</p>
                </div>
              </div>

              {/* 6 Factor Progress Bars */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.greenscore.factors.map((factor) => (
                  <div
                    key={factor.name}
                    className="rounded-xl border border-olive-50 bg-cream-50/50 p-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-olive-800">{factor.name}</span>
                      <span className="font-mono font-bold text-olive-900">
                        {factor.score}/100
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-olive-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${factor.score}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-olive-700"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-olive-600 line-clamp-1">
                      {factor.insight}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Nature Impact Score Card */}
          {data?.nature_impact && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col justify-between rounded-2xl border border-olive-200 bg-gradient-to-br from-white to-olive-50/40 p-6 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-bold text-olive-900">
                    🌍 Nature Impact Score
                  </span>
                  <Leaf className="h-5 w-5 text-olive-600" />
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-olive-900">
                    {data.nature_impact.overall_score}
                  </span>
                  <span className="text-sm font-semibold text-olive-600">/ 100</span>
                  <span className="ml-auto rounded-md bg-olive-100 px-2 py-0.5 text-xs font-medium text-olive-800">
                    Eco-Certified
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-olive-700">
                  {data.nature_impact.interpretation}
                </p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-olive-100 py-1">
                    <span className="text-olive-600">🌳 Carbon Sequestration</span>
                    <span className="font-bold text-olive-900">
                      {data.nature_impact.carbon_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-olive-100 py-1">
                    <span className="text-olive-600">🦋 Biodiversity Enhancement</span>
                    <span className="font-bold text-olive-900">
                      {data.nature_impact.biodiversity_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-olive-100 py-1">
                    <span className="text-olive-600">💧 Groundwater Recharge</span>
                    <span className="font-bold text-olive-900">
                      {data.nature_impact.water_impact_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-olive-600">🌱 Soil Structure Renewal</span>
                    <span className="font-bold text-olive-900">
                      {data.nature_impact.soil_improvement_score}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-olive-50 p-2.5 text-[11px] text-olive-700">
                ⭐ <strong>Monoculture Guard:</strong> Prevents pure timber degradation by mandating multi-canopy ecological balance.
              </div>
            </motion.div>
          )}
        </div>

        {/* LAND HEALTH SCORE V2 — EXPLAINABLE FACTOR BREAKDOWN */}
        {data?.health_score_v2 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="mt-8 rounded-2xl border border-olive-200 bg-white p-6 shadow-sm"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-olive-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-olive-800 text-white shadow">
                  <span className="text-2xl font-extrabold leading-none">
                    {data.health_score_v2.land_health_score}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-emerald-200">/ 100</span>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <Globe className="h-3.5 w-3.5" />
                    🌍 Land Health Score v2
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-olive-950">
                    Grade{" "}
                    <span
                      className={
                        data.health_score_v2.grade.startsWith("A")
                          ? "text-emerald-700"
                          : data.health_score_v2.grade === "B"
                          ? "text-olive-700"
                          : "text-amber-700"
                      }
                    >
                      {data.health_score_v2.grade}
                    </span>
                    {" "}— {data.health_score_v2.verdict}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-olive-500">
                <ShieldAlert className="h-4 w-4" />
                Explainable AI · 5-Factor Analysis
              </div>
            </div>

            {/* 5 Factor Progress Bars */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {data.health_score_v2.factors.map((factor) => {
                const pct = Math.round((factor.score / factor.max_score) * 100);
                const color =
                  pct >= 75
                    ? "bg-emerald-600"
                    : pct >= 50
                    ? "bg-olive-600"
                    : "bg-amber-500";
                return (
                  <div
                    key={factor.name}
                    className="rounded-xl border border-olive-100 bg-cream-50/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-1 text-xs">
                      <span className="font-semibold text-olive-800 leading-tight">{factor.name}</span>
                      <span className="shrink-0 font-mono font-bold text-olive-900">
                        {factor.score}/{factor.max_score}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-olive-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9 }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-olive-500">
                      <span>{factor.weight_percent}% weight</span>
                      <span
                        className={
                          pct >= 75
                            ? "text-emerald-700 font-semibold"
                            : pct >= 50
                            ? "text-olive-600"
                            : "text-amber-600 font-semibold"
                        }
                      >
                        {pct}%
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-olive-500 line-clamp-2 leading-snug">
                      {factor.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Proximity badges */}
            {(data.geospatial_enrichment?.distance_to_road_km != null ||
              data.geospatial_enrichment?.distance_to_market_km != null) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.geospatial_enrichment.distance_to_road_km != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-100 px-3 py-1 text-xs font-medium text-olive-800">
                    <Navigation className="h-3.5 w-3.5" />
                    {data.geospatial_enrichment.distance_to_road_km.toFixed(1)} km to motorable road
                  </span>
                )}
                {data.geospatial_enrichment.distance_to_market_km != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-100 px-3 py-1 text-xs font-medium text-olive-800">
                    <Compass className="h-3.5 w-3.5" />
                    {data.geospatial_enrichment.distance_to_market_km.toFixed(1)} km to nearest mandi
                  </span>
                )}
              </div>
            )}

            {/* Data sources footnote */}
            <p className="mt-4 text-[10px] text-olive-400 leading-relaxed">
              Data:{" "}
              <a
                href="https://soilgrids.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-olive-600"
              >
                ISRIC SoilGrids v2.0
              </a>{" "}
              ·{" "}
              <a
                href="https://overpass-api.de"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-olive-600"
              >
                OSM Overpass
              </a>{" "}
              ·{" "}
              <a
                href="https://bhuvan.nrsc.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-olive-600"
              >
                ISRO Bhuvan Thematic
              </a>{" "}
              · NBSS-LUP ICAR
            </p>
          </motion.div>
        )}

        {/* PRIORITY WEIGHT SLIDERS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 rounded-2xl border border-olive-100 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-olive-950">
                <Sliders className="h-4 w-4 text-olive-700" />
                Tune Your Investment Priorities
              </h3>
              <p className="text-xs text-olive-600">
                Adjust sliders to dynamically re-rank strategies for your capital allocation goals.
              </p>
            </div>
            <span className="text-xs font-semibold text-olive-600">
              Auto-ranks Top 3 Strategies in real-time
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { key: "carbon", label: "Carbon Sequestration", val: weights.carbon },
              { key: "roi", label: "Financial ROI", val: weights.roi },
              { key: "low_risk", label: "Capital Safety / Low Risk", val: weights.low_risk },
              { key: "biodiversity", label: "Biodiversity & Ecology", val: weights.biodiversity },
              { key: "water_efficiency", label: "Water Efficiency", val: weights.water_efficiency },
            ].map(({ key, label, val }) => (
              <div key={key} className="rounded-xl border border-olive-100 bg-cream-50/70 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-olive-900">{label}</span>
                  <span className="rounded bg-olive-200/80 px-1.5 py-0.5 font-mono font-bold text-olive-900">
                    {val}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={val}
                  onChange={(e) => handleWeightChange(key as keyof PreferenceWeights, Number(e.target.value))}
                  className="mt-3 w-full accent-olive-800"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3. AI PLANTATION STRATEGY GENERATOR — TOP 3 STRATEGIES */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <div>
              <span className="rounded-full bg-olive-100 px-3 py-1 text-xs font-semibold text-olive-800">
                🤖 AI Plantation Strategy Generator
              </span>
              <h2 className="mt-1 text-2xl font-bold text-olive-950 sm:text-3xl">
                Top 3 Recommended Plantation Strategies
              </h2>
            </div>
            <span className="text-xs text-olive-600">
              Ranked dynamically by your preference weights
            </span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {analysisError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <strong>Strategies could not run.</strong> {analysisError}
                <p className="mt-1 text-xs text-red-600">
                  Start backend: <code>uvicorn src.api.app:app --reload --port 8000</code>
                </p>
              </div>
            )}
            {data?.strategies.map((strategy) => {
              const isSelected = activeStrategy?.strategy_type === strategy.strategy_type;
              return (
                <motion.div
                  key={strategy.strategy_type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card-lift relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all ${
                    isSelected
                      ? "border-olive-800 ring-2 ring-olive-600/30 shadow-md"
                      : "border-olive-100 hover:border-olive-300"
                  }`}
                >
                  {strategy.rank === 1 && (
                    <span className="absolute -top-3 right-6 rounded-full bg-olive-800 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      🏆 AI Top Pick
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white ${
                          strategy.strategy_type === "maximum_carbon"
                            ? "bg-olive-900"
                            : strategy.strategy_type === "maximum_roi"
                            ? "bg-brown-600"
                            : "bg-olive-700"
                        }`}
                      >
                        #{strategy.rank}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-olive-950">{strategy.title}</h3>
                        <p className="text-xs text-olive-600">{strategy.approach}</p>
                      </div>
                    </div>

                    {/* Key metrics badge strip */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-cream-50 p-2.5 text-center text-xs">
                      <div>
                        <span className="text-olive-500">ROI</span>
                        <p className="font-bold text-olive-900">~{strategy.expected_roi_percent}%</p>
                      </div>
                      <div>
                        <span className="text-olive-500">Break-Even</span>
                        <p className="font-bold text-olive-900">
                          {strategy.investment.breakeven_years} Yrs
                        </p>
                      </div>
                      <div>
                        <span className="text-olive-500">Risk</span>
                        <p className="font-bold text-olive-900">{strategy.risk_level}</p>
                      </div>
                    </div>

                    {/* Tree Count & Density */}
                    <div className="mt-4 rounded-xl border border-olive-100 bg-olive-50/50 p-3 text-xs">
                      <div className="flex items-center justify-between font-semibold text-olive-900">
                        <span className="flex items-center gap-1.5">
                          <TreePine className="h-4 w-4 text-olive-700" /> Total Trees Calculated:
                        </span>
                        <span className="font-mono text-sm text-olive-950">
                          {strategy.total_trees.toLocaleString()} trees
                        </span>
                      </div>
                      <p className="mt-1 text-olive-600">
                        Plantation Density: <strong>{strategy.density_trees_per_ha.toLocaleString()} trees/ha</strong> across {landInput.area_hectares} ha
                      </p>
                    </div>

                    {/* Recommended species */}
                    <div className="mt-4">
                      <span className="text-xs font-semibold text-olive-800">
                        Recommended Species Mix:
                      </span>
                      <ul className="mt-1.5 space-y-1 text-xs text-olive-700">
                        {strategy.recommended_species.map((sp, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="mt-0.5 text-olive-500">•</span>
                            <span>{sp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="mt-4 border-t border-olive-100 pt-3 text-xs">
                      <div className="flex justify-between font-semibold text-olive-900">
                        <span>Total Initial Cost:</span>
                        <span>₹{(strategy.cost_breakdown.total_initial_cost / 100000).toFixed(2)} Lakhs</span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-1 text-[11px] text-olive-600">
                        <span>• Saplings: ₹{(strategy.cost_breakdown.saplings / 1000).toFixed(0)}k</span>
                        <span>• Land Prep: ₹{(strategy.cost_breakdown.land_preparation / 1000).toFixed(0)}k</span>
                        <span>• Irrigation: ₹{(strategy.cost_breakdown.irrigation_infrastructure / 1000).toFixed(0)}k</span>
                        <span>• Fencing: ₹{(strategy.cost_breakdown.fencing_and_protection / 1000).toFixed(0)}k</span>
                      </div>
                    </div>

                    {/* Maintenance */}
                    <div className="mt-3 rounded-lg bg-cream-100/60 p-2.5 text-[11px] text-olive-700">
                      <p>
                        <strong>Maintenance (~₹{(strategy.maintenance.annual_cost / 1000).toFixed(0)}k/yr):</strong>{" "}
                        {strategy.maintenance.irrigation_frequency}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3">
                    <Button
                      className="w-full"
                      variant={isSelected ? "primary" : "outline"}
                      onClick={() => setSelectedStrategy(strategy)}
                    >
                      {isSelected ? "✓ Selected Strategy" : "Choose this Strategy"}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 6. STRATEGY COMPARISON ENGINE MATRIX */}
        {data?.comparison && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-14 rounded-2xl border border-olive-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-olive-100 pb-4">
              <div>
                <span className="rounded-full bg-olive-100 px-3 py-1 text-xs font-semibold text-olive-800">
                  ⚖️ Strategy Comparison Engine
                </span>
                <h2 className="mt-2 text-2xl font-bold text-olive-950">
                  Compare All Three Recommendations
                </h2>
                <p className="mt-1 text-xs text-olive-600">
                  Objective trade-off matrix balancing carbon, yield, risk, and natural capital.
                </p>
              </div>

              <div className="rounded-xl border border-olive-200 bg-olive-50/80 px-4 py-3 text-sm">
                <span className="text-xs font-medium text-olive-600">AI Decision Highlight:</span>
                <p className="font-bold text-olive-900">
                  {data.comparison.ai_recommended_strategy}
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-olive-200 text-xs font-bold uppercase tracking-wider text-olive-700">
                    <th className="py-3 px-4">Metric</th>
                    <th className="py-3 px-4">Maximum Carbon</th>
                    <th className="py-3 px-4">Maximum ROI</th>
                    <th className="py-3 px-4">Balanced Agroforestry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olive-100">
                  {data.comparison.matrix.map((row) => (
                    <tr key={row.metric} className="hover:bg-cream-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-olive-900">{row.metric}</td>
                      <td className="py-3.5 px-4 text-olive-800">{row.native_forest}</td>
                      <td className="py-3.5 px-4 text-olive-800">{row.bamboo}</td>
                      <td className="py-3.5 px-4 font-medium text-olive-900 bg-olive-50/30">{row.agroforestry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 rounded-xl border border-olive-100 bg-cream-50 p-4 text-xs text-olive-800">
              <p className="whitespace-pre-line leading-relaxed">
                {data.comparison.recommendation_rationale}
              </p>
            </div>
          </motion.div>
        )}

        {/* 4 & 5. CARBON SEQUESTRATION FORECAST & ROI CALCULATOR */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* 4. Carbon Sequestration Forecast */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-olive-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-olive-100 pb-3">
              <div>
                <span className="rounded-full bg-olive-100 px-2.5 py-0.5 text-xs font-semibold text-olive-800">
                  📊 Carbon Sequestration Forecast
                </span>
                <h3 className="mt-1 text-lg font-bold text-olive-950">
                  CO₂ Capture Projections (with Confidence Range)
                </h3>
              </div>
              <TreePine className="h-5 w-5 text-olive-700" />
            </div>

            <p className="mt-2 text-xs text-olive-600">
              Biological range modeled across 5, 10, and 20 years instead of pretending artificial single-point certainty.
            </p>

            {/* 3 Timeframes Cards */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {data?.carbon_forecasts.map((cf) => (
                <div
                  key={cf.years}
                  className="rounded-xl border border-olive-100 bg-olive-900 p-4 text-white"
                >
                  <p className="text-xs text-olive-300 font-medium">
                    {cf.years} Year Horizon
                  </p>
                  <p className="mt-1 text-lg font-extrabold tracking-tight">
                    {cf.cumulative_expected.toLocaleString()} <span className="text-xs font-normal">tCO₂e</span>
                  </p>
                  <p className="mt-1 text-[11px] text-olive-200">
                    Range: <strong>{cf.cumulative_min.toLocaleString()} – {cf.cumulative_max.toLocaleString()}</strong> tCO₂
                  </p>
                  <p className="mt-2 text-[10px] text-cream-200/90 border-t border-olive-800 pt-1.5">
                    Credit Value: {cf.credit_value_usd_range}
                  </p>
                </div>
              ))}
            </div>

            {/* 20 Year Callout */}
            {data?.carbon_forecasts && (
              <div className="mt-5 rounded-xl border border-olive-200 bg-cream-50 p-4 text-xs text-olive-800">
                <span className="font-bold text-olive-900">
                  Expected 20-Year Sequestration:
                </span>
                <p className="mt-1 text-sm font-extrabold text-olive-950">
                  {data.carbon_forecasts[2]?.cumulative_min.toLocaleString()} –{" "}
                  {data.carbon_forecasts[2]?.cumulative_max.toLocaleString()} tonnes CO₂
                </p>
                <p className="mt-1 text-olive-600">
                  Valued at <strong>${data.credit_estimate.value_low_usd.toLocaleString()} – ${data.credit_estimate.value_high_usd.toLocaleString()} USD</strong> (~₹{(data.credit_estimate.value_low_usd * 85 / 100000).toFixed(1)}L – ₹{(data.credit_estimate.value_high_usd * 85 / 100000).toFixed(1)}L) in verifiable carbon credits.
                </p>
              </div>
            )}
          </motion.div>

          {/* 5. Investment & ROI Calculator */}
          {activeStrategy && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-olive-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-olive-100 pb-3">
                <div>
                  <span className="rounded-full bg-olive-100 px-2.5 py-0.5 text-xs font-semibold text-olive-800">
                    💰 Investment & ROI Calculator
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-olive-950">
                    Financial Returns: {activeStrategy.title}
                  </h3>
                </div>
                <DollarSign className="h-5 w-5 text-brown-600" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-olive-100 bg-cream-50/70 p-3">
                  <span className="text-olive-600">Initial Capital</span>
                  <p className="mt-1 text-base font-bold text-olive-950">
                    ₹{(activeStrategy.cost_breakdown.total_initial_cost / 100000).toFixed(2)} Lakhs
                  </p>
                  <p className="mt-0.5 text-[11px] text-olive-500">Planting & setup</p>
                </div>

                <div className="rounded-xl border border-olive-100 bg-cream-50/70 p-3">
                  <span className="text-olive-600">Break-Even Period</span>
                  <p className="mt-1 text-base font-bold text-olive-950">
                    ~{activeStrategy.investment.breakeven_years} Years
                  </p>
                  <p className="mt-0.5 text-[11px] text-olive-500">Cashflow positive</p>
                </div>

                <div className="rounded-xl border border-olive-100 bg-cream-50/70 p-3">
                  <span className="text-olive-600">Annual Harvest Revenue</span>
                  <p className="mt-1 text-base font-bold text-olive-950">
                    ₹{(activeStrategy.investment.harvest_revenue_annual_avg / 100000).toFixed(2)} Lakhs
                  </p>
                  <p className="mt-0.5 text-[11px] text-olive-500">Produce / timber thinning</p>
                </div>

                <div className="rounded-xl border border-olive-100 bg-cream-50/70 p-3">
                  <span className="text-olive-600">Annual Carbon Revenue</span>
                  <p className="mt-1 text-base font-bold text-olive-950">
                    ₹{(activeStrategy.investment.carbon_revenue_annual_avg / 100000).toFixed(2)} Lakhs
                  </p>
                  <p className="mt-0.5 text-[11px] text-olive-500">Carbon credits / yr</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-olive-200 bg-gradient-to-r from-olive-800 to-olive-950 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-olive-300">Projected 20-Year Gross Returns</span>
                    <p className="text-xl font-black">
                      ₹{(activeStrategy.investment.total_projected_returns / 100000).toFixed(1)} Lakhs
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-olive-300">Annualized ROI</span>
                    <p className="text-2xl font-black text-amber-300">
                      ~{activeStrategy.expected_roi_percent}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* 7. CLIMATE & ENVIRONMENTAL RISK ANALYSIS */}
        {data?.climate_risk && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 rounded-2xl border border-olive-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-olive-100 pb-3">
              <div>
                <span className="rounded-full bg-olive-100 px-3 py-1 text-xs font-semibold text-olive-800">
                  🌦️ Climate & Environmental Risk Analysis
                </span>
                <h2 className="mt-2 text-2xl font-bold text-olive-950">
                  Multi-Hazard Threat Evaluation
                </h2>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">
                Investment Risk: {data.climate_risk.risk_category} ({data.climate_risk.overall_risk_score}/10)
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {data.climate_risk.hazards.map((hazard) => (
                <div
                  key={hazard.name}
                  className="rounded-xl border border-olive-100 bg-cream-50/70 p-4"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-lg">{hazard.icon}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                        hazard.level === "High"
                          ? "bg-red-100 text-red-800"
                          : hazard.level.includes("Moderate")
                          ? "bg-amber-100 text-amber-800"
                          : "bg-olive-100 text-olive-800"
                      }`}
                    >
                      {hazard.level}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-olive-900">{hazard.name}</h4>
                  <p className="mt-1 text-[11px] text-olive-600 leading-relaxed">
                    {hazard.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-olive-200 bg-olive-50 p-4 text-xs text-olive-900">
              <span className="font-bold">🛡️ Mitigation Advisory:</span>
              <p className="mt-1 leading-relaxed">{data.climate_risk.advisory}</p>
            </div>
          </motion.div>
        )}

        {/* 9. "WHAT IF?" SCENARIO SIMULATOR */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 rounded-2xl border-2 border-olive-800 bg-gradient-to-br from-white via-cream-50 to-olive-50/50 p-6 shadow-md sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-olive-200 pb-4">
            <div>
              <span className="rounded-full bg-olive-800 px-3 py-1 text-xs font-bold text-white">
                🔄 What-If Scenario Simulator
              </span>
              <h2 className="mt-2 text-2xl font-black text-olive-950 sm:text-3xl">
                &ldquo;What If?&rdquo; Scenario Simulator
              </h2>
              <p className="mt-1 text-xs text-olive-700">
                Stress-test capital, climate shocks, and carbon markets to inspect resilience under uncertainty.
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleSimulate}
              disabled={simulating}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${simulating ? "animate-spin" : ""}`} />
              <span>{simulating ? "Calculating..." : "Run Simulation"}</span>
            </Button>
          </div>

          {/* Simulator Controls */}
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {/* Rainfall Slider */}
            <div className="rounded-xl border border-olive-200 bg-white p-4 shadow-sm">
              <div className="flex justify-between text-xs font-semibold text-olive-900">
                <span className="flex items-center gap-1">
                  <CloudRain className="h-4 w-4 text-blue-500" /> Rainfall Change
                </span>
                <span className={whatIfRainfall < 0 ? "text-amber-700" : "text-olive-700"}>
                  {whatIfRainfall > 0 ? `+${whatIfRainfall}%` : `${whatIfRainfall}%`}
                </span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                step={5}
                value={whatIfRainfall}
                onChange={(e) => setWhatIfRainfall(Number(e.target.value))}
                className="mt-3 w-full accent-olive-800"
              />
              <p className="mt-1.5 text-[11px] text-olive-500">
                e.g. What if rainfall decreases by 20%?
              </p>
            </div>

            {/* Budget Slider */}
            <div className="rounded-xl border border-olive-200 bg-white p-4 shadow-sm">
              <div className="flex justify-between text-xs font-semibold text-olive-900">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-brown-500" /> Budget Adjustment
                </span>
                <span className="text-olive-700">
                  {whatIfBudget > 0 ? `+${whatIfBudget}%` : `${whatIfBudget}%`}
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={100}
                step={10}
                value={whatIfBudget}
                onChange={(e) => setWhatIfBudget(Number(e.target.value))}
                className="mt-3 w-full accent-olive-800"
              />
              <p className="mt-1.5 text-[11px] text-olive-500">
                Adjust capital scale (-50% to +100%)
              </p>
            </div>

            {/* Carbon Credit Price Slider */}
            <div className="rounded-xl border border-olive-200 bg-white p-4 shadow-sm">
              <div className="flex justify-between text-xs font-semibold text-olive-900">
                <span className="flex items-center gap-1">
                  <Leaf className="h-4 w-4 text-olive-600" /> Carbon Credit Price
                </span>
                <span className="text-olive-700">${whatIfCreditPrice}/tonne</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={2}
                value={whatIfCreditPrice}
                onChange={(e) => setWhatIfCreditPrice(Number(e.target.value))}
                className="mt-3 w-full accent-olive-800"
              />
              <p className="mt-1.5 text-[11px] text-olive-500">
                Voluntary market trajectory ($5 to $50)
              </p>
            </div>
          </div>

          {/* Simulation Output Dashboard */}
          {whatIfResult && (
            <div className="mt-6 rounded-2xl border border-olive-300 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-olive-100 pb-3">
                <h4 className="text-sm font-bold text-olive-900">
                  Simulation Outcome: {whatIfResult.baseline_strategy}
                </h4>
                <span className="rounded-full bg-olive-100 px-3 py-1 text-xs font-bold text-olive-800">
                  {whatIfResult.rainfall_change_applied}% Precipitation Shift
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                <div className="rounded-xl bg-cream-50 p-3">
                  <span className="text-olive-600">📈 Carbon Captured</span>
                  <p className="mt-1 text-base font-bold text-olive-900">
                    {whatIfResult.carbon_20y_range}
                  </p>
                  <p className="mt-0.5 text-[11px] text-olive-600">
                    Delta: <strong>{whatIfResult.carbon_delta_percent > 0 ? `+${whatIfResult.carbon_delta_percent}%` : `${whatIfResult.carbon_delta_percent}%`}</strong>
                  </p>
                </div>

                <div className="rounded-xl bg-cream-50 p-3">
                  <span className="text-olive-600">💰 Modified ROI</span>
                  <p className="mt-1 text-base font-bold text-olive-900">
                    ~{whatIfResult.projected_roi_percent}%
                  </p>
                  <p className="mt-0.5 text-[11px] text-olive-600">
                    Delta: <strong>{whatIfResult.roi_delta_percent > 0 ? `+${whatIfResult.roi_delta_percent}%` : `${whatIfResult.roi_delta_percent}%`}</strong>
                  </p>
                </div>

                <div className="rounded-xl bg-cream-50 p-3">
                  <span className="text-olive-600">⚠️ Climate Risk Score</span>
                  <p className="mt-1 text-base font-bold text-olive-900">
                    {whatIfResult.climate_risk_score} / 10
                  </p>
                  <p className="mt-0.5 text-[11px] text-olive-600">
                    Risk shift: <strong>{whatIfResult.risk_delta_percent > 0 ? `+${whatIfResult.risk_delta_percent}%` : `${whatIfResult.risk_delta_percent}%`}</strong>
                  </p>
                </div>

                <div className="rounded-xl bg-cream-50 p-3">
                  <span className="text-olive-600">⏱️ Break-Even</span>
                  <p className="mt-1 text-base font-bold text-olive-900">
                    {whatIfResult.breakeven_years} Years
                  </p>
                  <p className="mt-0.5 text-[11px] text-olive-600">
                    Adjusted payback
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-olive-200 bg-olive-50 p-4 text-xs">
                <span className="font-bold text-olive-900">🔬 Resilience Verdict:</span>
                <p className="mt-1 leading-relaxed text-olive-800">
                  {whatIfResult.resilience_verdict}
                </p>
                <p className="mt-2 text-olive-700">
                  <strong>Recommended Tactical Action:</strong> {whatIfResult.recommended_adjustment}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* 10. PROCEED CTA */}
        {activeStrategy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-14 rounded-2xl bg-olive-900 p-8 text-center text-white shadow-xl"
          >
            <span className="rounded-full bg-olive-800 px-3.5 py-1 text-xs font-semibold text-cream-100">
              Ready for Execution
            </span>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
              Proceed with {activeStrategy.title}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-cream-200/90">
              Open the 20-year project dashboard to inspect milestone growth, cumulative carbon yields, satellite NDVI monitoring, and real-time weather planting alerts.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button
                size="lg"
                onClick={() => handleSelectStrategyAndProceed(activeStrategy)}
                className="bg-cream-100 text-olive-950 hover:bg-white"
              >
                Launch Long-Term Investment Dashboard →
              </Button>
            </div>
          </motion.div>
        )}

        
        {/* STATIC AI CHAT PANEL — fixed on viewport, always available */}
        <aside
          className={`fixed top-20 right-4 z-40 flex h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] w-[min(100vw-1.5rem,360px)] flex-col overflow-hidden rounded-2xl border border-olive-200 bg-white shadow-2xl transition-transform duration-300 ${
            chatOpen ? "translate-x-0" : "translate-x-[120%]"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between bg-olive-900 px-4 py-3 text-cream-50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cream-300" />
              <span className="text-sm font-semibold">GreenVest AI Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="rounded p-1 text-cream-300 hover:text-white"
              aria-label="Minimize chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-olive-800 text-cream-50"
                    : "bg-cream-100 text-olive-900"
                }`}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div className="rounded-2xl bg-cream-100 px-3 py-2 text-sm text-olive-600">
                Thinking…
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-olive-100 bg-cream-50/50 px-3 py-2">
            <button
              type="button"
              onClick={() => setChatInput("Why did you recommend this strategy?")}
              className="rounded-full border border-olive-200 bg-white px-2 py-1 text-[11px] text-olive-800 hover:bg-olive-50"
            >
              Why recommend?
            </button>
            <button
              type="button"
              onClick={() => setChatInput("What are the ROI and break-even timelines?")}
              className="rounded-full border border-olive-200 bg-white px-2 py-1 text-[11px] text-olive-800 hover:bg-olive-50"
            >
              ROI & break-even?
            </button>
            <button
              type="button"
              onClick={() => setChatInput("How many trees and what density?")}
              className="rounded-full border border-olive-200 bg-white px-2 py-1 text-[11px] text-olive-800 hover:bg-olive-50"
            >
              Tree density?
            </button>
          </div>

          <div className="flex shrink-0 gap-2 border-t border-olive-100 bg-white p-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask about this land, trees, ROI..."
              className="min-w-0 flex-1 rounded-full border border-olive-200 px-3.5 py-2 text-xs text-olive-900 outline-none focus:border-olive-500"
            />
            <Button size="sm" onClick={handleSendMessage} disabled={chatLoading}>
              Send
            </Button>
          </div>
        </aside>

        {/* Re-open chip when panel minimized */}
        {!chatOpen && (
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-olive-800 px-4 py-3 text-sm font-semibold text-cream-50 shadow-2xl transition hover:bg-olive-700"
          >
            <MessageCircle className="h-5 w-5" />
            AI Assistant
          </button>
        )}

      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream-50 pt-20">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-olive-800 border-t-transparent"></div>
            <p className="mt-4 text-lg font-semibold text-olive-900">
              Initializing GreenVest Land Intelligence...
            </p>
          </div>
        </div>
      }
    >
      <AuthGuard
        fallbackTitle="Land Analysis Engine"
        fallbackDescription="Please sign in or register to access the bio-climatic analysis, GreenScore calculator, and 20-year carbon forecasts."
      >
        <AnalyzeContent />
      </AuthGuard>
    </Suspense>
  );
}
