"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TreePine,
  TrendingUp,
  CloudRain,
  DollarSign,
  Satellite,
  CheckCircle2,
  ShieldCheck,
  Award,
  CreditCard,
  MessageSquare,
  Send,
  Building2,
  RefreshCw,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  fetchSatelliteData,
  fetchUserMessages,
  postDirectMessage,
} from "@/lib/api";
import type {
  StrategyRecommendation,
  SatelliteMonitoringData,
  LandInput,
  DirectMessage,
} from "@/types";

const TIMELINE_MILESTONES = [
  {
    year: "Year 1",
    phase: "Plantation Investment & Site Preparation",
    focus: "Earthwork, perimeter bio-fencing, sub-surface drip setup, and high-density sapling planting.",
    investment: "100% initial capital deployed",
    returns: "Zero commercial yield (establishment phase)",
    carbon: "Roots established (~40 tCO₂e)",
    canopy: "8% canopy cover",
    status: "active",
  },
  {
    year: "Year 3",
    phase: "Early Growth & Intercrop Cashflow",
    focus: "Canopy starts closing; shade suppresses weed competition. First harvest of leguminous/spice intercrops.",
    investment: "Routine low-cost weed & moisture management",
    returns: "First cashflow from intercrops & organic mulch",
    carbon: "Accelerating biomass (~240 tCO₂e)",
    canopy: "28% canopy cover",
    status: "upcoming",
  },
  {
    year: "Year 5",
    phase: "Initial Revenue & 1st Carbon Credit Issuance",
    focus: "Third-party MRV audit (Verra / Gold Standard). Initial carbon credits minted and traded on VCM.",
    investment: "Maintenance self-funded from harvest yields",
    returns: "Significant fruit/bamboo culm thinning + credits",
    carbon: "Significant carbon pool (~680 tCO₂e)",
    canopy: "52% canopy cover",
    status: "upcoming",
  },
  {
    year: "Year 10",
    phase: "Major Carbon Sequestration & Commercial Thinning",
    focus: "Peak annual sequestration rate. Sustainable selective timber thinning generates lump-sum liquidity.",
    investment: "Minimal overhead; established forest micro-climate",
    returns: "Major liquidity event (timber + carbon vintages)",
    carbon: "High-density sequestration (~1,450 tCO₂e)",
    canopy: "78% canopy cover",
    status: "upcoming",
  },
  {
    year: "Year 20",
    phase: "Mature Returns & Permanent Ecosystem Asset",
    focus: "Mature commercial timber value realization; perpetual natural capital annuity and soil vitality.",
    investment: "Self-sustaining naturalized ecosystem",
    returns: "Mature timber harvest + 20-year cumulative credits",
    carbon: "Maximized carbon capture (8,000–11,000+ tCO₂e)",
    canopy: "92% canopy closure",
    status: "upcoming",
  },
];

export default function DashboardPage() {
  const { user, initiateRazorpayPayment } = useAuth();

  const [strategy, setStrategy] = useState<StrategyRecommendation | null>(null);
  const [land, setLand] = useState<LandInput | null>(null);
  const [satellite, setSatellite] = useState<SatelliteMonitoringData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "satellite" | "messages">("overview");

  // Messages State
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyRecipient, setReplyRecipient] = useState("");
  const [replyLandId, setReplyLandId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const data = await fetchUserMessages(user.user_id);
      setMessages(data);
    } catch (err) {
      console.error("Failed loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStrat = sessionStorage.getItem("greenvest_selected_strategy");
      const storedLand = sessionStorage.getItem("greenvest_active_land");
      if (storedStrat) {
        try {
          setStrategy(JSON.parse(storedStrat));
        } catch {}
      }
      if (storedLand) {
        try {
          setLand(JSON.parse(storedLand));
        } catch {}
      }
    }

    fetchSatelliteData("GV-2026-001").then(setSatellite).catch(console.error);
    loadMessages();
  }, [loadMessages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyRecipient || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const sent = await postDirectMessage({
        sender_user_id: user.user_id,
        recipient_user_id: replyRecipient,
        content: replyText,
        land_id: replyLandId || undefined,
      });
      setMessages((prev) => [sent, ...prev]);
      setReplyText("");
      setReplySuccess(true);
      setTimeout(() => setReplySuccess(false), 2000);
    } catch (err) {
      console.error("Failed sending reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpgrade = async (plan: "landowner_listing" | "corporate_access") => {
    setSubscribing(true);
    try {
      await initiateRazorpayPayment(plan, {
        onSuccess: () => setSubscribing(false),
        onCancel: () => setSubscribing(false),
      });
    } catch (err) {
      console.error("Payment failed:", err);
      setSubscribing(false);
    }
  };

  const stratTitle = strategy?.title || "Balanced Agroforestry";
  const stratArea = land?.area_hectares || 12.5;
  const stratRoi = strategy?.expected_roi_percent || 11.2;
  const stratCost = strategy?.cost_breakdown?.total_initial_cost || 2437500;
  const stratTrees = strategy?.total_trees || Math.round(stratArea * 950);

  const creditScore = user?.credit_score || 840;
  const creditTier = user?.credit_tier || "Prime Green A+";
  const factors = user?.credit_factors || [
    { name: "Land Equity & Title Verification", points: 235, max_points: 250, description: "Clear land ownership & geo-boundary survey" },
    { name: "Ecological Stewardship & Soil Quality", points: 275, max_points: 300, description: "Organic soil retention & carbon pool" },
    { name: "Capital Adequacy & Liquid Reserves", points: 190, max_points: 200, description: "Capital backing plantation CAPEX" },
    { name: "Platform Verification & Identity", points: 140, max_points: 150, description: "Active KYC & verified phone/email" },
  ];

  return (
    <AuthGuard
      fallbackTitle="Dashboard Access Required"
      fallbackDescription="Sign in or register your sovereign @userid to manage your verified land assets, track Green Credit scores, and review Sentinel-2 satellite telemetry."
    >
      <div className="page-enter mesh-bg pt-24 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* User Identity Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-olive-200/80 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-olive-900 text-cream-50 shadow-md">
                {user?.user_type === "corporate" ? (
                  <Building2 className="h-7 w-7" />
                ) : (
                  <TreePine className="h-7 w-7" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-olive-950">
                    {user?.name || "Nashik Agro Holdings"}
                  </h1>
                  <span className="font-mono rounded-lg bg-cream-100 px-2.5 py-0.5 text-xs font-bold text-olive-900 border border-olive-200">
                    @{user?.user_id || "nashik_organic_agro"}
                  </span>
                  <span className="rounded-full bg-olive-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-olive-800 capitalize">
                    {user?.user_type || "Landowner"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-olive-600">
                  {user?.email || "nashik@agro.org"} · Sovereign Land ID Registry · Verified Asset Holder
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-olive-700">
                  <span>
                    Verified Land: <strong>{user?.verified_area_ha || 12.5} ha</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Capital Reserve: <strong>₹{((user?.budget_inr || 500000) / 100000).toFixed(1)} Lakhs</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription & Credit Pill Block */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Green Credit Score
                </span>
                <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-emerald-950">{creditScore}</span>
                  <span className="text-xs font-semibold text-emerald-700">/ 900</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 block">
                  {creditTier}
                </span>
              </div>

              <div className="rounded-2xl border border-olive-200 bg-cream-50/70 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-olive-600 block">
                  Subscription Tier
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-bold text-olive-950 text-sm">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <span className="capitalize">
                    {user?.subscription_tier === "landowner_listing"
                      ? "Listing Pass (Active)"
                      : user?.subscription_tier === "corporate_access"
                      ? "Corporate Access (Active)"
                      : "Free Explorer Tier"}
                  </span>
                </div>
                <span className="text-[10px] text-olive-500 block mt-0.5">
                  Peer-to-Peer Direct Enabled
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section Navigation Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-olive-200 pb-2">
          {[
            { id: "overview", label: "📊 Credit Score & Identity", icon: Award },
            { id: "messages", label: `💬 Direct Messages (${messages.length})`, icon: MessageSquare },
            { id: "timeline", label: "🗓️ 20-Year Project Timeline", icon: TreePine },
            { id: "satellite", label: "🛰️ Satellite Remote Sensing", icon: Satellite },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-olive-900 text-cream-50 shadow-sm"
                  : "bg-white text-olive-700 hover:bg-olive-100/60"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW & CREDIT SCORE BREAKDOWN */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-6"
          >
            {/* Green Credit Score Deep Dive */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Score Gauge Card */}
              <div className="rounded-3xl border border-olive-200/80 bg-white p-6 shadow-sm lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-olive-950">Green Credit Rating</h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Proprietary Algorithm
                  </span>
                </div>

                <div className="my-6 text-center">
                  <div className="mx-auto flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-emerald-500/20 bg-emerald-50/50 p-4">
                    <span className="text-4xl font-black text-emerald-950">{creditScore}</span>
                    <span className="text-xs font-semibold text-emerald-700">out of 900</span>
                  </div>
                  <div className="mt-3 inline-block rounded-xl bg-emerald-100/70 px-3 py-1 font-bold text-xs text-emerald-900">
                    {creditTier}
                  </div>
                  <p className="mt-2 text-xs text-olive-600">
                    Evaluated on 4 pillars of ecological equity, title verification, and asset resilience.
                  </p>
                </div>

                {/* Score Scale Legend */}
                <div className="space-y-1.5 border-t border-olive-100 pt-4 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-olive-600">750 – 900</span>
                    <strong className="text-emerald-700">Prime Steward (Lowest Risk)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-olive-600">650 – 749</span>
                    <strong className="text-olive-800">Tier 1 Sustainable Sponsor</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-olive-600">550 – 649</span>
                    <strong className="text-amber-700">Emerging Agro-Investable</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-olive-600">&lt; 550</span>
                    <strong className="text-red-700">Early Stage / Unverified</strong>
                  </div>
                </div>
              </div>

              {/* 4 Factor Breakdown Bars */}
              <div className="rounded-3xl border border-olive-200/80 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-olive-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-olive-950">
                      Credit Factor Sub-Score Analysis
                    </h3>
                    <p className="text-xs text-olive-600">
                      Weighted pillars determining institutional lending & corporate matching trust.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Recalculate
                  </Button>
                </div>

                <div className="mt-6 space-y-5">
                  {factors.map((factor) => {
                    const pct = Math.round((factor.points / factor.max_points) * 100);
                    return (
                      <div key={factor.name}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-olive-900">{factor.name}</span>
                          <span className="font-mono font-bold text-olive-950">
                            {factor.points} / {factor.max_points} pts ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-olive-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-olive-700 to-emerald-600 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-olive-500">{factor.description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Subscription CTA Widget */}
                {user?.subscription_tier === "free" && (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-amber-700" />
                          Upgrade to Landowner Listing Pass
                        </span>
                        <p className="mt-0.5 text-xs text-amber-800">
                          List your parcels on the marketplace with unique LandIDs for ₹1,999/yr.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={subscribing}
                        onClick={() => handleUpgrade("landowner_listing")}
                        className="bg-amber-800 hover:bg-amber-700 text-xs shrink-0"
                      >
                        {subscribing ? "Processing..." : "Pay ₹1,999 via Razorpay →"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick KPI Strip from Strategy */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: TreePine,
                  label: "Total Canopy Trees",
                  val: `${stratTrees.toLocaleString()} trees`,
                  sub: `${strategy?.density_trees_per_ha || 950} trees/ha density`,
                  color: "text-olive-800",
                },
                {
                  icon: TrendingUp,
                  label: "Target Financial ROI",
                  val: `~${stratRoi}%`,
                  sub: `Break-even in ~${strategy?.investment?.breakeven_years || 4.6} yrs`,
                  color: "text-amber-700",
                },
                {
                  icon: DollarSign,
                  label: "Initial Capital Deployed",
                  val: `₹${(stratCost / 100000).toFixed(1)} Lakhs`,
                  sub: "Itemized sapling & irrigation setup",
                  color: "text-olive-700",
                },
                {
                  icon: Satellite,
                  label: "Plantation Health (NDVI)",
                  val: satellite ? `${satellite.ndvi_current} (+${satellite.ndvi_trend_percent}%)` : "0.71 (+12.4%)",
                  sub: "Vigorous growth vs baseline",
                  color: "text-blue-700",
                },
              ].map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-olive-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-olive-600">{c.label}</span>
                    <c.icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-olive-950">{c.val}</p>
                  <p className="mt-0.5 text-xs text-olive-500">{c.sub}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB: DIRECT MESSAGES INBOX */}
        {activeTab === "messages" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 grid gap-6 lg:grid-cols-3"
          >
            {/* Messages List */}
            <div className="rounded-3xl border border-olive-200/80 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-olive-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-olive-950">
                    Direct Sovereign Message Threads
                  </h3>
                  <p className="text-xs text-olive-600">
                    Peer-to-peer conversations linked to sovereign @userids.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMessages}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
              </div>

              {loadingMessages ? (
                <div className="py-12 text-center text-xs text-olive-500">
                  Loading message threads...
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-olive-300" />
                  <p className="mt-2 text-sm font-semibold text-olive-800">No direct messages yet</p>
                  <p className="mt-1 text-xs text-olive-500">
                    Visit the Marketplace to inquire about listings or wait for incoming offers.
                  </p>
                  <Link href="/marketplace" className="mt-4 inline-block">
                    <Button size="sm">Explore Marketplace →</Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {messages.map((m) => {
                    const isOutgoing = m.sender_user_id === user?.user_id;
                    const otherParty = isOutgoing ? m.recipient_user_id : m.sender_user_id;
                    return (
                      <div
                        key={m.id}
                        className={`rounded-2xl border p-4 text-xs transition-all ${
                          isOutgoing
                            ? "border-olive-200 bg-cream-50/40"
                            : "border-olive-300 bg-white shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isOutgoing
                                  ? "bg-olive-100 text-olive-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isOutgoing ? "Sent by You" : "Received"}
                            </span>
                            <span className="font-semibold text-olive-950">
                              @{otherParty}
                            </span>
                            {m.land_id && (
                              <span className="font-mono rounded bg-olive-100/70 px-1.5 py-0.5 text-[10px] font-bold text-olive-700">
                                {m.land_id}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-olive-400">
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="mt-2 leading-relaxed text-olive-800">{m.content}</p>

                        {!isOutgoing && (
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyRecipient(otherParty);
                                setReplyLandId(m.land_id || "");
                              }}
                              className="text-[11px] font-semibold text-olive-700 hover:text-olive-950 underline"
                            >
                              Reply to @{otherParty} →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Compose / Reply Panel */}
            <div className="rounded-3xl border border-olive-200/80 bg-white p-6 shadow-sm lg:col-span-1">
              <h3 className="text-base font-bold text-olive-950">
                Compose Direct Message
              </h3>
              <p className="text-xs text-olive-600 mt-1">
                Reach any sovereign user directly using their handle.
              </p>

              <form onSubmit={handleSendReply} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-semibold text-olive-900">
                    Recipient @userid
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-olive-500">@</span>
                    <input
                      type="text"
                      required
                      value={replyRecipient}
                      onChange={(e) => setReplyRecipient(e.target.value.replace(/^@/, "").trim())}
                      placeholder="e.g. tata_nature_csr"
                      className="w-full rounded-xl border border-olive-200 bg-cream-50/50 py-2 pl-7 pr-3 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-olive-900">
                    Land ID Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={replyLandId}
                    onChange={(e) => setReplyLandId(e.target.value)}
                    placeholder="e.g. LAND-MH-84210"
                    className="w-full rounded-xl border border-olive-200 bg-cream-50/50 p-2 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-olive-900">
                    Message Content
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message, proposal, or verification question..."
                    className="w-full rounded-xl border border-olive-200 bg-cream-50/50 p-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                  />
                </div>

                {replySuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2 text-xs text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Message delivered to @{replyRecipient}</span>
                  </div>
                )}

                <Button type="submit" disabled={sendingReply} className="w-full text-xs">
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {sendingReply ? "Sending..." : "Send Direct Message"}
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {/* TAB: 20-YEAR PROJECT TIMELINE */}
        {activeTab === "timeline" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-6"
          >
            <div className="rounded-3xl border border-olive-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-olive-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-olive-950">
                    20-Year Lifecycle & Carbon Maturation: {stratTitle}
                  </h3>
                  <p className="mt-1 text-xs text-olive-600">
                    Projected timeline covering soil buildup, early intercrop yields, and institutional carbon vintages.
                  </p>
                </div>
                <span className="rounded-full bg-olive-100 px-3 py-1 text-xs font-bold text-olive-800">
                  2026 – 2046 Horizon
                </span>
              </div>

              <div className="mt-8 space-y-6">
                {TIMELINE_MILESTONES.map((m) => (
                  <div
                    key={m.year}
                    className="flex flex-col gap-4 rounded-2xl border border-olive-100 bg-cream-50/40 p-5 sm:flex-row sm:items-start"
                  >
                    <div className="sm:w-28 shrink-0">
                      <span className="inline-block rounded-xl bg-olive-900 px-3 py-1 font-mono text-xs font-black text-cream-50">
                        {m.year}
                      </span>
                      <p className="mt-1.5 text-[11px] font-semibold text-olive-600">
                        {m.status === "active" ? "Current Phase" : "Scheduled"}
                      </p>
                    </div>

                    <div className="flex-1">
                      <h4 className="font-bold text-olive-950 text-sm">{m.phase}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-olive-700">{m.focus}</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-[11px]">
                        <div className="rounded-lg bg-white p-2 border border-olive-100">
                          <span className="text-olive-500 block text-[10px]">Capital / Cost</span>
                          <strong className="text-olive-900">{m.investment}</strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-olive-100">
                          <span className="text-olive-500 block text-[10px]">Commercial Yield</span>
                          <strong className="text-olive-900">{m.returns}</strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-olive-100">
                          <span className="text-olive-500 block text-[10px]">Carbon Pool</span>
                          <strong className="text-emerald-800">{m.carbon}</strong>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-olive-100">
                          <span className="text-olive-500 block text-[10px]">Canopy Closure</span>
                          <strong className="text-olive-900">{m.canopy}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: SATELLITE REMOTE SENSING & NDVI */}
        {activeTab === "satellite" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Satellite Telemetry Card */}
              <div className="rounded-3xl border border-olive-200/80 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-olive-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Satellite className="h-5 w-5 text-blue-600" />
                      <h3 className="font-bold text-olive-950">
                        Sentinel-2 Multispectral Vegetation Telemetry
                      </h3>
                    </div>
                    <p className="text-xs text-olive-600 mt-0.5">
                      10m resolution NDVI, canopy moisture, and drought stress index.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-olive-700 bg-olive-50 px-2.5 py-1 rounded-lg border border-olive-200">
                    Pass: {satellite?.timeseries?.[satellite.timeseries.length - 1]?.date || "2026-03-01"}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl bg-olive-50/60 p-4 border border-olive-100 text-center">
                    <span className="text-[10px] text-olive-600 uppercase font-bold block">Current NDVI</span>
                    <span className="text-2xl font-black text-olive-950 mt-1 block">
                      {satellite?.ndvi_current || "0.71"}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">+{satellite?.ndvi_trend_percent || 12.4}% vs baseline</span>
                  </div>
                  <div className="rounded-2xl bg-olive-50/60 p-4 border border-olive-100 text-center">
                    <span className="text-[10px] text-olive-600 uppercase font-bold block">Soil Moisture Index</span>
                    <span className="text-2xl font-black text-blue-900 mt-1 block">
                      {Math.round((satellite?.timeseries?.[satellite.timeseries.length - 1]?.soil_moisture || 0.68) * 100)}%
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold">Optimal Root Zone</span>
                  </div>
                  <div className="rounded-2xl bg-olive-50/60 p-4 border border-olive-100 text-center">
                    <span className="text-[10px] text-olive-600 uppercase font-bold block">Canopy Cover</span>
                    <span className="text-2xl font-black text-emerald-950 mt-1 block">
                      {satellite?.canopy_cover_percent || 48}%
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Healthy Crown</span>
                  </div>
                  <div className="rounded-2xl bg-olive-50/60 p-4 border border-olive-100 text-center">
                    <span className="text-[10px] text-olive-600 uppercase font-bold block">Vegetation Status</span>
                    <span className="text-2xl font-black text-amber-900 mt-1 block">
                      {satellite?.vegetation_health_status || "Vigorous"}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">{satellite?.biomass_density_index || "High Density"}</span>
                  </div>
                </div>

                {/* Satellite Alert Feed */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-olive-900 uppercase tracking-wider">
                    Recent Geospatial Alerts & Advisory
                  </h4>
                  <div className="mt-3 space-y-2.5">
                    {satellite?.recent_alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start gap-3 rounded-xl border border-olive-100 bg-cream-50/40 p-3 text-xs"
                      >
                        <div className="mt-0.5">
                          {alert.type === "opportunity" ? (
                            <CloudRain className="h-4 w-4 text-blue-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-olive-900">{alert.title}</h5>
                            <span className="text-[10px] text-olive-400">{alert.timestamp}</span>
                          </div>
                          <p className="mt-0.5 text-olive-700 text-[11px] leading-relaxed">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Biomass Heatmap Visualization */}
              <div className="rounded-3xl border border-olive-900 bg-olive-950 p-6 text-cream-50 shadow-md lg:col-span-1">
                <div className="flex items-center justify-between border-b border-olive-800 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-olive-400">
                    False-Color IR Synthesis
                  </span>
                  <Satellite className="h-4 w-4 text-emerald-400" />
                </div>
                <h4 className="mt-3 text-base font-bold">Parcel Biomass Heatmap</h4>
                <p className="mt-1 text-xs text-olive-300">
                  Spatial false-color infrared index indicating root-zone hydration and dense chlorophyll vigor.
                </p>

                {/* Pixel Grid */}
                <div className="mt-4 grid grid-cols-5 gap-1.5 rounded-2xl bg-olive-900/60 p-3 border border-olive-800">
                  {[
                    "bg-emerald-500", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600", "bg-emerald-500",
                    "bg-emerald-400", "bg-emerald-600", "bg-emerald-500", "bg-emerald-400", "bg-emerald-600",
                    "bg-emerald-500", "bg-emerald-500", "bg-emerald-600", "bg-emerald-500", "bg-emerald-400",
                    "bg-emerald-600", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600", "bg-emerald-500",
                  ].map((col, idx) => (
                    <div
                      key={idx}
                      className={`h-7 rounded ${col} opacity-90 transition hover:scale-110`}
                      title={`Sector ${idx + 1}: Healthy Biomass`}
                    />
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-olive-900/80 p-3 text-xs text-olive-200 border border-olive-800">
                  <div className="flex justify-between">
                    <span>Biomass Index:</span>
                    <strong className="text-emerald-400">Vigorous Growth</strong>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Canopy Moisture:</span>
                    <strong className="text-white">Normal (Adequate)</strong>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
