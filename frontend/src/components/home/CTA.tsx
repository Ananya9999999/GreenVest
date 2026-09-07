"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-olive-900 px-8 py-14 text-center sm:px-12"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brown-500/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-olive-500/20 blur-2xl" />

          <h2 className="relative text-3xl font-bold text-cream-50 sm:text-4xl">
            Ready to unlock your land&apos;s potential?
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-cream-200/90">
            Start with a free Land Health Score — then unlock AI strategies,
            carbon forecasts, and planting alerts.
          </p>
          <div className="relative mt-8 flex justify-center gap-3">
            <Link href="/discover">
              <Button
                size="lg"
                className="bg-cream-100 text-olive-900 hover:bg-cream-50 gap-2"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
