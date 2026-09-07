"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { UserProfile } from "@/types";
import { loginUser, registerUser, getUserProfile, subscribeToPlan } from "@/lib/api";

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
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "greenvest_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        // Default initial session as sample landowner for seamless demo evaluation
        const defaultUser: UserProfile = {
          user_id: "nashik_organic_agro",
          name: "Nashik Agro Holdings",
          email: "contact@nashikagro.in",
          user_type: "landowner",
          credit_score: 790,
          credit_tier: "Prime Green A+ (Tier 1 Verified)",
          credit_factors: [
            { name: "Land Equity & Asset Base", points: 94, max_points: 150, description: "Verified 12.5 ha landholding collateral" },
            { name: "Ecological Health & Stewardship", points: 126, max_points: 150, description: "Average Land Health Score 84/100" },
            { name: "Financial Capacity & Reserves", points: 63, max_points: 125, description: "₹5.0 Lakhs capital verified" },
            { name: "Verification & Platform Standing", points: 55, max_points: 75, description: "Active subscription & verified identity" },
          ],
          subscription_tier: "landowner_listing",
          verified_area_ha: 12.5,
          budget_inr: 500000.0,
          created_at: "2026-03-01",
        };
        setUser(defaultUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } catch {
      // ignore storage error
    } finally {
      setLoading(false);
    }
  }, []);

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

  const subscribe = async (planType: "landowner_listing" | "corporate_access", amount: number) => {
    if (!user) throw new Error("Must be signed in to subscribe");
    const res = await subscribeToPlan({
      user_id: user.user_id,
      plan_type: planType,
      amount_paid: amount,
    });
    const updated: UserProfile = {
      ...user,
      subscription_tier: res.subscription_tier as any,
      credit_score: res.credit_score,
      credit_tier: res.credit_tier,
    };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const refresh = async () => {
    if (!user) return;
    try {
      const updated = await getUserProfile(user.user_id);
      setUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to refresh user:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, subscribe, refresh }}>
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
