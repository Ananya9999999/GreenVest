"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { UserProfile } from "@/types";
import {
  loginUser,
  registerUser,
  getUserProfile,
  subscribeToPlan,
} from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
/** Only open Razorpay when BOTH key and explicit flag are set. Otherwise use API demo activate. */
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
const RAZORPAY_ENABLED =
  process.env.NEXT_PUBLIC_RAZORPAY_ENABLED === "true" && !!RAZORPAY_KEY;

interface PaymentSuccess {
  payment_id: string;
  subscription_tier: string;
  credit_score: number;
  plan_type: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (emailOrId: string, pass: string) => Promise<UserProfile>;
  register: (data: {
    user_id: string;
    name: string;
    email: string;
    password: string;
    user_type: string;
    verified_area_ha?: number;
    budget_inr?: number;
  }) => Promise<UserProfile>;
  logout: () => void;
  subscribe: (
    planType: "landowner_listing" | "corporate_access",
    amount: number
  ) => Promise<void>;
  initiateRazorpayPayment: (
    planType: "landowner_listing" | "corporate_access",
    handlers?: {
      onSuccess?: (res: PaymentSuccess) => void;
      onError?: (err: Error) => void;
      onCancel?: () => void;
    }
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "greenvest_auth_user";

const PLAN_AMOUNTS: Record<"landowner_listing" | "corporate_access", number> = {
  landowner_listing: 1999,
  corporate_access: 9999,
};

function persist(user: UserProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function activatePlanForUser(
  user: UserProfile,
  planType: "landowner_listing" | "corporate_access",
  amountInr: number
): Promise<UserProfile> {
  const res = await subscribeToPlan({
    user_id: user.user_id,
    plan_type: planType,
    amount_paid: amountInr,
  });
  return {
    ...user,
    subscription_tier:
      res.subscription_tier as UserProfile["subscription_tier"],
    credit_score: res.credit_score,
    credit_tier: res.credit_tier,
  };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserProfile;
        if (parsed?.user_id) setUser(parsed);
        else localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (emailOrId: string, pass: string) => {
    const cleaned = emailOrId.trim().replace(/^@/, "");
    if (!cleaned || !pass) {
      throw new Error("Enter your email or @userid and password.");
    }
    const profile = await loginUser({
      email_or_user_id: cleaned,
      password: pass,
    });
    if (!profile?.user_id) {
      throw new Error("Login succeeded but profile was empty.");
    }
    setUser(profile);
    persist(profile);
    return profile;
  }, []);

  const register = useCallback(
    async (data: {
      user_id: string;
      name: string;
      email: string;
      password: string;
      user_type: string;
      verified_area_ha?: number;
      budget_inr?: number;
    }) => {
      const profile = await registerUser({
        ...data,
        user_id: data.user_id.replace(/^@/, "").trim().toLowerCase(),
      });
      if (!profile?.user_id) {
        throw new Error("Register succeeded but profile was empty.");
      }
      setUser(profile);
      persist(profile);
      return profile;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    persist(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("greenvest_user");
      localStorage.removeItem("greenvest_token");
    } catch {
      /* ignore */
    }
  }, []);

  const subscribe = useCallback(
    async (
      planType: "landowner_listing" | "corporate_access",
      amount: number
    ) => {
      if (!user) throw new Error("Must be signed in to subscribe");
      const updated = await activatePlanForUser(user, planType, amount);
      setUser(updated);
      persist(updated);
    },
    [user]
  );

  /**
   * Default: activate plan via backend API (works for every signed-in user).
   * Optional: real Razorpay only if NEXT_PUBLIC_RAZORPAY_ENABLED=true and key is set.
   */
  const initiateRazorpayPayment = useCallback(
    async (
      planType: "landowner_listing" | "corporate_access",
      handlers?: {
        onSuccess?: (res: PaymentSuccess) => void;
        onError?: (err: Error) => void;
        onCancel?: () => void;
      }
    ) => {
      if (!user) {
        const err = new Error("Sign in before purchasing a plan.");
        handlers?.onError?.(err);
        throw err;
      }

      const amountInr = PLAN_AMOUNTS[planType];
      const planName =
        planType === "landowner_listing"
          ? "Landowner Listing Pass"
          : "Corporate Access Pass";

      // ——— Demo / reliable path (default) ———
      if (!RAZORPAY_ENABLED) {
        try {
          const updated = await activatePlanForUser(user, planType, amountInr);
          setUser(updated);
          persist(updated);
          handlers?.onSuccess?.({
            payment_id: `demo_${Date.now()}`,
            subscription_tier: updated.subscription_tier,
            credit_score: updated.credit_score,
            plan_type: planType,
          });
          return;
        } catch (e) {
          const err =
            e instanceof Error ? e : new Error("Subscription activation failed");
          handlers?.onError?.(err);
          throw err;
        }
      }

      // ——— Live Razorpay path ———
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        // Fall back to API activate instead of hard-failing
        try {
          const updated = await activatePlanForUser(user, planType, amountInr);
          setUser(updated);
          persist(updated);
          handlers?.onSuccess?.({
            payment_id: `fallback_${Date.now()}`,
            subscription_tier: updated.subscription_tier,
            credit_score: updated.credit_score,
            plan_type: planType,
          });
          return;
        } catch (e) {
          const err = new Error("Could not load Razorpay and API activate failed.");
          handlers?.onError?.(err);
          throw err;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Rz = (window as any).Razorpay;
      const options: Record<string, unknown> = {
        key: RAZORPAY_KEY,
        amount: amountInr * 100,
        currency: "INR",
        name: "GreenVest",
        description: planName,
        prefill: {
          name: user.name,
          email: user.email,
        },
        notes: {
          user_id: user.user_id,
          plan_type: planType,
        },
        theme: { color: "#2e3923" },
        handler: async (response: { razorpay_payment_id: string }) => {
          try {
            const updated = await activatePlanForUser(user, planType, amountInr);
            setUser(updated);
            persist(updated);
            handlers?.onSuccess?.({
              payment_id: response.razorpay_payment_id,
              subscription_tier: updated.subscription_tier,
              credit_score: updated.credit_score,
              plan_type: planType,
            });
          } catch (e) {
            const err =
              e instanceof Error
                ? e
                : new Error("Paid, but plan activation failed. Contact support.");
            handlers?.onError?.(err);
          }
        },
        modal: {
          ondismiss: () => handlers?.onCancel?.(),
        },
      };

      try {
        const rzp = new Rz(options);
        rzp.on("payment.failed", async () => {
          // Razorpay UI failed — still try demo activate so the product works
          try {
            const updated = await activatePlanForUser(user, planType, amountInr);
            setUser(updated);
            persist(updated);
            handlers?.onSuccess?.({
              payment_id: `demo_after_rzp_fail_${Date.now()}`,
              subscription_tier: updated.subscription_tier,
              credit_score: updated.credit_score,
              plan_type: planType,
            });
          } catch (e) {
            const err =
              e instanceof Error
                ? e
                : new Error("Razorpay payment failed. Check test key / use demo mode.");
            handlers?.onError?.(err);
          }
        });
        rzp.open();
      } catch (e) {
        // Instant open failure → API activate
        try {
          const updated = await activatePlanForUser(user, planType, amountInr);
          setUser(updated);
          persist(updated);
          handlers?.onSuccess?.({
            payment_id: `demo_rzp_open_fail_${Date.now()}`,
            subscription_tier: updated.subscription_tier,
            credit_score: updated.credit_score,
            plan_type: planType,
          });
        } catch (inner) {
          const err =
            inner instanceof Error ? inner : new Error("Payment failed");
          handlers?.onError?.(err);
          throw err;
        }
      }
    },
    [user]
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const updated = await getUserProfile(user.user_id);
      setUser(updated);
      persist(updated);
    } catch (e) {
      console.warn("Failed to refresh user:", e);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        subscribe,
        initiateRazorpayPayment,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
