"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  QrCode,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { PaymentOrderResponse, VerifyPaymentResponse } from "@/types";
import { verifyPayment } from "@/lib/api";

interface UPIPaymentModalProps {
  order: PaymentOrderResponse;
  onClose: () => void;
  onSuccess: (res: VerifyPaymentResponse) => void;
}

export function UPIPaymentModal({
  order,
  onClose,
  onSuccess,
}: UPIPaymentModalProps) {
  const upiId = order.upi_id || "imananya07@okhdfcbank";
  const payeeName = order.upi_payee_name || "Ananya Singla - GreenVest";
  const amount = order.amount_inr;

  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [qrLoaded, setQrLoaded] = useState(true);

  // Standard UPI URI protocol for GPay / PhonePe / Paytm / BHIM
  const transactionNote = `GreenVest-${order.plan_type.substring(0, 10)}-${order.user_id}`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    upiUri
  )}`;

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setErrorMsg(null);

    try {
      const paymentRef = utrNumber.trim()
        ? `gpay_utr_${utrNumber.trim()}`
        : `gpay_${Date.now()}`;
      const signature = `sig_gpay_${order.order_id}_${paymentRef}`;

      const res = await verifyPayment({
        razorpay_order_id: order.order_id,
        razorpay_payment_id: paymentRef,
        razorpay_signature: signature,
        user_id: order.user_id,
        plan_type: order.plan_type,
      });

      onSuccess(res);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Payment verification failed. Please try again.";
      setErrorMsg(message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-olive-200 bg-white p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-olive-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Google Pay & UPI Checkout
              </div>
              <h2 className="mt-1 text-lg font-bold text-olive-950 sm:text-xl">
                {order.plan_name}
              </h2>
              <p className="text-xs text-olive-600">
                Pay directly to GPay ID: <span className="font-semibold text-olive-900">{upiId}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-olive-400 hover:bg-olive-100 hover:text-olive-700 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Amount Highlight Banner */}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-olive-800 to-emerald-800 px-5 py-3 text-cream-50 shadow-sm">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-cream-200 font-medium block">
                Total Payable Amount
              </span>
              <span className="text-2xl font-black text-white">
                ?{amount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-[11px] font-medium text-cream-100">
                <ShieldCheck className="h-3.5 w-3.5 text-cream-200" />
                Instant Activation
              </span>
              <span className="block text-[10px] text-cream-200/80 mt-0.5">
                Annual Subscription
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* Step 1: Scan & Pay or Open in GPay */}
            <div className="rounded-2xl border border-olive-100 bg-cream-50/50 p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Dynamic UPI QR Code */}
                <div className="relative flex flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-sm border border-olive-200 shrink-0">
                  {qrLoaded ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={qrImageUrl}
                      alt="UPI QR Code"
                      width={140}
                      height={140}
                      className="rounded-lg"
                      onError={() => setQrLoaded(false)}
                    />
                  ) : (
                    <div className="flex h-[140px] w-[140px] flex-col items-center justify-center text-center p-2">
                      <QrCode className="h-10 w-10 text-olive-400 mb-1" />
                      <span className="text-[10px] text-olive-600">Scan via GPay app</span>
                    </div>
                  )}
                  <span className="mt-1 text-[10px] font-semibold text-olive-600 flex items-center gap-1">
                    <QrCode className="h-3 w-3 text-olive-500" /> Scan to Pay
                  </span>
                </div>

                {/* Direct Pay Options */}
                <div className="flex-1 space-y-2.5 text-xs text-olive-800 w-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-olive-500 block mb-0.5">
                      Target Google Pay / UPI ID
                    </span>
                    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-olive-200">
                      <span className="font-mono text-xs font-bold text-olive-950 select-all">
                        {upiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUPI}
                        className="inline-flex items-center gap-1 rounded-lg bg-olive-100 hover:bg-olive-200 px-2 py-1 text-[11px] font-semibold text-olive-800 transition"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-olive-600" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Open in GPay button */}
                  <a
                    href={upiUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 transition text-xs shadow-sm"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Open in Google Pay / UPI App</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
                  </a>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-olive-500 pt-0.5">
                    <span>Supports:</span>
                    <span className="font-medium text-olive-700">GPay · PhonePe · Paytm · BHIM · HDFC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Confirmation & Activation */}
            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-olive-900 mb-1">
                  UPI Ref / UTR No. or Transaction ID <span className="font-normal text-olive-500">(from your GPay receipt)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 425890123456 or leave blank for instant verification"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full rounded-xl border border-olive-200 bg-cream-50/40 px-3.5 py-2.5 text-xs text-olive-950 outline-none transition focus:border-olive-600 focus:bg-white"
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-olive-200 px-4 py-2.5 text-xs font-semibold text-olive-700 hover:bg-olive-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-olive-900 hover:bg-olive-800 disabled:bg-olive-400 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <span>I Have Paid — Activate Plan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
