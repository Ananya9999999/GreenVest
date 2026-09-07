"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Ruler, Wallet, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function DiscoverPage() {
  const [form, setForm] = useState({
    location: "",
    area: "",
    budget: "",
    horizon: "10",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="page-enter mesh-bg pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-olive-950 sm:text-4xl">
            Analyze your land
          </h1>
          <p className="mt-2 text-olive-700/80">
            Enter details to unlock health score, AI strategies, and forecasts.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-10 space-y-5 rounded-2xl border border-olive-100 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8"
          onSubmit={(e) => e.preventDefault()}
        >
          {[
            { key: "location", label: "Location", icon: MapPin, placeholder: "e.g. Nashik, Maharashtra", type: "text" },
            { key: "area", label: "Area (hectares)", icon: Ruler, placeholder: "12.5", type: "number" },
            { key: "budget", label: "Budget (₹)", icon: Wallet, placeholder: "500000", type: "number" },
          ].map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-olive-800">
                <field.icon className="h-4 w-4 text-brown-500" />
                {field.label}
              </label>
              <input
                type={field.type}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-olive-200 bg-cream-50 px-4 py-3 text-olive-900 outline-none transition focus:border-olive-500 focus:ring-2 focus:ring-olive-200"
              />
            </div>
          ))}

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-olive-800">
              <Calendar className="h-4 w-4 text-brown-500" />
              Investment horizon (years)
            </label>
            <select
              value={form.horizon}
              onChange={(e) => update("horizon", e.target.value)}
              className="w-full rounded-xl border border-olive-200 bg-cream-50 px-4 py-3 text-olive-900 outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-200"
            >
              <option value="5">5 years</option>
              <option value="10">10 years</option>
              <option value="15">15 years</option>
              <option value="20">20+ years</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/analyze">
              <Button type="button" size="lg">
                Run analysis
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button type="button" variant="outline" size="lg">
                Or browse marketplace
              </Button>
            </Link>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
