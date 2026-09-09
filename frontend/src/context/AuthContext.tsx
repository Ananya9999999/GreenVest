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
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "greenvest_auth_user";

function persist(user: UserProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
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
      throw new Error("Login succeeded but profile was empty. Check API response.");
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
      const res = await subscribeToPlan({
        user_id: user.user_id,
        plan_type: planType,
        amount_paid: amount,
      });
      const updated: UserProfile = {
        ...user,
        subscription_tier:
          res.subscription_tier as UserProfile["subscription_tier"],
        credit_score: res.credit_score,
        credit_tier: res.credit_tier,
      };
      setUser(updated);
      persist(updated);
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
      value={{ user, loading, login, register, logout, subscribe, refresh }}
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
