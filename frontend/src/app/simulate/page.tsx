"use client";

import { Suspense, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Trees,
  Home,
  Droplets,
  Wheat,
  Flower2,
  Factory,
  Layers,
  RotateCcw,
  Sparkles,
  Ruler,
  PieChart,
  Lock,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

type ZoneType =
  | "plantation"
  | "agroforestry"
  | "water"
  | "infrastructure"
  | "native"
  | "buffer";

type ZoneDef = {
  id: ZoneType;
  label: string;
  short: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof Trees;
  desc: string;
};

const ZONES: ZoneDef[] = [
  {
    id: "plantation",
    label: "Commercial plantation",
    short: "Plantation",
    color: "#41522e",
    bg: "bg-olive-800",
    border: "border-olive-700",
    icon: Trees,
    desc: "Timber / bamboo / high-density canopy",
  },
  {
    id: "agroforestry",
    label: "Agroforestry strips",
    short: "Agroforest",
    color: "#6b8449",
    bg: "bg-olive-500",
    border: "border-olive-400",
    icon: Wheat,
    desc: "Intercrop + trees for cashflow",
  },
  {
    id: "native",
    label: "Native biodiversity",
    short: "Native",
    color: "#2e3923",
    bg: "bg-olive-900",
    border: "border-olive-800",
    icon: Flower2,
    desc: "Restoration patches & habitat",
  },
  {
    id: "water",
    label: "Water / wetland",
    short: "Water",
    color: "#3d6b8c",
    bg: "bg-sky-700",
    border: "border-sky-600",
    icon: Droplets,
    desc: "Pond, swale, recharge zone",
  },
  {
    id: "infrastructure",
    label: "Access & facilities",
    short: "Infra",
    color: "#8c6150",
    bg: "bg-brown-600",
    border: "border-brown-500",
    icon: Factory,
    desc: "Roads, nursery, storage",
  },
  {
    id: "buffer",
    label: "Buffer / edge",
    short: "Buffer",
    color: "#a8bc8a",
    bg: "bg-olive-300",
    border: "border-olive-300",
    icon: Layers,
    desc: "Windbreak & boundary belt",
  },
];

const GRID = 8; // 8x8 cells

function SimulateContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const landId = params.get("land_id") || "LAND-DEMO";
  const location = params.get("location") || "Selected parcel";
  const soil = params.get("soil") || "Mixed soil";
  const owner = params.get("owner") || "";
  const baseArea = Math.max(1, parseFloat(params.get("area") || "12.5") || 12.5);
  const health = params.get("health") || "—";

  const [areaHa, setAreaHa] = useState(baseArea);
  const [activeZone, setActiveZone] = useState<ZoneType>("plantation");
  const [cells, setCells] = useState<(ZoneType | null)[]>(() =>
    Array(GRID * GRID).fill(null)
  );
  const [brush, setBrush] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  const isCorporate =
    user?.subscription_tier === "corporate_access" ||
    user?.user_type === "corporate";

  const paint = useCallback(
    (index: number) => {
      setCells((prev) => {
        const next = [...prev];
        next[index] = brush ? activeZone : null;
        return next;
      });
    },
    [activeZone, brush]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    ZONES.forEach((z) => (c[z.id] = 0));
    cells.forEach((cell) => {
      if (cell) c[cell] = (c[cell] || 0) + 1;
    });
    return c;
  }, [cells]);

  const filled = cells.filter(Boolean).length;
  const cellHa = areaHa / (GRID * GRID);

  const zoneHa = (id: ZoneType) => counts[id] * cellHa;

  const reset = () => setCells(Array(GRID * GRID).fill(null));

  const autoLayout = () => {
    // Rough smart default: edges buffer, corner water, center plantation + agro
    const next: (ZoneType | null)[] = Array(GRID * GRID).fill(null);
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const i = r * GRID + c;
        const edge = r === 0 || c === 0 || r === GRID - 1 || c === GRID - 1;
        if (edge) next[i] = "buffer";
        else if (r < 2 && c < 2) next[i] = "water";
        else if (r >= 2 && r <= 4 && c >= 2 && c <= 5) next[i] = "plantation";
        else if (c >= 5) next[i] = "agroforestry";
        else if (r >= 5) next[i] = "native";
        else next[i] = "infrastructure";
      }
    }
    setCells(next);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 pt-20">
        <div className="max-w-md rounded-2xl border border-olive-100 bg-white p-8 text-center shadow-sm">
          <Lock className="mx-auto h-8 w-8 text-olive-600" />
          <h1 className="mt-4 text-xl font-semibold text-olive-950">Sign in required</h1>
          <p className="mt-2 text-sm text-olive-600">
            Corporate land simulation is available after sign-in.
          </p>
          <Link href="/auth" className="mt-6 inline-block">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isCorporate && user.subscription_tier !== "corporate_access") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4 pt-20">
        <div className="max-w-md rounded-2xl border border-olive-100 bg-white p-8 text-center shadow-sm">
          <Sparkles className="mx-auto h-8 w-8 text-brown-500" />
          <h1 className="mt-4 text-xl font-semibold text-olive-950">
            Corporate simulation
          </h1>
          <p className="mt-2 text-sm text-olive-600">
            Interactive area planning is a Corporate Access feature. Subscribe on the
            marketplace to unlock simulations for any listing.
          </p>
          <Link href="/marketplace" className="mt-6 inline-block">
            <Button>Go to marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/marketplace")}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-olive-600 hover:text-olive-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to marketplace
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-olive-200 bg-olive-50 px-3 py-1 text-[11px] font-semibold text-olive-800">
              <LayoutGrid className="h-3.5 w-3.5" />
              Corporate land simulation
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-olive-950 sm:text-3xl">
              Area plan · {location}
            </h1>
            <p className="mt-1 text-sm text-olive-600">
              <span className="font-mono text-brown-600">{landId}</span>
              {owner ? ` · @${owner}` : ""} · Soil {soil} · Health {health}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={autoLayout} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Auto layout
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={reset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: controls */}
          <div className="space-y-5 lg:col-span-4">
            {/* Area estimator */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 text-olive-900">
                <Ruler className="h-4 w-4 text-brown-500" />
                <h2 className="text-sm font-bold">Land size estimator</h2>
              </div>
              <p className="mt-1 text-xs text-olive-600">
                Adjust usable area for this scenario (listing baseline: {baseArea} ha).
              </p>
              <div className="mt-4">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-olive-950">
                    {areaHa.toFixed(1)}
                  </span>
                  <span className="text-sm text-olive-600">hectares</span>
                </div>
                <input
                  type="range"
                  min={Math.max(1, baseArea * 0.25)}
                  max={baseArea * 1.5}
                  step={0.1}
                  value={areaHa}
                  onChange={(e) => setAreaHa(parseFloat(e.target.value))}
                  className="mt-3 w-full accent-olive-700"
                />
                <div className="mt-1 flex justify-between text-[10px] text-olive-500">
                  <span>{(baseArea * 0.25).toFixed(1)} ha</span>
                  <span>listing {baseArea} ha</span>
                  <span>{(baseArea * 1.5).toFixed(1)} ha</span>
                </div>
              </div>
              <p className="mt-3 rounded-xl bg-cream-100 px-3 py-2 text-[11px] text-olive-700">
                Each grid cell ≈ <strong>{cellHa.toFixed(3)} ha</strong> (
                {(cellHa * 2.471).toFixed(2)} acres)
              </p>
            </motion.div>

            {/* Zone palette */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
            >
              <h2 className="text-sm font-bold text-olive-900">Paint zones</h2>
              <p className="mt-1 text-xs text-olive-600">
                Select a zone, then click or drag on the grid to paint your rough plan.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBrush(true)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
                    brush
                      ? "bg-olive-800 text-cream-50"
                      : "border border-olive-200 bg-cream-50 text-olive-800"
                  }`}
                >
                  Paint
                </button>
                <button
                  type="button"
                  onClick={() => setBrush(false)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
                    !brush
                      ? "bg-olive-800 text-cream-50"
                      : "border border-olive-200 bg-cream-50 text-olive-800"
                  }`}
                >
                  Erase
                </button>
              </div>
              <div className="mt-3 grid gap-2">
                {ZONES.map((z) => {
                  const Icon = z.icon;
                  const active = activeZone === z.id && brush;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => {
                        setActiveZone(z.id);
                        setBrush(true);
                      }}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? "border-olive-800 bg-olive-50 ring-2 ring-olive-800/20"
                          : "border-olive-100 bg-white hover:border-olive-300"
                      }`}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: z.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-olive-950">
                          {z.label}
                        </span>
                        <span className="block text-[10px] text-olive-600">{z.desc}</span>
                      </span>
                      <span className="text-xs font-bold text-olive-800">
                        {zoneHa(z.id).toFixed(1)} ha
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Mix summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-brown-500" />
                <h2 className="text-sm font-bold text-olive-900">Area mix</h2>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-olive-100 flex">
                {ZONES.map((z) => {
                  const pct = filled ? (counts[z.id] / (GRID * GRID)) * 100 : 0;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={z.id}
                      style={{ width: `${pct}%`, backgroundColor: z.color }}
                      title={`${z.label}: ${zoneHa(z.id).toFixed(2)} ha`}
                    />
                  );
                })}
              </div>
              <ul className="mt-3 space-y-1.5">
                {ZONES.filter((z) => counts[z.id] > 0).map((z) => (
                  <li
                    key={z.id}
                    className="flex items-center justify-between text-[11px] text-olive-700"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: z.color }}
                      />
                      {z.short}
                    </span>
                    <span className="font-semibold text-olive-900">
                      {zoneHa(z.id).toFixed(2)} ha ·{" "}
                      {((counts[z.id] / (GRID * GRID)) * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
                {filled === 0 && (
                  <li className="text-xs text-olive-500">Paint the grid to see the mix.</li>
                )}
              </ul>
              <p className="mt-3 text-[11px] text-olive-500">
                Planned {((filled / (GRID * GRID)) * areaHa).toFixed(1)} ha of{" "}
                {areaHa.toFixed(1)} ha · {filled}/{GRID * GRID} cells
              </p>
            </motion.div>
          </div>

          {/* Right: interactive grid */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-olive-100 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-olive-950">Interactive parcel canvas</h2>
                  <p className="text-xs text-olive-600">
                    Click or drag to paint · rough layout only (not a survey plan)
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-olive-600">
                  <Home className="h-3.5 w-3.5" />
                  N ↑ orientative
                </div>
              </div>

              {/* Canvas frame */}
              <div className="relative mx-auto aspect-square w-full max-w-xl select-none">
                {/* soft ground */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-olive-100 via-cream-100 to-olive-50" />
                <div
                  className="relative grid h-full w-full gap-1 rounded-2xl p-2"
                  style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
                  onMouseLeave={() => setIsDrawing(false)}
                >
                  {cells.map((cell, i) => {
                    const zone = ZONES.find((z) => z.id === cell);
                    return (
                      <motion.button
                        key={i}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onMouseDown={() => {
                          setIsDrawing(true);
                          paint(i);
                        }}
                        onMouseEnter={() => {
                          if (isDrawing) paint(i);
                        }}
                        onMouseUp={() => setIsDrawing(false)}
                        onClick={() => paint(i)}
                        className={`relative aspect-square rounded-md border transition ${
                          cell
                            ? "border-white/30 shadow-sm"
                            : "border-olive-200/60 bg-white/40 hover:bg-white/70"
                        }`}
                        style={
                          cell
                            ? { backgroundColor: zone?.color }
                            : undefined
                        }
                        title={zone ? zone.label : "Empty"}
                      >
                        {cell && (
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
                            {zone && <zone.icon className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {ZONES.map((z) => (
                  <div key={z.id} className="flex items-center gap-1.5 text-[10px] text-olive-700">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: z.color }}
                    />
                    {z.short}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-olive-100 pt-4">
                <Link
                  href={`/analyze?location=${encodeURIComponent(location)}&area=${areaHa}&soil=${encodeURIComponent(soil)}`}
                >
                  <Button className="gap-2">
                    Run AI audit on this area
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </Link>
                {owner && (
                  <Link href="/marketplace">
                    <Button variant="outline">Message @{owner} on marketplace</Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimulatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream-50 pt-20">
          <p className="text-olive-700">Loading simulation…</p>
        </div>
      }
    >
      <SimulateContent />
    </Suspense>
  );
}
