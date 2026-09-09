"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Leaf,
  Target,
  Users,
  Handshake,
  LineChart,
  Globe2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const pillars = [
  {
    icon: Target,
    title: "Decision intelligence",
    text: "We score land and rank plantation strategies so owners and capital share one clear picture — health, carbon potential, cost, and risk.",
  },
  {
    icon: Handshake,
    title: "Match, don’t mediate",
    text: "Unique @userids and LandIDs let parties connect peer-to-peer. GreenVest does not broker land deals or take escrow cuts.",
  },
  {
    icon: Globe2,
    title: "Climate + returns",
    text: "Built for India-first geospatial context: soil, proximity, and strategies that balance ecological impact with practical investment.",
  },
];

const team = [
  { role: "Product & payments", focus: "Subscriptions, trust, commercial path" },
  { role: "Weather & alerts", focus: "Live forecasts, planting windows" },
  { role: "Maps & experience", focus: "Interactive discovery & marketplace map" },
  { role: "Geospatial data", focus: "Soil, proximity, land health signals" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-olive-100 pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-olive-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-cream-400/30 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-olive-800 text-cream-50">
              <Leaf className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brown-600">
              About GreenVest
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-olive-950 sm:text-4xl lg:text-5xl">
              Unlock every acre for{" "}
              <span className="bg-gradient-to-r from-olive-700 to-brown-600 bg-clip-text text-transparent">
                returns and climate impact.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-olive-700">
              GreenVest is a land intelligence platform. We help landowners and climate
              capital discover potential, understand environmental conditions, and decide
              how to invest — then connect directly via @userid.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-olive-950 sm:text-3xl">Our mission</h2>
              <p className="mt-4 text-sm leading-relaxed text-olive-700 sm:text-base">
                Millions of acres are underused because owners lack a clear, data-backed
                view of climate-positive options — and investors cannot compare parcels
                on health, carbon, and strategy fit. We built GreenVest to close that gap
                with scores, AI-ranked strategies, and a marketplace that prioritises
                transparency over intermediation.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-olive-700 sm:text-base">
                Estimates support decisions; they are not certified carbon credits or
                guaranteed financial returns. Users remain responsible for diligence and
                deal terms.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: LineChart, label: "Land Health Score", desc: "Soil, climate, vegetation, proximity" },
                { icon: Users, label: "Credit Score", desc: "Platform standing for trust signals" },
                { icon: Target, label: "AI strategies", desc: "Carbon, ROI, and balanced paths" },
                { icon: Handshake, label: "P2P matching", desc: "Message via @userid & LandID" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border border-olive-100 bg-white p-4 shadow-sm"
                >
                  <item.icon className="h-5 w-5 text-olive-700" />
                  <h3 className="mt-2 text-sm font-semibold text-olive-950">{item.label}</h3>
                  <p className="mt-1 text-xs text-olive-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-olive-100 bg-olive-50/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-olive-950 sm:text-3xl">
            What we believe
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-olive-100 bg-white p-6 shadow-sm"
              >
                <p.icon className="h-6 w-6 text-brown-500" />
                <h3 className="mt-4 text-lg font-semibold text-olive-950">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-olive-600">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-olive-950 sm:text-3xl">Built by a focused team</h2>
          <p className="mt-2 max-w-xl text-sm text-olive-600">
            Four tracks — product, data, maps, and intelligence — shipping one decision loop
            for land and climate capital.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((t, i) => (
              <motion.div
                key={t.role}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-brown-600">
                  Track {i + 1}
                </p>
                <h3 className="mt-2 font-semibold text-olive-950">{t.role}</h3>
                <p className="mt-1 text-xs text-olive-600">{t.focus}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl bg-olive-900 px-8 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-bold text-cream-50 sm:text-3xl">
              Ready to explore land potential?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-cream-200/90">
              Create your @userid, score a parcel, or browse the marketplace with corporate access.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/auth">
                <Button className="gap-2 bg-cream-100 text-olive-900 hover:bg-cream-50">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" className="border-cream-400/40 text-cream-50 hover:bg-olive-800">
                  View marketplace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
