"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AtSign,
  Lock,
  Mail,
  User,
  Building2,
  TreePine,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEMO_ACCOUNTS = [
  {
    userId: "nashik_organic_agro",
    label: "Landowner",
    name: "Nashik Agro Holdings",
    password: "pass123",
    tier: "Listing plan",
  },
  {
    userId: "tata_nature_csr",
    label: "Corporate",
    name: "Tata Sustainability",
    password: "pass123",
    tier: "Corporate access",
  },
  {
    userId: "deccan_timber_trust",
    label: "Landowner",
    name: "Deccan Timber Trust",
    password: "pass123",
    tier: "Listing plan",
  },
  {
    userId: "greencorp_capital",
    label: "Corporate",
    name: "GreenCorp Fund",
    password: "pass123",
    tier: "Corporate access",
  },
] as const;

export default function AuthPage() {
  const router = useRouter();
  const { login, register, user, loading: authLoading } = useAuth();
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"landowner" | "corporate">("landowner");

  // Already signed in → leave auth page
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  // Check backend connectivity
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { method: "GET" });
        if (!cancelled) setApiStatus(res.ok ? "online" : "offline");
      } catch {
        if (!cancelled) setApiStatus("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDemoLogin = async (userId: string, password: string) => {
    setMode("login");
    setError(null);
    setLoading(true);
    setUserId(userId);
    setPassword(password);
    try {
      await login(userId, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo login failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <Loader2 className="h-8 w-8 animate-spin text-olive-700" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-olive-700" />
        <p className="mt-3 text-sm text-olive-600">You&apos;re signed in — redirecting…</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(userId || email, password);
      } else {
        const cleanId = userId.replace(/^@/, "").trim().toLowerCase();
        if (!cleanId || cleanId.length < 3) {
          throw new Error("Choose a unique @userid (min 3 characters).");
        }
        if (!/^[a-z0-9_]+$/.test(cleanId)) {
          throw new Error("UserID can only contain letters, numbers, and underscores.");
        }
        await register({
          user_id: cleanId,
          name: name.trim(),
          email: email.trim(),
          password,
          user_type: userType,
        });
      }
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream-50">
      {/* Ambient */}
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-olive-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-cream-400/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-24 sm:px-6 lg:flex-row lg:items-center lg:gap-16">
        {/* Brand panel */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 hidden max-w-md lg:mb-0 lg:block"
        >
          <Logo size="lg" href="/" />
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-olive-950 sm:text-4xl">
            Land intelligence for returns and climate impact.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-olive-700">
            Claim your unique @userid. Landowners list verified parcels. Corporates
            browse, simulate area plans, and message owners directly — we match, we
            don&apos;t mediate deals.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-olive-800">
            {[
              "Unique @userid & LandIDs",
              "Land Health Score + Credit Score",
              "AI strategies & carbon forecasts",
              "Corporate area simulation",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brown-500" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mx-auto w-full max-w-[420px]"
        >
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Logo size="md" showWordmark href="/" />
          </div>

          <div className="rounded-3xl border border-olive-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex rounded-full bg-cream-100 p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
                    mode === m
                      ? "bg-olive-800 text-cream-50 shadow-sm"
                      : "text-olive-700 hover:text-olive-950"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            <h2 className="text-lg font-bold text-olive-950">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-xs text-olive-600">
              {mode === "login"
                ? "Use your email or @userid"
                : "Pick a unique @userid — like Instagram"}
            </p>
            <p
              className={`mt-2 text-[11px] font-medium ${
                apiStatus === "online"
                  ? "text-emerald-700"
                  : apiStatus === "offline"
                  ? "text-red-600"
                  : "text-olive-500"
              }`}
            >
              {apiStatus === "checking" && "Checking server…"}
              {apiStatus === "online" && `Connected to API · ${API_BASE}`}
              {apiStatus === "offline" &&
                `Server offline · start backend at ${API_BASE} (uvicorn src.api.app:app --port 8000)`}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-olive-700">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-olive-400" />
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-xl border border-olive-200 bg-cream-50 py-2.5 pl-10 pr-3 text-sm text-olive-950 outline-none focus:border-olive-500 focus:bg-white focus:ring-2 focus:ring-olive-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-olive-700">
                      Unique @userid
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-olive-400" />
                      <input
                        required
                        value={userId}
                        onChange={(e) =>
                          setUserId(e.target.value.replace(/\s/g, "").toLowerCase())
                        }
                        placeholder="your_handle"
                        className="w-full rounded-xl border border-olive-200 bg-cream-50 py-2.5 pl-10 pr-3 text-sm text-olive-950 outline-none focus:border-olive-500 focus:bg-white focus:ring-2 focus:ring-olive-100"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-olive-500">
                      Others will reach you as @{userId || "userid"}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-olive-700">
                      I am a
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["landowner", "Landowner", TreePine],
                          ["corporate", "Corporate", Building2],
                        ] as const
                      ).map(([val, label, Icon]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setUserType(val)}
                          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                            userType === val
                              ? "border-olive-700 bg-olive-800 text-cream-50"
                              : "border-olive-200 bg-cream-50 text-olive-800 hover:bg-olive-50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-olive-700">
                  {mode === "login" ? "Email or @userid" : "Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-olive-400" />
                  <input
                    required
                    type={mode === "register" ? "email" : "text"}
                    value={mode === "login" ? userId || email : email}
                    onChange={(e) =>
                      mode === "login"
                        ? setUserId(e.target.value)
                        : setEmail(e.target.value)
                    }
                    placeholder={
                      mode === "login" ? "you@email.com or @userid" : "you@email.com"
                    }
                    className="w-full rounded-xl border border-olive-200 bg-cream-50 py-2.5 pl-10 pr-3 text-sm text-olive-950 outline-none focus:border-olive-500 focus:bg-white focus:ring-2 focus:ring-olive-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-olive-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-olive-400" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full rounded-xl border border-olive-200 bg-cream-50 py-2.5 pl-10 pr-3 text-sm text-olive-950 outline-none focus:border-olive-500 focus:bg-white focus:ring-2 focus:ring-olive-100"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 py-2.5 text-sm font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait…
                  </>
                ) : mode === "login" ? (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 border-t border-olive-100 pt-5">
              <div className="mb-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-olive-500">
                <Sparkles className="h-3.5 w-3.5 text-brown-500" />
                Demo accounts
              </div>
              <p className="mb-3 text-center text-[11px] text-olive-500">
                Password for all demos: <span className="font-mono font-semibold text-olive-800">pass123</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.userId}
                    type="button"
                    disabled={loading || apiStatus === "offline"}
                    onClick={() => handleDemoLogin(acc.userId, acc.password)}
                    className="rounded-xl border border-olive-200 bg-cream-50 px-3 py-2.5 text-left transition hover:border-olive-400 hover:bg-olive-50 disabled:opacity-50"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-brown-600">
                        {acc.label}
                      </span>
                      <span className="text-[10px] text-olive-500">{acc.tier}</span>
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-olive-950">
                      @{acc.userId}
                    </span>
                    <span className="block text-[10px] text-olive-600">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-olive-600">
            By continuing you agree to use GreenVest for decision support only — not
            certified carbon credits or investment advice.{" "}
            <Link href="/about" className="font-semibold text-olive-900 underline-offset-2 hover:underline">
              About us
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
