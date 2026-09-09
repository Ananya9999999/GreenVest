"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export function AuthGuard({
  children,
  fallbackTitle = "Authentication Required",
  fallbackDescription = "Please sign in or claim your verified sovereign @userid to access this page.",
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Optional: auto-redirect after short delay or keep user on informative screen
      const timer = setTimeout(() => {
        setRedirecting(true);
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center pt-24 pb-16">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-olive-800 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold text-olive-700">Verifying sovereign session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-enter flex min-h-[75vh] items-center justify-center px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-olive-200/80 bg-white/95 p-8 text-center shadow-lg backdrop-blur"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-olive-900 text-cream-50 shadow-md">
            <Lock className="h-6 w-6 text-cream-100" />
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-900">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
            Protected Area
          </span>

          <h2 className="mt-3 text-xl font-bold text-olive-950">{fallbackTitle}</h2>
          <p className="mt-2 text-xs leading-relaxed text-olive-600">
            {fallbackDescription}
          </p>

          <div className="mt-6 space-y-3">
            <Link href={`/auth?redirect=${encodeURIComponent(pathname)}`} className="block">
              <Button className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2">
                <span>{redirecting ? "Redirecting to Sign In..." : "Sign In or Register"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/" className="block">
              <Button variant="outline" className="w-full py-2 text-xs">
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
