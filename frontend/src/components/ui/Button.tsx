"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type Props = HTMLMotionProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary: "bg-olive-800 text-cream-50 hover:bg-olive-700",
      secondary: "bg-cream-200 text-olive-900 hover:bg-cream-300",
      ghost: "text-olive-800 hover:bg-olive-100",
      outline: "border border-olive-300 text-olive-800 hover:bg-olive-50",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
