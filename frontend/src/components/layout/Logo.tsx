"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
  light?: boolean;
};

const sizes = {
  sm: { box: "h-8 w-8", text: "text-base" },
  md: { box: "h-9 w-9", text: "text-lg" },
  lg: { box: "h-12 w-12", text: "text-xl" },
};

export function Logo({
  className,
  showWordmark = true,
  size = "md",
  href = "/",
  light = false,
}: LogoProps) {
  const s = sizes[size];
  const content = (
    <span className={cn("inline-flex items-center gap-2 group", className)}>
      <span
        className={cn(
          "relative overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105",
          s.box
        )}
      >
        <Image
          src="/logo.svg"
          alt="GreenVest"
          fill
          className="object-contain"
          priority
        />
      </span>
      {showWordmark && (
        <span
          className={cn(
            "font-semibold tracking-tight",
            s.text,
            light ? "text-cream-50" : "text-olive-900"
          )}
        >
          GreenVest
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-olive-500 rounded-full">
        {content}
      </Link>
    );
  }
  return content;
}
