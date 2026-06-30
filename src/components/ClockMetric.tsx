import { Group, Text } from "@mantine/core";

interface ClockMetricProps {
  currentMhz: number | null;
  history: number[];
}

export function ClockMetric({ currentMhz, history }: ClockMetricProps) {
  const nonZero = history.filter((v) => v > 0);
  const max =
    nonZero.length > 0
      ? Math.max(...nonZero, 1400)
      : 1400;

  return (
    <div className="clock-metric">
      <Group justify="space-between" align="flex-end" mb={6}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.5px">
          Graphics Clock
        </Text>
        <Text ff="monospace" fw={700} size="lg" lh={1}>
          {currentMhz != null && currentMhz > 0
            ? `${Math.round(currentMhz)}`
            : "—"}
          <Text span c="dimmed" fw={400} size="sm">
            {" "}
            MHz
          </Text>
        </Text>
      </Group>
      <div className="clock-sparkline" aria-hidden>
        {history.map((mhz, i) => {
          const height =
            mhz > 0 ? Math.max(8, Math.round((mhz / max) * 100)) : 4;
          return (
            <div
              key={i}
              className="clock-sparkline-bar"
              style={{ height: `${height}%` }}
              title={`${mhz} MHz`}
            />
          );
        })}
      </div>
    </div>
  );
}
