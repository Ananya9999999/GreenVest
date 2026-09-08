"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  Leaf,
  Building2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const PLANS = [
  {
    id: "free",
    name: "Free Explorer",
    price: 0,
    priceLabel: "Rs.0",
    period: "forever",
    color: "olive",
    highlight: false,
    description: "Analyse your own land, check your GreenVest credit score, and explore the ecosystem.",
    features: [
      "GreenVest Credit Score + breakdown",
      "AI Agroforestry Strategy Planner",
      "Land and carbon analysis (own parcels)",
      "Satellite telemetry dashboard",
      "Community data access",
    ],
    locked: [
      "Publish parcels on Marketplace",
      "Browse Verified Land Marketplace",
      "Direct P2P messaging",
    ],
    cta: "Get Started Free",
    href: "/auth",
    planType: null as null,
  },
  {
    id: "landowner_listing",
    name: "Landowner Listing Pass",
    price: 1999,
    priceLabel: "Rs.1,999",
    period: "/ year",
    color: "emerald",
    highlight: true,
    description: "Publish your verified parcels with sovereign LandIDs and connect with ESG corporates.",
    features: [
      "Everything in Free Explorer",
      "Unlimited parcel listings (unique LandIDs)",
      "Automated Land Health Score (0-100)",
      "Direct P2P inquiries from ESG corporates",
      "Subscription credit score bonus (+15 pts)",
      "Dashboard inbox for corporate messages",
    ],
    locked: [] as string[],
    cta: "Pay Rs.1,999 via Razorpay",
    href: null,
    planType: "landowner_listing" as const,
  },
  {
    id: "corporate_access",
    name: "Corporate Access Pass",
    price: 9999,
    priceLabel: "Rs.9,999",
    period: "/ year",
    color: "blue",
    highlight: false,
    description: "Browse every verified land listing, message landowners directly, and build your ESG land portfolio.",
    features: [
      "Everything in Free Explorer",
      "Unlimited marketplace browsing",
      "Direct P2P messaging with all landowners",
      "ESG-verified portfolio matchmaking",
      "Subscription credit score bonus (+15 pts)",
      "Priority listing visibility",
    ],
    locked: [] as string[],
    cta: "Pay Rs.9,999 via Razorpay",
    href: null,
    planType: "corporate_access" as const,
  },
];

type ColorKey = "olive" | "emerald" | "blue";

const colorMap: Record<ColorKey, { border: string; bg: string; badge: string; btn: string; check: string; ring: string }> = {
  olive: {
    border: "border-olive-200",
    bg: "bg-olive-50/40",
    badge: "bg-olive-100 text-olive-800",
    btn: "bg-olive-800 hover:bg-olive-700 text-cream-50",
    check: "text-olive-600",
    ring: "",
  },
  emerald: {
    border: "border-emerald-300",
    bg: "bg-emerald-50/40",
    badge: "bg-emerald-100 text-emerald-800",
    btn: "bg-emerald-800 hover:bg-emerald-700 text-white",
    check: "text-emerald-600",
    ring: "ring-2 ring-emerald-400",
  },
  blue: {
    border: "border-blue-200",
    bg: "bg-blue-50/40",
    badge: "bg-blue-100 text-blue-800",
    btn: "bg-blue-800 hover:bg-blue-700 text-white",
    check: "text-blue-600",
    ring: "",
  },
};

export default function PricingPage() {
  const { user, initiateRazorpayPayment } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planType: "landowner_listing" | "corporate_access") => {
    setLoadingPlan(planType);
    try {
      await initiateRazorpayPayment(planType, {
        onSuccess: () => setLoadingPlan(null),
        onCancel: () => setLoadingPlan(null),
      });
    } catch {
      setLoadingPlan(null);
    }
  };

  const currentTier = user?.subscription_tier ?? null;

  return (
    <div className="page-enter mesh-bg pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-olive-200 bg-olive-50/70 px-3 py-1 text-xs font-semibold text-olive-800 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-olive-600" />
            Transparent - No Intermediation Fees
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-olive-950 sm:text-4xl">
            Simple, Sovereign Pricing
          </h1>
          <p className="mt-3 text-sm text-olive-700/80 max-w-xl mx-auto">
            GreenVest connects landowners and ESG corporates peer-to-peer. Pay once a year. No hidden fees. No transaction cuts.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan, i) => {
            const c = colorMap[plan.color as ColorKey];
            const isActive = currentTier === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative flex flex-col rounded-2xl border ${c.border} ${c.bg} ${c.ring} p-6 shadow-sm`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-700 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                      Most Popular
                    </span>
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-3 right-4">
                    <span className="rounded-full bg-olive-800 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream-50 shadow">
                      Your Plan
                    </span>
                  </div>
                )}

                <div className={`inline-flex items-center gap-2 rounded-xl ${c.badge} px-2.5 py-1 text-xs font-bold w-fit mb-4`}>
                  {plan.id === "free" && <Leaf className="h-3.5 w-3.5" />}
                  {plan.id === "landowner_listing" && <TrendingUp className="h-3.5 w-3.5" />}
                  {plan.id === "corporate_access" && <Building2 className="h-3.5 w-3.5" />}
                  {plan.name}
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black text-olive-950">{plan.priceLabel}</span>
                  <span className="text-xs text-olive-600">{plan.period}</span>
                </div>
                <p className="text-xs text-olive-700 leading-relaxed mb-5">{plan.description}</p>

                <div className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-xs text-olive-800">
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${c.check}`} />
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.locked.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-xs text-olive-400 line-through">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-olive-300" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {plan.planType ? (
                  isActive ? (
                    <div className="rounded-xl border border-olive-200 bg-white/80 py-2.5 text-center text-xs font-bold text-olive-700">
                      <ShieldCheck className="inline h-3.5 w-3.5 mr-1 text-emerald-600" />
                      Active Subscription
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={loadingPlan === plan.planType || !user}
                        onClick={() => handleCheckout(plan.planType!)}
                        className={`w-full rounded-xl py-2.5 text-sm font-bold transition ${c.btn} disabled:opacity-60`}
                      >
                        {loadingPlan === plan.planType ? "Processing..." : plan.cta}
                      </button>
                      {!user && (
                        <p className="mt-2 text-center text-[10px] text-olive-500">
                          <Link href="/auth" className="underline">Sign in</Link> to subscribe
                        </p>
                      )}
                    </>
                  )
                ) : (
                  <Link
                    href={user ? "/dashboard" : "/auth"}
                    className={`block w-full rounded-xl py-2.5 text-center text-sm font-bold transition ${c.btn}`}
                  >
                    {user ? "Go to Dashboard" : plan.cta}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-olive-600"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-olive-500" />
            Razorpay Secured Payments
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-olive-500" />
            Instant activation on payment
          </div>
          <div className="flex items-center gap-1.5">
            <Leaf className="h-4 w-4 text-olive-500" />
            Annual subscription (cancel anytime)
          </div>
        </motion.div>
      </div>
    </div>
  );
}
