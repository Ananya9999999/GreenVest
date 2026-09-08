"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Globe2, Handshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

export default function HomePage() {
  return (
    <div className="mesh-bg min-h-screen">
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-16 top-20 h-72 w-72 rounded-full bg-olive-300/25 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -left-10 bottom-10 h-56 w-56 rounded-full bg-cream-400/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex flex-col items-center"
          >
            <Logo size="lg" showWordmark={false} href="/" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brown-600">
              Our mission
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-olive-950 sm:text-5xl">
              Unlock every acre for{" "}
              <span className="bg-gradient-to-r from-olive-700 to-brown-600 bg-clip-text text-transparent">
                returns and climate impact.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-olive-700 sm:text-lg">
              GreenVest helps landowners and capital find each other with real land data,
              health scores, and AI strategies — then steps back so you deal directly via
              @userid. We match. You decide.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth">
                <Button size="lg" className="gap-2">
                  Sign up
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline">
                  Sign in
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-20 grid gap-5 text-left sm:grid-cols-3"
          >
            {[
              {
                icon: Leaf,
                title: "Know the land",
                desc: "Health scores, soil, carbon potential — grounded in data, not guesswork.",
              },
              {
                icon: Globe2,
                title: "Invest with impact",
                desc: "Strategies ranked for carbon, ROI, risk, and biodiversity on your terms.",
              },
              {
                icon: Handshake,
                title: "Connect peer-to-peer",
                desc: "Unique @userids and LandIDs. We don’t mediate deals — only matching.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-olive-100 bg-white/80 p-5 shadow-sm backdrop-blur"
              >
                <item.icon className="h-5 w-5 text-olive-700" />
                <h3 className="mt-3 font-semibold text-olive-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-olive-600">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
