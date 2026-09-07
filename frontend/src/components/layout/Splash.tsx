"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type SplashProps = {
  onFinish?: () => void;
  minDurationMs?: number;
};

export function Splash({ onFinish, minDurationMs = 2400 }: SplashProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, minDurationMs);
    return () => clearTimeout(t);
  }, [minDurationMs, onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-olive-950"
        >
          {/* Soft ambient glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.5, scale: 1.2 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="pointer-events-none absolute h-64 w-64 rounded-full bg-olive-500/30 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.25, scale: 1 }}
            transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
            className="pointer-events-none absolute h-96 w-96 rounded-full bg-brown-600/20 blur-3xl"
          />

          {/* Logo mark */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="relative h-24 w-24 sm:h-28 sm:w-28"
            >
              <Image
                src="/logo.svg"
                alt="GreenVest"
                fill
                priority
                className="object-contain drop-shadow-lg"
              />
            </motion.div>
          </motion.div>

          {/* Wordmark */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-2xl font-semibold tracking-wide text-cream-50 sm:text-3xl"
          >
            GreenVest
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-2 text-sm tracking-widest text-cream-300/80 uppercase"
          >
            Land · Carbon · Impact
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-10 h-0.5 w-40 overflow-hidden rounded-full bg-olive-800"
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: minDurationMs / 1000 - 0.4, ease: "easeInOut" }}
              className="h-full rounded-full bg-gradient-to-r from-olive-400 via-cream-300 to-brown-400"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
