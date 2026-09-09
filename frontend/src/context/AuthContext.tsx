"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UserProfile, PaymentOrderResponse, VerifyPaymentResponse } from "@/types";
import {
  loginUser,
  registerUser,
  getUserProfile,
  subscribeToPlan,
  createPaymentOrder,
} from "@/lib/api";
import { UPIPaymentModal } from "@/components/payments/UPIPaymentModal";

interface PaymentCallbacks {
  onSuccess?: (res: VerifyPaymentResponse) => void;
  onError?: (err: Error) => void;
  onCancel?: () => void;
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
  subscribe: (planType: "landowner_listing" | "corporate_access", amount: number) => Promise<void>;
  initiateRazorpayPayment: (
    planType: "landowner_listing" | "corporate_access",
    callbacks?: PaymentCallbacks
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "greenvest_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (userId: string) => {
    try {
      const fresh = await getUserProfile(userId);
      setUser(fresh);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    } catch (e) {
      console.warn("Could not rehydrate profile from backend database:", e);
      return null;
    }
  }, []);

  useEffect(() => {
    async function initAuth() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          // Always rehydrate from backend DB so database is single source of truth
          await refreshProfile(parsed.user_id);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, [refreshProfile]);

  const login = async (emailOrId: string, pass: string): Promise<UserProfile> => {
    const profile = await loginUser({ email_or_user_id: emailOrId, password: pass });
    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  };

  const register = async (data: {
    user_id: string;
    name: string;
    email: string;
    password: string;
    user_type: string;
    verified_area_ha?: number;
    budget_inr?: number;
  }): Promise<UserProfile> => {
    const profile = await registerUser(data);
    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refresh = async () => {
    if (!user) return;
    await refreshProfile(user.user_id);
  };

  const subscribe = async (planType: "landowner_listing" | "corporate_access", amount: number) => {
    if (!user) throw new Error("Must be signed in to subscribe");
    const res = await subscribeToPlan({
      user_id: user.user_id,
      plan_type: planType,
      amount_paid: amount,
    });
    const updated: UserProfile = {
      ...user,
      subscription_tier: res.subscription_tier as UserProfile["subscription_tier"],
      credit_score: res.credit_score,
      credit_tier: res.credit_tier,
    };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const [activePaymentOrder, setActivePaymentOrder] = useState<PaymentOrderResponse | null>(null);
  const [activePaymentCallbacks, setActivePaymentCallbacks] = useState<PaymentCallbacks | null>(null);

  const initiateRazorpayPayment = async (
    planType: "landowner_listing" | "corporate_access",
    callbacks?: PaymentCallbacks
  ) => {
    if (!user) {
      const err = new Error("Please sign in or register before upgrading your subscription.");
      callbacks?.onError?.(err);
      throw err;
    }

    try {
      // 1. Create order on backend (populates upi_id: imananya07@okhdfcbank, amount, order_id)
      const order: PaymentOrderResponse = await createPaymentOrder({
        user_id: user.user_id,
        plan_type: planType,
      });

      // 2. Open Google Pay & UPI checkout modal for imananya07@okhdfcbank
      setActivePaymentCallbacks(callbacks || null);
      setActivePaymentOrder(order);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error("Payment initialization failed");
      callbacks?.onError?.(err);
      throw err;
    }
  };

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
      {activePaymentOrder && (
        <UPIPaymentModal
          order={activePaymentOrder}
          onClose={() => {
            setActivePaymentOrder(null);
            activePaymentCallbacks?.onCancel?.();
            setActivePaymentCallbacks(null);
          }}
          onSuccess={async (res) => {
            setActivePaymentOrder(null);
            await refreshProfile(user ? user.user_id : res.user_id);
            activePaymentCallbacks?.onSuccess?.(res);
            setActivePaymentCallbacks(null);
          }}
        />
      )}
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
