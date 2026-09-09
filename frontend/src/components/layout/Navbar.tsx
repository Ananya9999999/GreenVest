"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/discover", label: "Discover" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/analyze", label: "Analyze" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-olive-200/60 bg-cream-50/90 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo size="md" />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-olive-800" : "text-olive-600 hover:text-olive-900"
                )}
              >
                {l.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brown-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full border border-olive-200 bg-olive-50 px-3 py-1.5 text-xs font-semibold text-olive-900 transition hover:bg-olive-100"
              >
                <span className="font-mono text-olive-800">@{user.user_id}</span>
                <span className="rounded-full bg-olive-800 px-2 py-0.5 text-[10px] font-bold text-white">
                  {user.credit_score}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="rounded-full p-2 text-olive-600 transition hover:bg-cream-200/60 hover:text-olive-900"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="rounded-full border border-olive-800 px-4 py-1.5 text-xs font-semibold text-olive-900 transition hover:bg-olive-800 hover:text-cream-50"
            >
              Sign in
            </Link>
          )}

          <Link
            href={user ? "/discover" : "/auth"}
            className="rounded-full bg-olive-800 px-4 py-2 text-xs font-semibold text-cream-50 transition hover:bg-olive-700 active:scale-[0.98]"
          >
            {user ? "Analyze land" : "Get started"}
          </Link>
        </div>

        <button
          type="button"
          className="p-2 text-olive-800 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-olive-200 bg-cream-50 px-4 py-3 md:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-medium text-olive-800"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm font-semibold text-olive-900"
              >
                @{user.user_id}
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="mt-1 w-full rounded-full border border-olive-200 py-2.5 text-sm font-medium text-olive-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-full bg-olive-800 px-4 py-2.5 text-center text-sm font-medium text-cream-50"
            >
              Sign in / Sign up
            </Link>
          )}
        </motion.div>
      )}
    </motion.header>
  );
}
