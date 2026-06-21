import type { CSSProperties } from "react";

interface GaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  thresholds?: { warn: number; crit: number };
  size?: number;
}

function getColor(
  value: number,
  max: number,
  thresholds?: { warn: number; crit: number }
): string {
  if (!thresholds || max === 0) return "var(--accent)";
  const pct = (value / max) * 100;
  if (pct >= thresholds.crit) return "var(--crit)";
  if (pct >= thresholds.warn) return "var(--warn)";
  return "var(--ok)";
}

export function Gauge({ value, max, label, unit, thresholds, size = 100 }: GaugeProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct * 0.75);
  const color = getColor(value, max, thresholds);

  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  };

  return (
    <div style={containerStyle}>
      <svg
        width={size}
        height={size * 0.8}
        viewBox={`0 0 ${size} ${size * 0.8}`}
      >
        <circle
          cx={size / 2}
          cy={size * 0.7}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          transform={`rotate(135, ${size / 2}, ${size * 0.7})`}
        />
        <circle
          cx={size / 2}
          cy={size * 0.7}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(135, ${size / 2}, ${size * 0.7})`}
          style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.4s ease" }}
        />
        <text
          x={size / 2}
          y={size * 0.65}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize={size * 0.22}
          fontWeight={700}
          fontFamily="monospace"
        >
          {max > 0 ? Math.round(value) : "N/A"}
        </text>
        {unit && max > 0 && (
          <text
            x={size / 2}
            y={size * 0.8}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize={size * 0.12}
            fontFamily="monospace"
          >
            {unit}
          </text>
        )}
      </svg>
      <span className="gauge-label">{label}</span>
    </div>
  );
}
