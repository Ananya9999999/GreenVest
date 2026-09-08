"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TreePine,
  TrendingUp,
  CloudRain,
  DollarSign,
  Satellite,
  CheckCircle2,
  Sparkles,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { fetchSatelliteData } from "@/lib/api";
import type { StrategyRecommendation, SatelliteMonitoringData, LandInput } from "@/types";

const TIMELINE_MILESTONES = [
  {
    year: "Year 1",
    phase: "Plantation Investment & Site Preparation",
    focus: "Earthwork, perimeter bio-fencing, sub-surface drip setup, and high-density sapling planting.",
    investment: "100% initial capital deployed",
    returns: "Zero commercial yield (establishment phase)",
    carbon: "Roots established (~40 tCO₂e)",
    canopy: "8% canopy cover",
    status: "active",
  },
  {
    year: "Year 3",
    phase: "Early Growth & Intercrop Cashflow",
    focus: "Canopy starts closing; shade suppresses weed competition. First harvest of leguminous/spice intercrops.",
    investment: "Routine low-cost weed & moisture management",
    returns: "First cashflow from intercrops & organic mulch",
    carbon: "Accelerating biomass (~240 tCO₂e)",
    canopy: "28% canopy cover",
    status: "upcoming",
  },
  {
    year: "Year 5",
    phase: "Initial Revenue & 1st Carbon Credit Issuance",
    focus: "Third-party MRV audit (Verra / Gold Standard). Initial carbon credits minted and traded on VCM.",
    investment: "Maintenance self-funded from harvest yields",
    returns: "Significant fruit/bamboo culm thinning + credits",
    carbon: "Significant carbon pool (~680 tCO₂e)",
    canopy: "52% canopy cover",
    status: "upcoming",
  },
  {
    year: "Year 10",
    phase: "Major Carbon Sequestration & Commercial Thinning",
    focus: "Peak annual sequestration rate. Sustainable selective timber thinning generates lump-sum liquidity.",
    investment: "Minimal overhead; established forest micro-climate",
    returns: "Major liquidity event (timber + carbon vintages)",
    carbon: "High-density sequestration (~1,450 tCO₂e)",
    canopy: "78% canopy cover",
    status: "upcoming",
  },
  {
    year: "Year 20",
    phase: "Mature Returns & Permanent Ecosystem Asset",
    focus: "Mature commercial timber value realization; perpetual natural capital annuity and soil vitality.",
    investment: "Self-sustaining naturalized ecosystem",
    returns: "Mature timber harvest + 20-year cumulative credits",
    carbon: "Maximized carbon capture (8,000–11,000+ tCO₂e)",
    canopy: "92% canopy closure",
    status: "upcoming",
  },
];

export default function DashboardPage() {
  const [strategy, setStrategy] = useState<StrategyRecommendation | null>(null);
  const [land, setLand] = useState<LandInput | null>(null);
  const [satellite, setSatellite] = useState<SatelliteMonitoringData | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "satellite">("timeline");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStrat = sessionStorage.getItem("greenvest_selected_strategy");
      const storedLand = sessionStorage.getItem("greenvest_active_land");
      if (storedStrat) {
        try {
          setStrategy(JSON.parse(storedStrat));
        } catch {}
      }
      if (storedLand) {
        try {
          setLand(JSON.parse(storedLand));
        } catch {}
      }
    }

    fetchSatelliteData("GV-2026-001").then(setSatellite).catch(console.error);
  }, []);

  const stratTitle = strategy?.title || "Balanced Agroforestry";
  const stratArea = land?.area_hectares || 12.5;
  const stratRoi = strategy?.expected_roi_percent || 11.2;
  const stratCost = strategy?.cost_breakdown?.total_initial_cost || 2437500;
  const stratTrees = strategy?.total_trees || Math.round(stratArea * 950);

  return (
    <div className="page-enter mesh-bg pt-24 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-olive-200 bg-olive-100/70 px-3 py-1 text-xs font-semibold text-olive-800">
              <Sparkles className="h-3.5 w-3.5 text-olive-600" />
              Project Portfolio Management
            </div>
            <h1 className="mt-2 text-3xl font-bold text-olive-950 sm:text-4xl">
              Long-Term Investment & Monitoring
            </h1>
            <p className="mt-1 text-sm text-olive-700">
              Active Strategy: <strong className="text-olive-900">{stratTitle}</strong> · Location:{" "}
              <strong>{land?.location || "Nashik, Maharashtra"}</strong> · Parcel Size:{" "}
              <strong>{stratArea} ha</strong> · Trees:{" "}
              <strong>{stratTrees.toLocaleString()} trees</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/analyze">
              <Button variant="outline" size="sm">
                ← Re-tune Strategy
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Top KPI Metrics Strip */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: TreePine,
              label: "Total Canopy Trees",
              val: `${stratTrees.toLocaleString()} trees`,
              sub: `${strategy?.density_trees_per_ha || 950} trees/ha density`,
              color: "text-olive-800",
            },
            {
              icon: TrendingUp,
              label: "Target Financial ROI",
              val: `~${stratRoi}%`,
              sub: `Break-even in ~${strategy?.investment?.breakeven_years || 4.6} yrs`,
              color: "text-amber-700",
            },
            {
              icon: DollarSign,
              label: "Initial Capital Deployed",
              val: `₹${(stratCost / 100000).toFixed(1)} Lakhs`,
              sub: "Itemized sapling & irrigation setup",
              color: "text-olive-700",
            },
            {
              icon: Satellite,
              label: "Plantation Health (NDVI)",
              val: satellite ? `${satellite.ndvi_current} (+${satellite.ndvi_trend_percent}%)` : "0.71 (+12.4%)",
              sub: "Vigorous growth vs baseline",
              color: "text-blue-700",
            },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-olive-600">{c.label}</span>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-olive-950">{c.val}</p>
              <p className="mt-0.5 text-xs text-olive-500">{c.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Section Tabs */}
        <div className="mt-10 flex gap-3 border-b border-olive-200">
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "timeline"
                ? "border-b-2 border-olive-800 text-olive-950"
                : "text-olive-600 hover:text-olive-900"
            }`}
          >
            🗓️ 20-Year Project Timeline & Milestones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("satellite")}
            className={`flex items-center gap-1.5 pb-3 text-sm font-bold transition-colors ${
              activeTab === "satellite"
                ? "border-b-2 border-olive-800 text-olive-950"
                : "text-olive-600 hover:text-olive-900"
            }`}
          >
            <Satellite className="h-4 w-4" />
            Satellite Remote Sensing & NDVI
          </button>
        </div>

        {/* TAB 1: 20-YEAR PROJECT TIMELINE */}
        {activeTab === "timeline" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-6"
          >
            <div className="rounded-2xl border border-olive-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-olive-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-olive-950">
                    Milestone Evolution: {stratTitle}
                  </h3>
                  <p className="text-xs text-olive-600">
                    Track the transition from high-capital establishment to compounding carbon annuities and mature timber yield.
                  </p>
                </div>
                <span className="rounded-full bg-cream-200 px-3 py-1 text-xs font-bold text-olive-900">
                  {stratArea} Hectares Managed
                </span>
              </div>

              {/* Timeline Cards */}
              <div className="mt-6 space-y-5">
                {TIMELINE_MILESTONES.map((m, idx) => (
                  <div
                    key={m.year}
                    className="relative flex flex-col gap-4 rounded-xl border border-olive-100 bg-cream-50/50 p-5 transition-all hover:bg-cream-50 sm:flex-row sm:items-start"
                  >
                    <div className="flex sm:w-36 shrink-0 flex-col items-start sm:border-r sm:border-olive-200 sm:pr-4">
                      <span className="rounded-lg bg-olive-800 px-2.5 py-1 text-xs font-black text-white">
                        {m.year}
                      </span>
                      <span className="mt-2 text-xs font-semibold text-olive-700">
                        {m.canopy}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-olive-950">{m.phase}</h4>
                        <span className="rounded bg-olive-100 px-2 py-0.5 text-[11px] font-medium text-olive-800">
                          {idx === 0 ? "Current Stage" : "Scheduled Target"}
                        </span>
                      </div>
                      <p className="text-olive-700 leading-relaxed">{m.focus}</p>

                      <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3 text-[11px]">
                        <div className="rounded bg-white p-2 border border-olive-100">
                          <span className="text-olive-500 block">Investment:</span>
                          <span className="font-semibold text-olive-900">{m.investment}</span>
                        </div>
                        <div className="rounded bg-white p-2 border border-olive-100">
                          <span className="text-olive-500 block">Revenue Outflow:</span>
                          <span className="font-semibold text-olive-900">{m.returns}</span>
                        </div>
                        <div className="rounded bg-white p-2 border border-olive-100">
                          <span className="text-olive-500 block">Carbon Stock:</span>
                          <span className="font-semibold text-olive-900">{m.carbon}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: SATELLITE-BASED MONITORING */}
        {activeTab === "satellite" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-6"
          >
            {/* Satellite Hero Panel */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* NDVI & Growth Status */}
              <div className="rounded-2xl border border-olive-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-olive-100 pb-3">
                  <div>
                    <span className="rounded-full bg-olive-100 px-2.5 py-0.5 text-xs font-semibold text-olive-800">
                      Sentinel-2 Multi-Spectral Feed
                    </span>
                    <h3 className="mt-1 text-xl font-bold text-olive-950">
                      NDVI Vegetation Index Progression
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-olive-100 px-3 py-1 text-xs font-bold text-olive-800">
                    <Activity className="h-3.5 w-3.5 text-olive-600" />
                    Live Calibrated
                  </span>
                </div>

                <div className="mt-5 flex items-baseline gap-3">
                  <span className="text-5xl font-black text-olive-900">
                    {satellite?.ndvi_current || 0.71}
                  </span>
                  <span className="text-sm font-bold text-olive-600">
                    NDVI (Baseline: {satellite?.ndvi_baseline || 0.38})
                  </span>
                  <span className="ml-auto rounded-full bg-olive-800 px-3 py-1 text-xs font-bold text-white">
                    +{satellite?.ndvi_trend_percent || 12.4}% Growth Surge
                  </span>
                </div>

                <p className="mt-2 text-xs text-olive-600">
                  Status: <strong>{satellite?.vegetation_health_status || "Vigorous / Rapid Growth"}</strong> · Canopy Coverage: <strong>{satellite?.canopy_cover_percent || 34.5}%</strong>
                </p>

                {/* Simulated Chart Bars */}
                <div className="mt-6 border-t border-olive-100 pt-4">
                  <span className="text-xs font-semibold text-olive-800">
                    6-Month Historical NDVI & Soil Moisture Trend
                  </span>
                  <div className="mt-3 grid grid-cols-6 gap-2 text-center text-xs">
                    {satellite?.timeseries.map((pt) => (
                      <div key={pt.date} className="flex flex-col items-center">
                        <div className="relative flex h-32 w-full flex-col justify-end rounded-lg bg-cream-100 p-1">
                          <div
                            style={{ height: `${pt.ndvi * 100}%` }}
                            className="w-full rounded-md bg-olive-700 transition-all"
                            title={`NDVI: ${pt.ndvi}`}
                          />
                        </div>
                        <span className="mt-2 text-[11px] font-bold text-olive-900">{pt.date}</span>
                        <span className="text-[10px] text-olive-600">{pt.ndvi} NDVI</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Simulated Satellite Multispectral Card */}
              <div className="flex flex-col justify-between rounded-2xl border border-olive-200 bg-gradient-to-br from-olive-950 to-olive-900 p-6 text-white shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-olive-800 px-2.5 py-0.5 text-xs text-olive-200 font-semibold">
                      Spectral Imagery Simulation
                    </span>
                    <Satellite className="h-5 w-5 text-olive-300" />
                  </div>
                  <h4 className="mt-3 text-lg font-bold">Parcel Biomass Heatmap</h4>
                  <p className="mt-1 text-xs text-olive-200">
                    Spatial false-color infrared index demonstrating root-zone moisture and dense chlorophyll vitality.
                  </p>

                  {/* Visual Pixel Matrix Simulation */}
                  <div className="mt-4 grid grid-cols-5 gap-1.5 rounded-xl bg-olive-900/80 p-3 border border-olive-800">
                    {[
                      "bg-emerald-500", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600", "bg-emerald-500",
                      "bg-emerald-400", "bg-emerald-600", "bg-emerald-500", "bg-emerald-400", "bg-emerald-600",
                      "bg-emerald-500", "bg-emerald-500", "bg-emerald-600", "bg-emerald-500", "bg-emerald-400",
                      "bg-emerald-600", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600", "bg-emerald-500",
                    ].map((col, idx) => (
                      <div
                        key={idx}
                        className={`h-8 rounded ${col} opacity-90 transition hover:scale-105 hover:opacity-100`}
                        title={`Zone ${idx + 1}: Healthy Canopy`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-olive-800/80 p-3 text-xs text-olive-100">
                  <div className="flex items-center justify-between">
                    <span>Biomass Density:</span>
                    <strong className="text-white">High Vigor</strong>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Anomalies Detected:</span>
                    <strong className="text-emerald-300">0 critical alerts</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Satellite Alerts Feed */}
            <div className="rounded-2xl border border-olive-100 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-olive-950">
                Live Geospatial & Weather Advisory Alerts
              </h3>
              <div className="mt-4 space-y-3">
                {satellite?.recent_alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3.5 rounded-xl border border-olive-100 bg-cream-50/60 p-4 text-xs"
                  >
                    <div className="mt-0.5">
                      {alert.type === "opportunity" ? (
                        <CloudRain className="h-5 w-5 text-blue-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-olive-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-olive-900">{alert.title}</h4>
                        <span className="text-[11px] text-olive-500">{alert.timestamp}</span>
                      </div>
                      <p className="mt-1 text-olive-700 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
