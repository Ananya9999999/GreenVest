"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Ruler,
  Wallet,
  Calendar,
  Droplets,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const PRESETS = [
  {
    name: "Nashik, MH",
    location: "Nashik, Maharashtra",
    area: "12.5",
    soil: "Black soil",
    water: "Moderate (Borewell & Aquifer)",
    budget: "500000",
    horizon: "15",
  },
  {
    name: "Coimbatore, TN",
    location: "Coimbatore, Tamil Nadu",
    area: "8.0",
    soil: "Red soil",
    water: "Moderate (Seasonal Rainfed & Well)",
    budget: "350000",
    horizon: "10",
  },
  {
    name: "Pune Rural, MH",
    location: "Pune rural, Maharashtra",
    area: "20.0",
    soil: "Alluvial soil",
    water: "Abundant (Canal & High Water Table)",
    budget: "900000",
    horizon: "20",
  },
];

export default function DiscoverPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    location: "Nashik, Maharashtra",
    area: "12.5",
    soil_type: "Black soil",
    water_availability: "Moderate",
    budget: "500000",
    horizon: "15",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const applyPreset = (p: typeof PRESETS[0]) => {
    setForm({
      location: p.location,
      area: p.area,
      soil_type: p.soil,
      water_availability: p.water.split(" ")[0],
      budget: p.budget,
      horizon: p.horizon,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("greenvest_land_input", JSON.stringify(form));
    }
    const params = new URLSearchParams({
      location: form.location,
      area: form.area,
      soil: form.soil_type,
      water: form.water_availability,
      budget: form.budget,
      horizon: form.horizon,
    });
    router.push(`/analyze?${params.toString()}`);
  };

  return (
    <div className="page-enter mesh-bg pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-olive-200 bg-olive-50/80 px-3.5 py-1 text-xs font-semibold text-olive-800 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-olive-600" />
            Smart Land Analysis Engine
          </div>
          <h1 className="mt-3 text-3xl font-bold text-olive-950 sm:text-4xl">
            Analyze your land
          </h1>
          <p className="mt-2 text-olive-700/80">
            Enter land parameters to unlock bio-climatic diagnostics, GreenScore, AI plantation strategies, and 20-year carbon & ROI projections.
          </p>

          {/* Quick presets */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-olive-600">Quick Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-full border border-olive-200 bg-white/80 px-3 py-1 text-xs font-medium text-olive-800 transition hover:border-olive-400 hover:bg-olive-50 active:scale-95"
              >
                {p.name} ({p.area} ha)
              </button>
            ))}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-8 space-y-5 rounded-2xl border border-olive-100 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8"
          onSubmit={handleSubmit}
        >
          {/* Location */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-olive-800">
              <MapPin className="h-4 w-4 text-brown-500" />
              Land Location
            </label>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Nashik, Maharashtra"
              className="w-full rounded-xl border border-olive-200 bg-cream-50 px-4 py-3 text-olive-900 outline-none transition focus:border-olive-500 focus:ring-2 focus:ring-olive-200"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Area */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-olive-800">
                <Ruler className="h-4 w-4 text-brown-500" />
                Land Area (Hectares)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                required
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
                placeholder="12.5"
                className="w-full rounded-xl border border-olive-200 bg-cream-50 px-4 py-3 text-olive-900 outline-none transition focus:border-olive-500 focus:ring-2 focus:ring-olive-200"
              />
            </div>

            {/* Soil Type */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-olive-800">
                <Layers className="h-4 w-4 text-brown-500" />
                Soil Type / Condition
              </label>
              <select
                value={form.soil_type}
                onChange={(e) => update("soil_type", e.target.value)}
                className="w-full rounded-xl border border-olive-200 bg-cream-50 px-4 py-3 text-olive-900 outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-200"
              >
                <option value="Black soil">Black Cotton Soil (Vertisol)</option>
                <option value="Red soil">Red Loam Soil (Alfisol)</option>
                <option value="Alluvial soil">Alluvial / Riverine Soil</option>
                <option value="Sandy loam">Sandy Loam</option>
                <option value="Clay loam">Clay Loam</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Water Availability */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-olive-800">
                <Droplets className="h-4 w-4 text-brown-500" />
                Water Availability
              </label>
              <select
                value={form.water_availability}
                onChange={(e) => update("water_availability", e.target.value)}
                className="w-full rounded-xl border border-olive-200 bg-cream-50 px-4 py-3 text-olive-900 outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-200"
              >
                <option value="Abundant">Abundant (Perennial Canal / High Water Table)</option>
                <option value="Moderate">Moderate (Borewell / Recharge Aquifer)</option>
                <option value="Rainfed">Rainfed / Constrained (Seasonal Monsoons)</option>
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-olive-800">
                <Wallet className="h-4 w-4 text-brown-500" />
                Total Budget (₹)
              </label>
              <input
                type="number"
                min="50000"
                step="10000"
                required
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
                placeholder="500000"
                className="w-full rounded-xl border border-olive-200 bg-cream-50 px-4 py-3 text-olive-900 outline-none transition focus:border-olive-500 focus:ring-2 focus:ring-olive-200"
              />
            </div>
          </div>

          {/* Investment Horizon */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-olive-800">
              <Calendar className="h-4 w-4 text-brown-500" />
              Investment Horizon
            </label>
            <select
              value={form.horizon}
              onChange={(e) => update("horizon", e.target.value)}
              className="w-full rounded-xl border border-olive-200 bg-cream-50 px-4 py-3 text-olive-900 outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-200"
            >
              <option value="5">5 years (Short-rotation / Rapid biomass)</option>
              <option value="10">10 years (Agroforestry & high-carbon growth)</option>
              <option value="15">15 years (Balanced maturity & timber thinning)</option>
              <option value="20">20+ years (Permanent hardwood & maximum carbon)</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 pt-3">
            <Button type="submit" size="lg" className="flex items-center gap-2">
              <span>Run Smart Land Analysis</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link href="/marketplace">
              <Button type="button" variant="outline" size="lg">
                Or browse marketplace listings
              </Button>
            </Link>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
