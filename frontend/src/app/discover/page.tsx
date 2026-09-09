"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Ruler,
  Wallet,
  Calendar,
  Droplets,
  Layers,
  Sparkles,
  ArrowRight,
  Navigation,
  Loader2,
  Crosshair,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { LandMap } from "@/components/map/LandMap";
import { DEFAULT_MAP_CENTER } from "@/components/map/mapStyles";

export default function DiscoverPage() {
  const router = useRouter();

  // Clean form state fed with real user input & location access
  const [form, setForm] = useState({
    location: "",
    area: "",
    soil_type: "Black soil",
    water_availability: "Moderate",
    budget: "",
    horizon: "15",
  });

  const [pinnedLocation, setPinnedLocation] = useState<{
    lat: number;
    lon: number;
    label?: string;
  } | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Reverse geocoding helper (OpenStreetMap Nominatim)
  const reverseGeocode = async (lat: number, lon: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const district = addr.state_district || addr.county || addr.city || addr.town || addr.village || "";
        const state = addr.state || "";
        const country = addr.country || "";
        const parts = [district, state, country].filter(Boolean);
        const resolvedName = parts.length > 0 ? parts.join(", ") : data.display_name?.split(",").slice(0, 3).join(",") || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        
        update("location", resolvedName);
        setLocationStatus(`📍 Resolved location: ${resolvedName}`);
        return resolvedName;
      }
    } catch (err) {
      console.warn("Reverse geocoding error:", err);
      setLocationStatus(`📍 Coords set: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
    return null;
  };

  // 1. Browser HTML5 GPS Location Access
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Requesting device GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setPinnedLocation({ lat, lon, label: "My Current Location" });
        await reverseGeocode(lat, lon);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus("Location permission denied. You can click on the map to pin your land.");
        } else {
          setLocationStatus("Could not retrieve precise location. Please click on the map.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // 2. Map Click-to-Pin Handler
  const handleMapClick = async (lat: number, lon: number) => {
    setPinnedLocation({ lat, lon, label: "Selected Land Pin" });
    await reverseGeocode(lat, lon);
  };

  // 3. Location Text Search Geocoder
  const handleSearchLocation = async () => {
    if (!form.location.trim()) return;
    setIsGeocoding(true);
    setLocationStatus(`Searching geospatial coordinates for "${form.location}"...`);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.location)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setPinnedLocation({ lat, lon, label: form.location });
          setLocationStatus(`📍 Map centered on ${data[0].display_name.split(",").slice(0, 2).join(",")}`);
        } else {
          setLocationStatus("Location not found on map. Click directly on the map to place a pin.");
        }
      }
    } catch (err) {
      console.warn("Geocoding search failed:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      latitude: pinnedLocation?.lat,
      longitude: pinnedLocation?.lon,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("greenvest_land_input", JSON.stringify(payload));
    }

    const params = new URLSearchParams({
      location: form.location,
      area: form.area,
      soil: form.soil_type,
      water: form.water_availability,
      budget: form.budget,
      horizon: form.horizon,
    });

    if (pinnedLocation) {
      params.set("lat", pinnedLocation.lat.toString());
      params.set("lon", pinnedLocation.lon.toString());
    }

    router.push(`/analyze?${params.toString()}`);
  };

  return (
    <AuthGuard
      fallbackTitle="Discover & Analyze Land"
      fallbackDescription="Please sign in with your sovereign @userid to drop land pins, access remote sensing diagnostics, and run plantation ROI models."
    >
      <div className="page-enter mesh-bg pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-olive-200 bg-olive-50/80 px-3.5 py-1 text-xs font-semibold text-olive-800 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-olive-600" />
              Interactive Geospatial Land Engine
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-olive-950 sm:text-4xl">
              Pin & Analyze Your Land
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm text-olive-700/80">
              Click anywhere on the interactive map or use device GPS to place your parcel pin.
              GreenVest uses real satellite remote sensing and bio-climatic indices to run custom 20-year agroforestry analysis.
            </p>
          </motion.div>

          {/* Side-by-side Layout: Form on Left, Interactive Map on Right */}
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
            {/* Left Column: Form & Real Input Parameters */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="space-y-5 rounded-3xl border border-olive-200/80 bg-white p-6 shadow-sm sm:p-8 lg:col-span-6"
              onSubmit={handleSubmit}
            >
              {/* Location Access & Pin Bar */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-olive-900">
                    <MapPin className="h-4 w-4 text-brown-500" />
                    Land Location & Coordinates
                  </label>

                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 rounded-full border border-olive-300 bg-olive-50/80 px-3 py-1 text-[11px] font-bold text-olive-900 transition hover:bg-olive-100 active:scale-95 disabled:opacity-60"
                  >
                    {isLocating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-olive-700" />
                    ) : (
                      <Navigation className="h-3.5 w-3.5 text-olive-700" />
                    )}
                    <span>{isLocating ? "Detecting GPS..." : "Use My GPS"}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchLocation())}
                    placeholder="Enter city, district, or click on the map"
                    className="flex-1 rounded-xl border border-olive-200 bg-cream-50 px-4 py-2.5 text-xs font-medium text-olive-950 outline-none transition focus:border-olive-600 focus:bg-white focus:ring-2 focus:ring-olive-100"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearchLocation}
                    disabled={isGeocoding || !form.location.trim()}
                    className="px-3"
                    title="Find on map"
                  >
                    {isGeocoding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Coordinate Badge */}
                {pinnedLocation && (
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-olive-50 p-2.5 border border-olive-200 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-olive-900">
                      <Crosshair className="h-3.5 w-3.5 text-olive-700 shrink-0" />
                      <span>
                        {pinnedLocation.lat.toFixed(4)}° N, {pinnedLocation.lon.toFixed(4)}° E
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Pinned on Map
                    </span>
                  </div>
                )}

                {locationStatus && (
                  <p className="mt-1.5 text-[11px] text-olive-600 font-medium">
                    {locationStatus}
                  </p>
                )}
              </div>

              {/* Area & Soil */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-olive-900">
                    <Ruler className="h-3.5 w-3.5 text-brown-500" />
                    Land Area (Hectares)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={form.area}
                    onChange={(e) => update("area", e.target.value)}
                    placeholder="e.g. 10.0"
                    className="w-full rounded-xl border border-olive-200 bg-cream-50 px-3.5 py-2.5 text-xs text-olive-950 outline-none transition focus:border-olive-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-olive-900">
                    <Layers className="h-3.5 w-3.5 text-brown-500" />
                    Soil Type / Horizon
                  </label>
                  <select
                    value={form.soil_type}
                    onChange={(e) => update("soil_type", e.target.value)}
                    className="w-full rounded-xl border border-olive-200 bg-cream-50 px-3.5 py-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                  >
                    <option value="Black soil">Black Cotton Soil (Vertisol)</option>
                    <option value="Red soil">Red Loam Soil (Alfisol)</option>
                    <option value="Alluvial soil">Alluvial / Riverine Soil</option>
                    <option value="Sandy loam">Sandy Loam</option>
                    <option value="Clay loam">Clay Loam</option>
                  </select>
                </div>
              </div>

              {/* Water & Budget */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-olive-900">
                    <Droplets className="h-3.5 w-3.5 text-brown-500" />
                    Water Availability
                  </label>
                  <select
                    value={form.water_availability}
                    onChange={(e) => update("water_availability", e.target.value)}
                    className="w-full rounded-xl border border-olive-200 bg-cream-50 px-3.5 py-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                  >
                    <option value="Abundant">Abundant (Canal / High Water Table)</option>
                    <option value="Moderate">Moderate (Borewell / Recharge Aquifer)</option>
                    <option value="Rainfed">Rainfed / Constrained (Monsoons)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-olive-900">
                    <Wallet className="h-3.5 w-3.5 text-brown-500" />
                    CAPEX Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="50000"
                    step="10000"
                    required
                    value={form.budget}
                    onChange={(e) => update("budget", e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full rounded-xl border border-olive-200 bg-cream-50 px-3.5 py-2.5 text-xs text-olive-950 outline-none transition focus:border-olive-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Investment Horizon */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-olive-900">
                  <Calendar className="h-3.5 w-3.5 text-brown-500" />
                  Target Investment Horizon
                </label>
                <select
                  value={form.horizon}
                  onChange={(e) => update("horizon", e.target.value)}
                  className="w-full rounded-xl border border-olive-200 bg-cream-50 px-3.5 py-2.5 text-xs text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                >
                  <option value="5">5 years (Short-rotation biomass / bamboo)</option>
                  <option value="10">10 years (Agroforestry & early carbon vintages)</option>
                  <option value="15">15 years (Balanced maturity & timber thinning)</option>
                  <option value="20">20+ years (Permanent hardwood & maximum carbon)</option>
                </select>
              </div>

              {/* Submit / Actions */}
              <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
                <Button type="submit" size="lg" className="flex-1 flex items-center justify-center gap-2">
                  <span>Run Satellite Land Analysis</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="/marketplace">
                  <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            </motion.form>

            {/* Right Column: Interactive Map (Click to Pin) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="lg:col-span-6 space-y-3"
            >
              <div className="rounded-3xl border border-olive-200/80 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between px-2">
                  <div>
                    <h3 className="text-sm font-bold text-olive-950 flex items-center gap-1.5">
                      <Crosshair className="h-4 w-4 text-olive-700" />
                      Interactive Parcel Pinning Map
                    </h3>
                    <p className="text-[11px] text-olive-600">
                      Click anywhere on the map to drop a pin and auto-fill coordinates.
                    </p>
                  </div>
                  <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-[10px] font-bold text-olive-800 border border-olive-200/60">
                    Live OpenStreetMap
                  </span>
                </div>

                <LandMap
                  center={pinnedLocation ? [pinnedLocation.lat, pinnedLocation.lon] : DEFAULT_MAP_CENTER}
                  zoom={pinnedLocation ? 12 : 5}
                  pinnedLocation={pinnedLocation}
                  onMapClick={handleMapClick}
                  height="480px"
                  className="rounded-2xl border border-olive-200"
                />

                {/* Map Legend */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] text-olive-600">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-[#8C4A32] border-2 border-white shadow-sm"></span>
                    <span>Your Pinned Parcel</span>
                  </div>
                  <span>Click to reposition pin anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
