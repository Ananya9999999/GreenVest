"use client";

import { motion } from "framer-motion";
import { CloudRain, Leaf, TrendingUp, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="page-enter mesh-bg pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-olive-950">Monitoring</h1>
          <p className="mt-1 text-olive-700/80">
            Track growth, carbon, and planting alerts for selected strategies.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Leaf, label: "Vegetation index", value: "+12%", sub: "vs last month" },
            { icon: TrendingUp, label: "Carbon to date", value: "142 tCO₂e", sub: "Year 1" },
            { icon: CloudRain, label: "Next plant window", value: "4–6 days", sub: "Soil moisture rising" },
            { icon: AlertTriangle, label: "Climate risk", value: "4.5 / 10", sub: "Moderate" },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
            >
              <c.icon className="h-5 w-5 text-brown-500" />
              <p className="mt-3 text-sm text-olive-600">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-olive-900">{c.value}</p>
              <p className="text-xs text-olive-500">{c.sub}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 rounded-2xl border border-olive-100 bg-white p-6 shadow-sm"
        >
          <h2 className="font-semibold text-olive-900">Recent alerts</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3 rounded-xl bg-olive-50 px-4 py-3">
              <CloudRain className="h-5 w-5 shrink-0 text-olive-600" />
              <div>
                <p className="font-medium text-olive-900">Planting window opening</p>
                <p className="text-olive-600">
                  Ideal conditions in 4–6 days for native mixed forest. WhatsApp sent.
                </p>
              </div>
            </li>
            <li className="flex gap-3 rounded-xl bg-cream-100 px-4 py-3">
              <Leaf className="h-5 w-5 shrink-0 text-brown-600" />
              <div>
                <p className="font-medium text-olive-900">Vegetation growth on track</p>
                <p className="text-olive-600">NDVI trend positive for selected parcels.</p>
              </div>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
