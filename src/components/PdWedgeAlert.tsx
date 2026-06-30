import { Alert, Group, Stack, Text } from "@mantine/core";
import type { PdWedgeAnalysis } from "../lib/pdWedge";
import { PD_WEDGE_SAMPLE_SIZE } from "../lib/pdWedge";

interface PdWedgeAlertProps {
  analysis: PdWedgeAnalysis;
}

function MetricLine({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (value == null) return null;
  return (
    <Text size="xs" c="dimmed">
      {label}: <Text span ff="monospace" c="inherit">{value}</Text>
    </Text>
  );
}

export function PdWedgeAlert({ analysis }: PdWedgeAlertProps) {
  const { status } = analysis;

  if (status === "wedged") {
    return (
      <Alert
        color="orange"
        variant="light"
        title="PD WEDGE DETECTED"
        styles={{
          root: {
            borderLeft: "4px solid var(--mantine-color-orange-6)",
            animation: "pulse 1.5s ease-in-out infinite",
          },
        }}
      >
        <Stack gap={4}>
          <Text size="sm">{analysis.explanation}</Text>
          <MetricLine
            label="Samples"
            value={`${analysis.loadSampleCount} under load / ${analysis.sampleCount} total`}
          />
          <MetricLine
            label="Avg util / power / clock"
            value={`${analysis.avgUtil?.toFixed(0)}% / ${analysis.avgPower?.toFixed(1)}W / ${analysis.avgClock?.toFixed(0)} MHz`}
          />
          <MetricLine
            label="Clock σ / range"
            value={`${analysis.clockStdDev?.toFixed(1)} MHz / ${analysis.clockRange?.toFixed(0)} MHz`}
          />
        </Stack>
      </Alert>
    );
  }

  if (status === "healthy") {
    return (
      <Group gap="xs" p="xs">
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--mantine-color-neonGreen-4)",
            boxShadow: "0 0 8px var(--mantine-color-neonGreen-4)",
          }}
        />
        <Stack gap={2}>
          <Text size="sm" c="neonGreen.4">
            PD Path OK
          </Text>
          <Text size="xs" c="dimmed">
            {analysis.explanation}
          </Text>
        </Stack>
      </Group>
    );
  }

  const label =
    status === "collecting"
      ? `PD Test: collecting (${analysis.sampleCount}/${PD_WEDGE_SAMPLE_SIZE})`
      : status === "idle"
        ? "PD Test: awaiting load"
        : "PD Test: clock data unavailable";

  return (
    <Group gap="xs" p="xs">
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "var(--mantine-color-dimmed)",
          opacity: 0.6,
        }}
      />
      <Stack gap={2}>
        <Text size="sm" c="dimmed">
          {label}
        </Text>
        <Text size="xs" c="dimmed">
          {analysis.explanation}
        </Text>
      </Stack>
    </Group>
  );
}
