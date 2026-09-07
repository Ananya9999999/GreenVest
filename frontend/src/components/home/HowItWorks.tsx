"use client";

import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Select land", desc: "Enter your parcel or browse the marketplace." },
  { n: "02", title: "Classify & score", desc: "Soil, satellite, proximity → Land Health Score." },
  { n: "03", title: "Set priorities", desc: "Weight carbon, ROI, risk, biodiversity, water." },
  { n: "04", title: "Get strategies", desc: "AI ranks top 3 approaches for your goals." },
  { n: "05", title: "Carbon & cost", desc: "Forecasts, credits, investment, climate risk." },
  { n: "06", title: "Plant & monitor", desc: "Weather alerts + ongoing land health tracking." },
];

export function HowItWorks() {
  return (
    <section className="border-y border-olive-100 bg-olive-50/50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-olive-950 sm:text-4xl">
          From discovery to decision
        </h2>
        <p className="mt-3 max-w-xl text-olive-700/80">
          A continuous path powered by geospatial data, AI, and live weather.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              className="rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
            >
              <span className="text-sm font-bold text-brown-500">{s.n}</span>
              <h3 className="mt-2 font-semibold text-olive-900">{s.title}</h3>
              <p className="mt-1 text-sm text-olive-600">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
