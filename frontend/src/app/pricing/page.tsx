"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Building2,
  TreePine,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

const plans = [
  {
    id: "free" as const,
    name: "Free",
    price: "₹0",
    period: "forever",
    blurb: "Score your own land and explore the product.",
    features: [
      "Unique @userid",
      "Land Health Score (own land)",
      "AI strategies on Discover / Analyze",
      "Dashboard & credit score",
      "No marketplace browse or list",
    ],
    cta: "Current" as const,
    highlight: false,
  },
  {
    id: "landowner_listing" as const,
    name: "Landowner Listing",
    price: "₹1,999",
    period: "per year",
    blurb: "Publish verified parcels and get found by capital.",
    features: [
      "Everything in Free",
      "List land with unique LandID",
      "Marketplace visibility + map pin",
      "Receive P2P messages via @userid",
      "Subscription boost to credit score",
    ],
    cta: "Get listing plan" as const,
    highlight: true,
  },
  {
    id: "corporate_access" as const,
    name: "Corporate Access",
    price: "₹9,999",
    period: "per year",
    blurb: "Browse, message, and simulate area plans.",
    features: [
      "Full marketplace browse + map",
      "Direct message landowners",
      "Corporate area simulation",
      "AI audit on any listing",
      "Subscription boost to credit score",
    ],
    cta: "Get corporate access" as const,
    highlight: false,
  },
];

export default function PricingPage() {
  const { user, initiateRazorpayPayment } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async (planType: "landowner_listing" | "corporate_access") => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    setBusy(planType);
    setError(null);
    setMessage(null);
    try {
      await initiateRazorpayPayment(planType, {
        onSuccess: (res) => {
          setMessage(
            `Plan activated: ${planType === "landowner_listing" ? "Landowner Listing" : "Corporate Access"}. Credit score ${res.credit_score}.`
          );
          setBusy(null);
        },
        onError: (err) => {
          setError(err.message);
          setBusy(null);
        },
        onCancel: () => {
          setError("Payment cancelled.");
          setBusy(null);
        },
      });
      // If demo path resolves without modal, busy cleared in onSuccess
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        // demo subscribe completes inside initiateRazorpayPayment
        setBusy(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-olive-200 bg-olive-50 px-3 py-1 text-xs font-semibold text-olive-800">
            <Sparkles className="h-3.5 w-3.5" />
            Simple subscription pricing
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-olive-950 sm:text-4xl">
            Pay for access — not for intermediation
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-olive-600 sm:text-base">
            GreenVest sells intelligence and marketplace access. We match landowners and
            capital via @userid; we do not take a cut of land deals.
          </p>
        </motion.div>

        {user && (
          <p className="mt-6 text-center text-sm text-olive-700">
            Signed in as <span className="font-semibold">@{user.user_id}</span>
            {" · "}
            Plan:{" "}
            <span className="font-semibold">
              {user.subscription_tier === "free"
                ? "Free"
                : user.subscription_tier === "landowner_listing"
                ? "Landowner Listing"
                : "Corporate Access"}
            </span>
          </p>
        )}

        {message && (
          <p className="mx-auto mt-4 max-w-lg rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p className="mx-auto mt-4 max-w-lg rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${
                plan.highlight
                  ? "border-olive-800 ring-2 ring-olive-800/15"
                  : "border-olive-100"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-olive-800 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream-50">
                  Most popular
                </span>
              )}
              <div className="flex items-center gap-2">
                {plan.id === "corporate_access" ? (
                  <Building2 className="h-5 w-5 text-brown-600" />
                ) : plan.id === "landowner_listing" ? (
                  <TreePine className="h-5 w-5 text-olive-700" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-olive-600" />
                )}
                <h2 className="text-lg font-bold text-olive-950">{plan.name}</h2>
              </div>
              <p className="mt-2 text-sm text-olive-600">{plan.blurb}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-olive-950">{plan.price}</span>
                <span className="text-sm text-olive-500">/ {plan.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-olive-800">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-olive-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.id === "free" ? (
                  <Link href={user ? "/discover" : "/auth"}>
                    <Button variant="outline" className="w-full">
                      {user ? "Go to Discover" : "Create free account"}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full gap-2"
                    disabled={
                      busy === plan.id ||
                      user?.subscription_tier === plan.id
                    }
                    onClick={() =>
                      handleBuy(plan.id as "landowner_listing" | "corporate_access")
                    }
                  >
                    {user?.subscription_tier === plan.id
                      ? "Active"
                      : busy === plan.id
                      ? "Processing…"
                      : plan.cta}
                    {user?.subscription_tier !== plan.id && (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-olive-500">
          Demo mode activates your plan via the backend API (no card needed).
          Live Razorpay only if both{" "}
          <code className="rounded bg-olive-100 px-1">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> and{" "}
          <code className="rounded bg-olive-100 px-1">NEXT_PUBLIC_RAZORPAY_ENABLED=true</code> are set.
        </p>
      </div>
    </div>
  );
}
