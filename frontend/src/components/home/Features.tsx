"use client";

import { Card } from "@/components/ui/Card";
import {
  Map,
  Satellite,
  Brain,
  CloudRain,
  Store,
  LineChart,
} from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Land Discovery",
    desc: "Own land or explore marketplace listings ranked by health, carbon, and fit.",
  },
  {
    icon: Satellite,
    title: "Geospatial Intelligence",
    desc: "ISRO & satellite layers power Land Health Scores, soil type, and proximity.",
  },
  {
    icon: Brain,
    title: "AI Land Advisor",
    desc: "Top 3 plantation strategies ranked by your weights: carbon, ROI, risk, more.",
  },
  {
    icon: CloudRain,
    title: "Planting-Window Alerts",
    desc: "Live weather vs species windows — plant now or wait, via app and WhatsApp.",
  },
  {
    icon: Store,
    title: "Marketplace",
    desc: "Browse opportunities with UserID tracking, scores, and full deep-dive analysis.",
  },
  {
    icon: LineChart,
    title: "Carbon & Investment",
    desc: "5/10/20 year sequestration, credit potential, cost calculator, and climate risk.",
  },
];

export function Features() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-olive-950 sm:text-4xl">
            One engine. Real-world inputs.
          </h2>
          <p className="mt-3 text-lg text-olive-700/80">
            What the land is, what it&apos;s near, and what the weather is about
            to do — feeding sharper recommendations.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={f.title} delay={i * 0.08}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-olive-100 text-olive-800">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-olive-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-olive-600">
                {f.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
