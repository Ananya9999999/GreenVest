"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Sparkles, ArrowRight } from "lucide-react";
import type { MapMarkerData } from "./mapStyles";

interface MapMarkerPopupProps {
  marker: MapMarkerData;
  onSelect?: (id: string) => void;
}

export function MapMarkerPopup({ marker, onSelect }: MapMarkerPopupProps) {
  const formatPrice = (price?: number) => {
    if (!price) return null;
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)} Lakhs`;
    return `₹${price.toLocaleString()}`;
  };

  return (
    <div className="w-64 p-1 font-sans text-olive-950">
      <div className="flex items-start justify-between gap-2 border-b border-olive-100 pb-2">
        <div>
          <span className="rounded bg-olive-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-olive-800">
            {marker.landId}
          </span>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-olive-900">
            <MapPin className="h-3.5 w-3.5 text-olive-600 shrink-0" />
            <span className="truncate">{marker.label}</span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-0.5 rounded-lg bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 border border-emerald-200/60">
            <span>{marker.healthScore}</span>
            <span className="text-[9px] text-emerald-600">/100</span>
          </div>
          <span className="text-[9px] font-medium text-emerald-700">Health Score</span>
        </div>
      </div>

      {marker.title && (
        <p className="mt-2 text-xs font-semibold text-olive-950 line-clamp-2 leading-snug">
          {marker.title}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between rounded-lg bg-cream-100/70 p-2 text-[11px]">
        <div>
          <span className="text-olive-500 block text-[9px]">Owner</span>
          <span className="font-semibold text-olive-900">@{marker.ownerUserId}</span>
        </div>
        {marker.area && (
          <div className="text-right">
            <span className="text-olive-500 block text-[9px]">Area</span>
            <span className="font-semibold text-olive-900">{marker.area} ha</span>
          </div>
        )}
      </div>

      {marker.price && (
        <div className="mt-2 flex items-baseline justify-between pt-1">
          <span className="text-[10px] text-olive-500">Valuation:</span>
          <span className="text-xs font-extrabold text-olive-950">
            {formatPrice(marker.price)}
          </span>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-1.5 pt-1">
        <Link
          href={`/analyze?location=${encodeURIComponent(marker.label)}&area=${marker.area || 10}&soil=${encodeURIComponent(marker.soil || "Black soil")}`}
          className="flex items-center justify-center gap-1 rounded-lg bg-olive-800 py-1.5 text-[11px] font-semibold text-cream-50 transition hover:bg-olive-700"
        >
          <Sparkles className="h-3 w-3" />
          <span>Audit</span>
        </Link>

        <button
          type="button"
          onClick={() => onSelect?.(marker.id)}
          className="flex items-center justify-center gap-1 rounded-lg border border-olive-300 bg-white py-1.5 text-[11px] font-semibold text-olive-800 transition hover:bg-olive-50"
        >
          <span>Select</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
