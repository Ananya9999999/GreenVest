"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden mesh-bg pt-28 pb-20 sm:pt-32 sm:pb-28">
      {/* Floating orbs */}
      <motion.div
        animate={{ y: [0, -16, 0], x: [0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-olive-300/30 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 12, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-cream-400/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-3xl"
        >
          <motion.div
            variants={item}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-olive-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-olive-700 shadow-sm backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-brown-500" />
            Land intelligence · Carbon · Investment
          </motion.div>

          <motion.h1
            variants={item}
            className="text-4xl font-bold tracking-tight text-olive-950 sm:text-5xl lg:text-6xl"
          >
            Discover the potential{" "}
            <span className="bg-gradient-to-r from-olive-700 to-brown-600 bg-clip-text text-transparent">
              of every acre.
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-lg leading-relaxed text-olive-700/90"
          >
            Geospatial data, AI strategies, live weather alerts, and investment
            analysis — so you invest for returns and climate impact.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-wrap gap-3">
            <Link href="/discover">
              <Button size="lg" className="gap-2">
                Analyze my land
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                Browse marketplace
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-12 flex flex-wrap gap-8 text-sm text-olive-600"
          >
            {[
              { label: "Land Health Score", value: "Satellite-powered" },
              { label: "AI Strategies", value: "Top 3 ranked" },
              { label: "Planting Alerts", value: "WhatsApp ready" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-semibold text-olive-900">{s.value}</div>
                <div className="text-olive-600/80">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
