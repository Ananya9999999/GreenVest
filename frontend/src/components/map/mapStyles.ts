export const DEFAULT_MAP_CENTER: [number, number] = [20.5937, 78.9629];
export const DEFAULT_MAP_ZOOM = 5;

export interface MapMarkerData {
  id: string;
  lat: number;
  lon: number;
  label: string;
  healthScore: number;
  landId: string;
  ownerUserId: string;
  price?: number;
  area?: number;
  soil?: string;
  title?: string;
  distance_to_road_km?: number;
  distance_to_market_km?: number;
}

/**
 * Returns color hex according to land health score (0–100)
 */
export function getHealthScoreColor(score: number): {
  bg: string;
  border: string;
  text: string;
  dot: string;
} {
  if (score >= 80) {
    return {
      bg: "#ECFDF5", // emerald-50
      border: "#059669", // emerald-600
      text: "#065F46", // emerald-800
      dot: "#10B981", // emerald-500
    };
  }
  if (score >= 70) {
    return {
      bg: "#F4F6F3", // olive-50
      border: "#3F513D", // olive-700
      text: "#1E291C", // olive-900
      dot: "#4E644B", // olive-600
    };
  }
  return {
    bg: "#FFFBEB", // amber-50
    border: "#D97706", // amber-600
    text: "#92400E", // amber-800
    dot: "#F59E0B", // amber-500
  };
}

/**
 * Generate custom HTML string for Leaflet DivIcon
 */
export function createCustomMarkerHtml(
  score: number,
  isSelected: boolean = false,
  label?: string
): string {
  const colors = getHealthScoreColor(score);
  const size = isSelected ? 44 : 36;
  const pulseClass = isSelected ? "animate-pulse" : "";
  const ringStyle = isSelected
    ? `box-shadow: 0 0 0 4px rgba(45, 58, 41, 0.35), 0 10px 15px -3px rgba(0, 0, 0, 0.2);`
    : `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);`;

  return `
    <div style="position: relative; width: ${size}px; height: ${size}px;" class="gv-marker-container" title="${label || `Land Health: ${score}/100`}">
      ${
        isSelected
          ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background-color: #3F513D; opacity: 0.3;" class="${pulseClass}"></div>`
          : ""
      }
      <div style="
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        background-color: ${isSelected ? "#1E291C" : colors.bg};
        border: 2.5px solid ${isSelected ? "#F5F3EF" : colors.border};
        color: ${isSelected ? "#FAF8F5" : colors.text};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 800;
        font-size: ${isSelected ? "13px" : "11px"};
        line-height: 1;
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ${ringStyle}
      " class="hover:scale-110">
        <span>${score}</span>
        <span style="font-size: 8px; opacity: 0.8; font-weight: 600;">pts</span>
      </div>
      <div style="
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${isSelected ? "#1E291C" : colors.border};
      "></div>
    </div>
  `;
}

/**
 * Generate pin marker for Discover page (user dropped pin)
 */
export function createPinnedLandMarkerHtml(label: string = "Target Land"): string {
  return `
    <div style="position: relative; width: 42px; height: 42px;" class="gv-pin-container">
      <div style="position: absolute; inset: -6px; border-radius: 9999px; background-color: #8C4A32; opacity: 0.25;" class="animate-ping"></div>
      <div style="
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        background: linear-gradient(135deg, #8C4A32 0%, #5E2E1D 100%);
        border: 2.5px solid #FAF8F5;
        color: #FAF8F5;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 15px -3px rgba(140, 74, 50, 0.4);
        cursor: pointer;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div style="
        position: absolute;
        top: -24px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #1E291C;
        color: #FAF8F5;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
        white-space: nowrap;
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      ">
        ${label}
      </div>
    </div>
  `;
}
