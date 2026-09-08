"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Leaf,
  TrendingUp,
  MessageSquare,
  PlusCircle,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Droplets,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchMarketplaceLands,
  createMarketplaceLand,
  postDirectMessage,
} from "@/lib/api";
import type { RealMarketplaceLand } from "@/types";
import { Button } from "@/components/ui/Button";

export default function MarketplacePage() {
  const { user, subscribe } = useAuth();
  const [lands, setLands] = useState<RealMarketplaceLand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSoil, setSelectedSoil] = useState("all");

  // Messaging Modal State
  const [messageTarget, setMessageTarget] = useState<RealMarketplaceLand | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  // List Land Modal State
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [listingTitle, setListingTitle] = useState("");
  const [listingLocation, setListingLocation] = useState("");
  const [listingArea, setListingArea] = useState("10");
  const [listingSoil, setListingSoil] = useState("Black soil");
  const [listingWater, setListingWater] = useState("Moderate (Borewell & Aquifer)");
  const [listingPrice, setListingPrice] = useState("3500000");
  const [submittingLand, setSubmittingLand] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadLands();
  }, []);

  const loadLands = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketplaceLands();
      setLands(data);
    } catch (err) {
      console.error("Failed loading lands:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTarget || !user) return;
    setSendingMessage(true);
    setMessageError(null);
    try {
      await postDirectMessage({
        sender_user_id: user.user_id,
        recipient_user_id: messageTarget.owner_user_id,
        content: messageContent,
        land_id: messageTarget.land_id,
      });
      setMessageSentSuccess(true);
      setTimeout(() => {
        setMessageSentSuccess(false);
        setMessageTarget(null);
        setMessageContent("");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to deliver message";
      setMessageError(msg);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingLand(true);
    setListingError(null);
    try {
      const newLand = await createMarketplaceLand({
        owner_user_id: user.user_id,
        title: listingTitle,
        location: listingLocation,
        area_hectares: parseFloat(listingArea) || 5,
        soil_type: listingSoil,
        water_availability: listingWater,
        asking_price_inr: parseFloat(listingPrice) || 1000000,
      });
      setLands((prev) => [newLand, ...prev]);
      setIsListingModalOpen(false);
      setListingTitle("");
      setListingLocation("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create listing";
      setListingError(msg);
    } finally {
      setSubmittingLand(false);
    }
  };

  const handleUpgradeSubscription = async () => {
    setSubscribing(true);
    setListingError(null);
    try {
      await subscribe("landowner_listing", 1999);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Subscription activation failed";
      setListingError(msg);
    } finally {
      setSubscribing(false);
    }
  };

  const filteredLands = lands.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.land_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.owner_user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSoil = selectedSoil === "all" || l.soil_type.toLowerCase().includes(selectedSoil.toLowerCase());
    return matchesSearch && matchesSoil;
  });

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakhs`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="page-enter mesh-bg pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header with Title & Action */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-olive-200 bg-olive-50/70 px-3 py-1 text-xs font-semibold text-olive-800">
              <ShieldCheck className="h-3.5 w-3.5 text-olive-600" />
              Real Sovereign IDs · Zero Intermediation
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-olive-950 sm:text-4xl">
              Verified Land Marketplace
            </h1>
            <p className="mt-1 text-sm text-olive-700/80">
              Every parcel carries a unique LandID, certified Land Health Score, and verified owner @userid.
            </p>
          </motion.div>

          <Button
            onClick={() => setIsListingModalOpen(true)}
            className="flex items-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm sm:self-center"
          >
            <PlusCircle className="h-4 w-4" />
            List Your Land
          </Button>
        </div>

        {/* Peer-to-Peer Policy Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-start gap-3 rounded-2xl border border-olive-200/80 bg-white/90 p-4 shadow-sm backdrop-blur"
        >
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-olive-700" />
          <div className="text-xs leading-relaxed text-olive-800">
            <span className="font-semibold text-olive-950">Peer-to-Peer Matching Protocol:</span> GreenVest provides institutional satellite telemetry, ecological health audits, and verified sovereign IDs. We do not intermediate financial transactions or take escrow cuts. Connect directly with owners via @userid DMs.
          </div>
        </motion.div>

        {/* Filter / Search Bar */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-olive-400" />
            <input
              type="text"
              placeholder="Search by LandID, location, owner @handle, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-olive-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-olive-900 shadow-sm outline-none transition focus:border-olive-600 focus:ring-2 focus:ring-olive-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-olive-500" />
            <select
              value={selectedSoil}
              onChange={(e) => setSelectedSoil(e.target.value)}
              className="rounded-xl border border-olive-200 bg-white px-3 py-2.5 text-xs font-semibold text-olive-800 shadow-sm outline-none transition focus:border-olive-600"
            >
              <option value="all">All Soils</option>
              <option value="black">Black Soil</option>
              <option value="alluvial">Alluvial</option>
              <option value="red">Red Soil / Loam</option>
              <option value="sandy">Sandy Loam</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="mt-12 flex flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-olive-800 border-t-transparent" />
            <p className="mt-3 text-xs font-medium text-olive-600">Loading verified lands from database...</p>
          </div>
        ) : filteredLands.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-olive-200 bg-white/60 p-12 text-center">
            <MapPin className="mx-auto h-8 w-8 text-olive-400" />
            <p className="mt-3 text-sm font-semibold text-olive-900">No lands found matching your filters</p>
            <p className="mt-1 text-xs text-olive-600">Try adjusting your search criteria or clear the filters.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLands.map((item, i) => (
              <motion.div
                key={item.land_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="group flex flex-col justify-between rounded-2xl border border-olive-200/80 bg-white p-5 shadow-sm transition-all hover:border-olive-400 hover:shadow-md"
              >
                <div>
                  {/* Top Bar: LandID + Health Score */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-olive-800 bg-olive-50 px-2 py-0.5 rounded-md border border-olive-200/60">
                        {item.land_id}
                      </span>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-olive-900">
                        <MapPin className="h-3.5 w-3.5 text-olive-600 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                    </div>

                    {/* Health Score Pill */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 border border-emerald-200/70 text-emerald-800 font-bold text-xs">
                        <span>Score</span>
                        <span className="text-sm font-black">{item.land_health_score}</span>
                        <span className="text-[10px] text-emerald-600">/100</span>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-700 mt-0.5">Health Grade</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 text-sm font-semibold text-olive-950 leading-snug">
                    {item.title}
                  </h3>

                  {/* Owner Badge */}
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-cream-50/70 p-2.5 border border-olive-100 text-xs">
                    <div>
                      <span className="text-[10px] text-olive-500 block">Owner</span>
                      <span className="font-semibold text-olive-900">@{item.owner_user_id}</span>
                    </div>
                    {item.owner_credit_score && (
                      <div className="text-right">
                        <span className="text-[10px] text-olive-500 block">Credit Score</span>
                        <span className="font-bold text-olive-800">
                          {item.owner_credit_score} <span className="text-[10px] font-normal text-olive-600">({item.owner_credit_tier?.split(" ")[0] || "Verified"})</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Land Attributes Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-olive-50/40 p-2 border border-olive-100/60">
                      <span className="text-[10px] text-olive-500 block">Land Area</span>
                      <span className="font-semibold text-olive-900">{item.area_hectares} ha</span>
                    </div>
                    <div className="rounded-lg bg-olive-50/40 p-2 border border-olive-100/60">
                      <span className="text-[10px] text-olive-500 block">Soil Classification</span>
                      <span className="font-semibold text-olive-900 truncate block">{item.soil_type}</span>
                    </div>
                    <div className="rounded-lg bg-olive-50/40 p-2 border border-olive-100/60">
                      <span className="text-[10px] text-olive-500 flex items-center gap-1">
                        <Leaf className="h-3 w-3 text-emerald-600" /> Carbon
                      </span>
                      <span className="font-semibold text-olive-900">{item.carbon_potential} tCO₂/ha/yr</span>
                    </div>
                    <div className="rounded-lg bg-olive-50/40 p-2 border border-olive-100/60">
                      <span className="text-[10px] text-olive-500 flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-blue-500" /> Water
                      </span>
                      <span className="font-semibold text-olive-900 truncate block">
                        {item.water_availability.split(" ")[0]}
                      </span>
                    </div>
                  </div>

                  {/* Price Banner */}
                  <div className="mt-4 flex items-center justify-between border-t border-olive-100 pt-3">
                    <div>
                      <span className="text-[10px] text-olive-500 block">Asking Valuation</span>
                      <span className="text-base font-bold text-olive-950">
                        {formatINR(item.asking_price_inr)}
                      </span>
                    </div>
                    <span className="text-[10px] text-olive-500 font-medium">
                      ~₹{Math.round(item.asking_price_inr / item.area_hectares / 1000).toLocaleString()}k / ha
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMessageTarget(item);
                      setMessageContent(`Hi @${item.owner_user_id}, I saw your listing for ${item.land_id} (${item.title}) on GreenVest. I would like to discuss a potential agroforestry partnership.`);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-olive-300 bg-white py-2 text-xs font-semibold text-olive-800 transition hover:bg-olive-50"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-olive-600" />
                    Message @{item.owner_user_id.split("_")[0]}
                  </button>

                  <Link
                    href={`/analyze?location=${encodeURIComponent(item.location)}&area=${item.area_hectares}&soil=${encodeURIComponent(item.soil_type)}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-olive-800 py-2 text-xs font-semibold text-cream-50 transition hover:bg-olive-700"
                  >
                    <span>Run AI Audit</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Direct Messaging Modal */}
        <AnimatePresence>
          {messageTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-2xl border border-olive-200 bg-white p-6 shadow-xl"
              >
                <div className="flex items-start justify-between border-b border-olive-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-olive-500">
                      Peer-to-Peer Direct Message
                    </span>
                    <h2 className="text-base font-bold text-olive-950">
                      Message @{messageTarget.owner_user_id}
                    </h2>
                    <p className="text-xs text-olive-600">
                      Ref: {messageTarget.land_id} · {messageTarget.location}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMessageTarget(null)}
                    className="rounded-lg p-1 text-olive-400 hover:bg-olive-100 hover:text-olive-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {messageSentSuccess ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                    <h3 className="mt-2 text-sm font-bold text-olive-950">Message Sent Directly!</h3>
                    <p className="mt-1 text-xs text-olive-600">
                      Delivered to @{messageTarget.owner_user_id}&apos;s dashboard inbox.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="mt-4 space-y-4 text-xs">
                    <div>
                      <label className="mb-1 block font-semibold text-olive-900">
                        Sending From:
                      </label>
                      <div className="rounded-xl border border-olive-200 bg-cream-50/50 px-3 py-2 text-xs font-semibold text-olive-800">
                        @{user?.user_id || "guest"} ({user?.name || "Guest"})
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-olive-900">
                        Direct Message / Proposal:
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="State your investment model, lease proposal, or verification questions..."
                        className="w-full rounded-xl border border-olive-200 bg-cream-50/30 p-3 text-xs text-olive-950 outline-none transition focus:border-olive-600 focus:bg-white"
                      />
                    </div>

                    {messageError && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-100">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{messageError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setMessageTarget(null)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={sendingMessage}>
                        {sendingMessage ? "Sending..." : "Send Message →"}
                      </Button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* List Land Modal (with Subscription Gate) */}
        <AnimatePresence>
          {isListingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-2xl border border-olive-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-start justify-between border-b border-olive-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-olive-500">
                      Sovereign Asset Registry
                    </span>
                    <h2 className="text-base font-bold text-olive-950">
                      List Verified Land on Marketplace
                    </h2>
                    <p className="text-xs text-olive-600">
                      Assigns unique LandID and runs automated Land Health Scoring.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsListingModalOpen(false)}
                    className="rounded-lg p-1 text-olive-400 hover:bg-olive-100 hover:text-olive-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Subscription Gate Check */}
                {user?.subscription_tier === "free" ? (
                  <div className="mt-5 space-y-4 text-xs">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
                      <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                        <TrendingUp className="h-4 w-4 text-amber-700" />
                        Landowner Listing Subscription Required
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                        Under GreenVest&apos;s subscription model, landowners subscribe to list verified parcels with sovereign LandIDs and connect with institutional capital.
                      </p>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-950">₹1,999</span>
                        <span className="text-xs text-amber-800">/ annual listing pass</span>
                      </div>
                      <ul className="mt-3 space-y-1 text-xs text-amber-900">
                        <li>✓ Unlimited parcel listings with unique LandIDs</li>
                        <li>✓ Automated Land Health Score (0–100) certification</li>
                        <li>✓ Direct peer-to-peer inquiries from ESG corporates</li>
                      </ul>
                    </div>

                    {listingError && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-100">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{listingError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsListingModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleUpgradeSubscription}
                        disabled={subscribing}
                        className="bg-emerald-800 hover:bg-emerald-700"
                      >
                        {subscribing ? "Activating..." : "Unlock Listing Pass (₹1,999) →"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateListing} className="mt-5 space-y-4 text-xs">
                    <div>
                      <label className="mb-1 block font-semibold text-olive-900">
                        Listing Title
                      </label>
                      <input
                        type="text"
                        required
                        value={listingTitle}
                        onChange={(e) => setListingTitle(e.target.value)}
                        placeholder="e.g. High-Canopy Semi-Arid Holding with Borewell"
                        className="w-full rounded-xl border border-olive-200 bg-cream-50/40 p-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold text-olive-900">
                          Location (City, State)
                        </label>
                        <input
                          type="text"
                          required
                          value={listingLocation}
                          onChange={(e) => setListingLocation(e.target.value)}
                          placeholder="e.g. Satara, MH"
                          className="w-full rounded-xl border border-olive-200 bg-cream-50/40 p-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-semibold text-olive-900">
                          Area (Hectares)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={listingArea}
                          onChange={(e) => setListingArea(e.target.value)}
                          placeholder="10"
                          className="w-full rounded-xl border border-olive-200 bg-cream-50/40 p-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold text-olive-900">
                          Soil Type
                        </label>
                        <select
                          value={listingSoil}
                          onChange={(e) => setListingSoil(e.target.value)}
                          className="w-full rounded-xl border border-olive-200 bg-cream-50/40 p-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                        >
                          <option value="Black soil">Black Soil</option>
                          <option value="Alluvial">Alluvial</option>
                          <option value="Red loam">Red Loam</option>
                          <option value="Sandy loam">Sandy Loam</option>
                          <option value="Laterite">Laterite</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block font-semibold text-olive-900">
                          Water Availability
                        </label>
                        <select
                          value={listingWater}
                          onChange={(e) => setListingWater(e.target.value)}
                          className="w-full rounded-xl border border-olive-200 bg-cream-50/40 p-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                        >
                          <option value="Abundant (Canal & High Water Table)">Abundant (Canal & Well)</option>
                          <option value="Moderate (Borewell & Aquifer)">Moderate (Borewell)</option>
                          <option value="Rainfed / Constrained">Rainfed / Constrained</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-olive-900">
                        Asking Price (INR Total)
                      </label>
                      <input
                        type="number"
                        step="50000"
                        required
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        placeholder="3500000"
                        className="w-full rounded-xl border border-olive-200 bg-cream-50/40 p-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                      />
                    </div>

                    {listingError && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-100">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{listingError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsListingModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingLand}>
                        {submittingLand ? "Publishing..." : "Publish Land Listing →"}
                      </Button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

