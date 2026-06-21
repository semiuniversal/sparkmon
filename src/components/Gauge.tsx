import { RingProgress, Text, Stack } from "@mantine/core";

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
  if (!thresholds || max === 0) return "blue";
  const pct = (value / max) * 100;
  if (pct >= thresholds.crit) return "red";
  if (pct >= thresholds.warn) return "yellow";
  return "neonGreen";
}

export function Gauge({ value, max, label, unit, thresholds, size = 100 }: GaugeProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = getColor(value, max, thresholds);
  const displayValue = max > 0 ? Math.round(value) : "N/A";

  return (
    <Stack align="center" gap={4}>
      <RingProgress
        size={size}
        thickness={8}
        roundCaps
        sections={[{ value: pct, color }]}
        label={
          <Stack align="center" gap={0}>
            <Text fw={700} ff="monospace" size="lg" ta="center" lh={1.2}>
              {displayValue}
            </Text>
            {unit && max > 0 && (
              <Text c="dimmed" size="xs" ta="center">
                {unit}
              </Text>
            )}
          </Stack>
        }
      />
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.5px">
        {label}
      </Text>
    </Stack>
  );
}
