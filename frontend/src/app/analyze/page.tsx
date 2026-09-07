"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { MessageCircle } from "lucide-react";

const strategies = [
  {
    id: "A",
    title: "Maximum Carbon",
    approach: "Native mixed forest",
    rank: 1,
    score: 8.2,
    roi: 6,
    risk: "Low",
    species: ["Native hardwoods", "Clumping bamboo", "N-fixing trees"],
    investment: "₹2.5L",
    color: "bg-olive-800",
  },
  {
    id: "B",
    title: "Maximum ROI",
    approach: "Commercial agroforestry",
    rank: 3,
    score: 6.1,
    roi: 14,
    risk: "Medium",
    species: ["Teak", "Fruit trees", "Intercrops"],
    investment: "₹3.1L",
    color: "bg-brown-600",
  },
  {
    id: "C",
    title: "Balanced",
    approach: "Carbon + ROI + biodiversity",
    rank: 2,
    score: 7.4,
    roi: 10,
    risk: "Low",
    species: ["Mixed native + commercial", "Agroforestry strips"],
    investment: "₹2.7L",
    color: "bg-olive-600",
  },
];

export default function AnalyzePage() {
  const [weights, setWeights] = useState({
    carbon: 8,
    roi: 6,
    risk: 7,
    biodiversity: 7,
    water: 5,
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "bot",
      text: "I know this land and the recommendations. Ask about strategy, planting windows, ROI, or risk.",
    },
  ]);
  const [input, setInput] = useState("");

  const setW = (k: keyof typeof weights, v: number) =>
    setWeights((w) => ({ ...w, [k]: v }));

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      let reply =
        "I can help with the recommendation, ROI, risk, carbon, costs, or planting windows.";
      const lower = q.toLowerCase();
      if (lower.includes("why") || lower.includes("recommend"))
        reply =
          "Maximum Carbon ranked highest for your weights. Native mixed forest fits the soil and health score of 82.";
      else if (
        lower.includes("plant") ||
        lower.includes("when") ||
        lower.includes("weather")
      )
        reply =
          "Soil moisture is rising. Ideal window opens in 4–6 days if no heavy rain. WhatsApp alert enabled.";
      else if (lower.includes("roi") || lower.includes("return"))
        reply =
          "Expected ROI: Max Carbon ~6%, Balanced ~10%, Max ROI ~14%. Your priorities lean carbon.";
      else if (lower.includes("risk") || lower.includes("safe"))
        reply =
          "Safest: Maximum Carbon and Balanced (Low risk). Max ROI is Medium.";
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    }, 600);
  };

  return (
    <div className="page-enter mesh-bg pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-olive-950">Land analysis</h1>
          <p className="mt-1 text-olive-700/80">
            Sample parcel · Nashik · 12.5 ha · Health Score{" "}
            <span className="font-semibold text-olive-800">82/100</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-olive-100 bg-white p-6 shadow-sm"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-olive-800 text-3xl font-bold text-cream-50">
            82
          </div>
          <div>
            <p className="font-semibold text-olive-900">
              Land Health Score — High Potential
            </p>
            <p className="mt-1 text-sm text-olive-600">
              Soil · Water · Climate · Vegetation · Terrain · Proximity
            </p>
            <p className="mt-2 text-xs text-brown-600">
              Black soil · ~4 km to market road
            </p>
          </div>
        </motion.div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-olive-900">Your priorities</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["carbon", "Carbon"],
                ["roi", "ROI"],
                ["risk", "Low risk"],
                ["biodiversity", "Biodiversity"],
                ["water", "Water"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="rounded-xl border border-olive-100 bg-white p-4"
              >
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-olive-800">{label}</span>
                  <span className="text-brown-600">{weights[key]}/10</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={weights[key]}
                  onChange={(e) => setW(key, Number(e.target.value))}
                  className="mt-3 w-full accent-olive-700"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-olive-900">Top 3 strategies</h2>
          <div className="mt-4 grid gap-5 lg:grid-cols-3">
            {strategies
              .sort((a, b) => a.rank - b.rank)
              .map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="card-lift rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-cream-50 ${s.color}`}
                    >
                      #{s.rank}
                    </span>
                    <div>
                      <h3 className="font-semibold text-olive-900">{s.title}</h3>
                      <p className="text-sm text-olive-600">{s.approach}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-olive-700">
                    <p>
                      Score: <strong>{s.score}</strong> · ROI ~{s.roi}% · Risk{" "}
                      {s.risk}
                    </p>
                    <p>Investment: {s.investment}</p>
                    <p className="text-olive-600">{s.species.join(" · ")}</p>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    variant={s.rank === 1 ? "primary" : "outline"}
                  >
                    {s.rank === 1 ? "Best match — select" : "Select strategy"}
                  </Button>
                </motion.div>
              ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          {[
            { y: "5 yr", v: "683 tCO₂e" },
            { y: "10 yr", v: "1,365 tCO₂e" },
            { y: "20 yr", v: "2,730 tCO₂e" },
          ].map((c) => (
            <div
              key={c.y}
              className="rounded-xl border border-olive-100 bg-olive-900 px-5 py-4 text-cream-50"
            >
              <p className="text-xs text-cream-300">Cumulative · {c.y}</p>
              <p className="mt-1 text-xl font-bold">{c.v}</p>
            </div>
          ))}
        </motion.div>

        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-olive-800 text-cream-50 shadow-lg transition hover:scale-105 hover:bg-olive-700"
          aria-label="Open AI assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>

        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 right-6 z-50 flex h-[420px] w-[340px] flex-col overflow-hidden rounded-2xl border border-olive-200 bg-white shadow-2xl sm:w-[380px]"
            >
              <div className="flex items-center justify-between bg-olive-900 px-4 py-3 text-cream-50">
                <span className="font-medium">AI Land Assistant</span>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="text-cream-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "ml-auto bg-olive-800 text-cream-50"
                        : "bg-cream-100 text-olive-900"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-olive-100 p-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask about this land..."
                  className="flex-1 rounded-full border border-olive-200 px-3 py-2 text-sm outline-none focus:border-olive-500"
                />
                <Button size="sm" onClick={send}>
                  Send
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
