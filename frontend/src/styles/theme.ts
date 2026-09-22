export const theme = {
  color: {
    bg: "#0b0c0e",
    surface: "#181b1f",
    surfaceRaised: "#212428",
    border: "#2c3235",
    borderHover: "#3d444a",
    textPrimary: "#d8d9da",
    textSecondary: "#8e9297",
    textMuted: "#6a6f76",
    accent: "#5794f2",
    danger: "#f2495c",
    warning: "#ff9830",
    success: "#73bf69",
  },
  chart: {
    categorical: [
      "#5794F2", // blue
      "#F2495C", // red
      "#B877D9", // purple
      "#FF9830", // orange
      "#73BF69", // green
      "#FADE2A", // yellow
      "#8AB8FF", // light blue
      "#FF780A", // deep orange
    ],
    gauge: {
      good: "#73BF69",
      warn: "#FF9830",
      critical: "#F2495C",
      track: "#2c3235",
    },
  },
  radius: {
    sm: "4px",
    md: "6px",
    lg: "10px",
  },
  font: {
    family:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
  },
} as const;

export type Theme = typeof theme;

/** Deterministic color assignment so the same series key always gets the
 * same color across re-renders/widgets (mirrors Grafana's per-series hashing). */
export function seriesColor(index: number): string {
  return theme.chart.categorical[index % theme.chart.categorical.length];
}

export function gaugeColorForRatio(ratio: number): string {
  if (ratio >= 0.9) return theme.chart.gauge.critical;
  if (ratio >= 0.7) return theme.chart.gauge.warn;
  return theme.chart.gauge.good;
}
