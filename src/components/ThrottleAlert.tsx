import { Alert, List, Group, Text } from "@mantine/core";
import type { GPUThrottling } from "../types";

const MIN_UTIL_FOR_THROTTLE = 20;
const MAX_CLOCK_MHZ_FOR_THROTTLE_ALERT = 1400;

const REASON_LABELS: Record<string, string> = {
  thermal_throttling: "Thermal Throttling",
  power_throttling: "Power Throttling",
  board_power_throttling: "Board Power Throttling",
  high_memory_usage: "High Memory Usage",
  memory_bound_workload: "Memory-Bound Workload",
  pcie_bandwidth_saturated: "PCIe Bandwidth Saturated",
};

export function isRealGpuThrottle(
  throttling: GPUThrottling,
  gpuUtilPercent: number,
  graphicsMhz: number
): boolean {
  return (
    throttling.is_throttled &&
    gpuUtilPercent > MIN_UTIL_FOR_THROTTLE &&
    graphicsMhz < MAX_CLOCK_MHZ_FOR_THROTTLE_ALERT
  );
}

interface ThrottleAlertProps {
  throttling: GPUThrottling;
  gpuUtilPercent: number;
  graphicsMhz: number;
}

export function ThrottleAlert({
  throttling,
  gpuUtilPercent,
  graphicsMhz,
}: ThrottleAlertProps) {
  if (!isRealGpuThrottle(throttling, gpuUtilPercent, graphicsMhz)) {
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
        <Text size="sm" c="neonGreen.4">
          No Throttling
        </Text>
      </Group>
    );
  }

  return (
    <Alert
      color="red"
      variant="light"
      title="THROTTLED"
      styles={{
        root: {
          borderLeft: "4px solid var(--mantine-color-red-6)",
          animation: "pulse 1.5s ease-in-out infinite",
        },
      }}
    >
      <List size="sm" spacing={2}>
        {throttling.bottlenecks.map((b) => (
          <List.Item key={b}>{REASON_LABELS[b] || b}</List.Item>
        ))}
      </List>
    </Alert>
  );
}
