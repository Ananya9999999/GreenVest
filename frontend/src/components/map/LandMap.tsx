"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup, Marker, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MapMarkerData,
  createCustomMarkerHtml,
  createPinnedLandMarkerHtml,
} from "./mapStyles";

export interface LandMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarkerData[];
  selectedId?: string;
  onMarkerClick?: (id: string) => void;
  onMapClick?: (lat: number, lon: number) => void;
  pinnedLocation?: { lat: number; lon: number; label?: string } | null;
  className?: string;
  height?: string | number;
  interactive?: boolean;
}

export function LandMap({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  markers = [],
  selectedId,
  onMarkerClick,
  onMapClick,
  pinnedLocation,
  className = "",
  height = "520px",
  interactive = true,
}: LandMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersGroupRef = useRef<LayerGroup | null>(null);
  const pinMarkerRef = useRef<Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet Map safely in browser environment
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === "undefined") return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default Leaflet icon paths in bundler environments
      const defaultProto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
      delete defaultProto._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: interactive,
          dragging: interactive,
          scrollWheelZoom: interactive ? "center" : false,
          doubleClickZoom: interactive,
        });

        // Add high-clarity OpenStreetMap Tile Layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | GreenVest AI',
          maxZoom: 19,
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersGroupRef.current = markersLayer;
        mapInstanceRef.current = map;

        // Click listener for dropping land pins
        map.on("click", (e: LeafletMouseEvent) => {
          onMapClickRef.current?.(e.latlng.lat, e.latlng.lng);
        });

        setMapReady(true);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
        pinMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update and render markers whenever markers or selectedId changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersGroupRef.current) return;

    import("leaflet").then((L) => {
      const layer = markersGroupRef.current;
      if (!layer) return;
      layer.clearLayers();

      const validMarkers = markers.filter(
        (m) => typeof m.lat === "number" && typeof m.lon === "number" && !isNaN(m.lat) && !isNaN(m.lon)
      );

      validMarkers.forEach((marker) => {
        const isSelected = marker.id === selectedId;
        const iconHtml = createCustomMarkerHtml(marker.healthScore, isSelected, marker.label);

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "gv-leaflet-marker",
          iconSize: isSelected ? [44, 44] : [36, 36],
          iconAnchor: isSelected ? [22, 44] : [18, 36],
          popupAnchor: [0, -38],
        });

        const leafletMarker = L.marker([marker.lat, marker.lon], {
          icon: customIcon,
          zIndexOffset: isSelected ? 1000 : 100,
        }).addTo(layer);

        // Click handler
        leafletMarker.on("click", () => {
          onMarkerClick?.(marker.id);
        });

        // Custom Styled Popup Card
        const formatPrice = (p?: number) => {
          if (!p) return "";
          if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
          if (p >= 100000) return `₹${(p / 100000).toFixed(1)} L`;
          return `₹${p.toLocaleString()}`;
        };

        const popupContent = `
          <div style="min-width: 200px; font-family: system-ui, sans-serif; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E6E1DA; padding-bottom: 6px;">
              <span style="font-family: monospace; font-size: 10px; font-weight: 700; background: #F4F6F3; color: #2D3A29; padding: 2px 6px; border-radius: 4px; border: 1px solid #D8D2C7;">
                ${marker.landId}
              </span>
              <span style="font-size: 11px; font-weight: 800; color: #047857; background: #ECFDF5; padding: 2px 6px; border-radius: 6px; border: 1px solid #A7F3D0;">
                Score: ${marker.healthScore}/100
              </span>
            </div>
            <div style="margin-top: 6px; font-size: 12px; font-weight: 700; color: #1E291C; line-height: 1.3;">
              ${marker.title || marker.label}
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: #5C6F57; display: flex; justify-content: space-between;">
              <span>📍 ${marker.label}</span>
              ${marker.area ? `<span><strong>${marker.area}</strong> ha</span>` : ""}
            </div>
            ${
              marker.price
                ? `<div style="margin-top: 4px; font-size: 12px; font-weight: 800; color: #1E291C;">
                    Valuation: ${formatPrice(marker.price)}
                   </div>`
                : ""
            }
            <div style="margin-top: 6px; font-size: 10px; color: #7C8B77;">
              Owner: <strong>@${marker.ownerUserId}</strong>
            </div>
          </div>
        `;

        leafletMarker.bindPopup(popupContent, {
          className: "gv-custom-popup",
          closeButton: true,
        });

        if (isSelected) {
          leafletMarker.openPopup();
        }
      });
    });
  }, [mapReady, markers, selectedId, onMarkerClick]);

  // Handle fly-to when selectedId changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !selectedId) return;

    const target = markers.find((m) => m.id === selectedId);
    if (target && typeof target.lat === "number" && typeof target.lon === "number") {
      mapInstanceRef.current.flyTo([target.lat, target.lon], 11, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [mapReady, selectedId, markers]);

  // Handle center / zoom changes when no marker is selected
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || selectedId) return;
    if (center && typeof center[0] === "number" && typeof center[1] === "number") {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [mapReady, center, zoom, selectedId]);

  // Handle pinned location marker (for Discover "drop pin" mode)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (pinMarkerRef.current) {
        map.removeLayer(pinMarkerRef.current);
        pinMarkerRef.current = null;
      }

      if (
        pinnedLocation &&
        typeof pinnedLocation.lat === "number" &&
        typeof pinnedLocation.lon === "number"
      ) {
        const pinIcon = L.divIcon({
          html: createPinnedLandMarkerHtml(pinnedLocation.label || "Target Parcel"),
          className: "gv-pinned-land-marker",
          iconSize: [42, 42],
          iconAnchor: [21, 42],
        });

        const newPin = L.marker([pinnedLocation.lat, pinnedLocation.lon], {
          icon: pinIcon,
          zIndexOffset: 2000,
        }).addTo(map);

        pinMarkerRef.current = newPin;

        map.flyTo([pinnedLocation.lat, pinnedLocation.lon], 12, {
          duration: 1.0,
        });
      }
    });
  }, [mapReady, pinnedLocation]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-olive-200/80 bg-cream-100/50 shadow-sm ${className}`}
      style={{ height }}
    >
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream-50/80 backdrop-blur-sm z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-olive-800 border-t-transparent" />
          <span className="mt-2 text-xs font-semibold text-olive-700">Loading interactive map...</span>
        </div>
      )}

      {/* Floating map controls / attribution badge */}
      <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-olive-800 shadow-sm backdrop-blur border border-olive-200/60">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Leaflet + OpenStreetMap</span>
      </div>
    </div>
  );
}
