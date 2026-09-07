"use client";

import { motion } from "framer-motion";
import { MapPin, Leaf, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { MarketplaceListing } from "@/types";

const listings: MarketplaceListing[] = [
  { id: "1", userId: "GV-MK-001", location: "Nashik, MH", areaHectares: 12.5, healthScore: 82, carbonPotential: 9.2, soilType: "Black soil", priceHint: "₹4.2L/ha" },
  { id: "2", userId: "GV-MK-002", location: "Coimbatore, TN", areaHectares: 8.0, healthScore: 76, carbonPotential: 7.8, soilType: "Red loam", priceHint: "₹3.8L/ha" },
  { id: "3", userId: "GV-MK-003", location: "Pune rural, MH", areaHectares: 20.0, healthScore: 88, carbonPotential: 9.5, soilType: "Alluvial", priceHint: "₹5.1L/ha" },
  { id: "4", userId: "GV-MK-004", location: "Mysuru, KA", areaHectares: 6.2, healthScore: 71, carbonPotential: 6.5, soilType: "Sandy loam", priceHint: "₹3.2L/ha" },
  { id: "5", userId: "GV-MK-005", location: "Indore, MP", areaHectares: 15.0, healthScore: 79, carbonPotential: 8.4, soilType: "Black soil", priceHint: "₹3.9L/ha" },
  { id: "6", userId: "GV-MK-006", location: "Warangal, TS", areaHectares: 10.5, healthScore: 74, carbonPotential: 7.1, soilType: "Red soil", priceHint: "₹2.9L/ha" },
];

export default function MarketplacePage() {
  return (
    <div className="page-enter mesh-bg pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-olive-950 sm:text-4xl">
            Land Marketplace
          </h1>
          <p className="mt-2 text-olive-700/80">
            Browse opportunities ranked by health score, carbon potential, and fit.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              className="card-lift group rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-brown-500">{item.userId}</p>
                  <h3 className="mt-1 flex items-center gap-1.5 font-semibold text-olive-900">
                    <MapPin className="h-4 w-4 text-olive-500" />
                    {item.location}
                  </h3>
                </div>
                <span className="rounded-full bg-olive-100 px-2.5 py-1 text-xs font-bold text-olive-800">
                  {item.healthScore}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-olive-500">Area</span>
                  <p className="font-medium text-olive-900">{item.areaHectares} ha</p>
                </div>
                <div>
                  <span className="text-olive-500">Soil</span>
                  <p className="font-medium text-olive-900">{item.soilType}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Leaf className="h-3.5 w-3.5 text-olive-500" />
                  <span className="font-medium text-olive-900">
                    Carbon {item.carbonPotential}/10
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-brown-500" />
                  <span className="font-medium text-olive-900">{item.priceHint}</span>
                </div>
              </div>

              <Link
                href={`/analyze?location=${encodeURIComponent(item.location)}&area=${item.areaHectares}&soil=${encodeURIComponent(item.soilType)}`}
                className="mt-5 block rounded-xl bg-olive-800 py-2.5 text-center text-sm font-medium text-cream-50 transition group-hover:bg-olive-700"
              >
                Analyze this land
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
