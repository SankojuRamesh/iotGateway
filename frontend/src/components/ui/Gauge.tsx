import { gaugeColorForRatio, theme } from "@/styles/theme";

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  size?: number;
}

/** Radial threshold gauge (green -> orange -> red arc), matching the
 * "Memory" / "Google hits" panels in the reference dashboard screenshot. */
export function Gauge({ value, min = 0, max = 100, label, unit = "", size = 140 }: GaugeProps) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = max === min ? 0 : (clamped - min) / (max - min);
  const color = gaugeColorForRatio(ratio);

  const strokeWidth = size * 0.09;
  const radius = size / 2 - strokeWidth;
  const circumference = Math.PI * radius; // half circle
  const arcOffset = circumference * (1 - ratio);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        <path
          d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
          fill="none"
          stroke={theme.chart.gauge.track}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={arcOffset}
          style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.4s ease" }}
        />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize={size * 0.16}
          fontWeight={600}
          fill="var(--text-primary)"
        >
          {formatGaugeValue(clamped)}
          {unit}
        </text>
      </svg>
      {label && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
          {label}
        </div>
      )}
    </div>
  );
}

function formatGaugeValue(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
