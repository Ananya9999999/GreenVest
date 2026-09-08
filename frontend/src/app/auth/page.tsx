"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Building2,
  TreePine,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"landowner" | "corporate">("landowner");
  const [verifiedArea, setVerifiedArea] = useState("12.5");
  const [budget, setBudget] = useState("500000");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(userId || email, password);
      } else {
        const cleanId = userId.replace(/^@/, "").trim();
        if (!cleanId) {
          throw new Error("Please enter a valid unique @userid.");
        }
        await register({
          user_id: cleanId,
          name,
          email,
          password,
          user_type: userType,
          verified_area_ha: parseFloat(verifiedArea) || 0,
          budget_inr: parseFloat(budget) || 0,
        });
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Please check inputs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (handle: string) => {
    setLoading(true);
    setError(null);
    try {
      await login(handle, "pass123");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed quick login";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4 pt-20 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Minimalist Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-olive-900 text-cream-50 shadow-md">
            <TreePine className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-olive-950">
            {mode === "login" ? "Welcome back" : "Claim your @userid"}
          </h1>
          <p className="mt-1 text-xs text-olive-600">
            {mode === "login"
              ? "Access your land assets, credit score, and direct messages."
              : "Every user and land parcel receives a verified sovereign ID."}
          </p>
        </div>

        {/* Minimalist Card */}
        <div className="mt-6 rounded-2xl border border-olive-200/70 bg-white p-6 shadow-sm sm:p-8">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-cream-100/70 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`rounded-lg py-2 transition-all ${
                mode === "login"
                  ? "bg-white text-olive-950 shadow-sm"
                  : "text-olive-600 hover:text-olive-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`rounded-lg py-2 transition-all ${
                mode === "register"
                  ? "bg-white text-olive-950 shadow-sm"
                  : "text-olive-600 hover:text-olive-900"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
            {/* User ID Handle */}
            <div>
              <label className="mb-1.5 flex items-center justify-between font-semibold text-olive-900">
                <span>Unique User ID</span>
                <span className="text-[10px] text-olive-500 font-normal">
                  Like Instagram handle
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-sm font-bold text-olive-500">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="ananya_lands"
                  className="w-full rounded-xl border border-olive-200 bg-cream-50/50 py-2.5 pl-8 pr-3 text-sm font-medium text-olive-950 outline-none transition focus:border-olive-600 focus:bg-white focus:ring-2 focus:ring-olive-100"
                />
              </div>
            </div>

            {mode === "register" && (
              <>
                {/* Full Name */}
                <div>
                  <label className="mb-1.5 block font-semibold text-olive-900">
                    Full Name / Entity Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-olive-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ananya Singla"
                      className="w-full rounded-xl border border-olive-200 bg-cream-50/50 py-2.5 pl-10 pr-3 text-sm text-olive-950 outline-none transition focus:border-olive-600 focus:bg-white focus:ring-2 focus:ring-olive-100"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block font-semibold text-olive-900">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-olive-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ananya@greenvest.org"
                      className="w-full rounded-xl border border-olive-200 bg-cream-50/50 py-2.5 pl-10 pr-3 text-sm text-olive-950 outline-none transition focus:border-olive-600 focus:bg-white focus:ring-2 focus:ring-olive-100"
                    />
                  </div>
                </div>

                {/* Account Type Selector */}
                <div>
                  <label className="mb-1.5 block font-semibold text-olive-900">
                    Account Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUserType("landowner")}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                        userType === "landowner"
                          ? "border-olive-800 bg-olive-50/60 font-bold text-olive-950 ring-1 ring-olive-800"
                          : "border-olive-200 bg-white text-olive-600 hover:border-olive-300"
                      }`}
                    >
                      <TreePine className="h-4 w-4 text-olive-700" />
                      <span className="mt-1">Landowner / Farmer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType("corporate")}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                        userType === "corporate"
                          ? "border-olive-800 bg-olive-50/60 font-bold text-olive-950 ring-1 ring-olive-800"
                          : "border-olive-200 bg-white text-olive-600 hover:border-olive-300"
                      }`}
                    >
                      <Building2 className="h-4 w-4 text-olive-700" />
                      <span className="mt-1">Corporate / Investor</span>
                    </button>
                  </div>
                </div>

                {/* Initial Equity / Budget */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-semibold text-olive-900">
                      Land Area (ha)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={verifiedArea}
                      onChange={(e) => setVerifiedArea(e.target.value)}
                      placeholder="12.5"
                      className="w-full rounded-xl border border-olive-200 bg-cream-50/50 py-2.5 px-3 text-sm text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-olive-900">
                      Capital Reserve (₹)
                    </label>
                    <input
                      type="number"
                      step="50000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="500000"
                      className="w-full rounded-xl border border-olive-200 bg-cream-50/50 py-2.5 px-3 text-sm text-olive-950 outline-none focus:border-olive-600 focus:bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label className="mb-1.5 block font-semibold text-olive-900">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-olive-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-olive-200 bg-cream-50/50 py-2.5 pl-10 pr-3 text-sm text-olive-950 outline-none transition focus:border-olive-600 focus:bg-white focus:ring-2 focus:ring-olive-100"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 text-sm font-semibold"
            >
              {loading
                ? "Processing..."
                : mode === "login"
                ? "Sign in to GreenVest"
                : "Register & Generate Credit Score →"}
            </Button>
          </form>

          {/* Quick Demo Switchers */}
          <div className="mt-6 border-t border-olive-100 pt-4">
            <span className="text-[11px] font-semibold text-olive-500 uppercase tracking-wider block text-center">
              Quick Pitch & Demo Logins:
            </span>
            <div className="mt-2.5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("nashik_organic_agro")}
                className="rounded-full border border-olive-200 bg-cream-50 px-3 py-1 text-xs font-medium text-olive-800 hover:bg-olive-100 transition active:scale-95"
              >
                🌱 @nashik_organic_agro (Landowner)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("tata_nature_csr")}
                className="rounded-full border border-olive-200 bg-cream-50 px-3 py-1 text-xs font-medium text-olive-800 hover:bg-olive-100 transition active:scale-95"
              >
                🏢 @tata_nature_csr (Corporate)
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
