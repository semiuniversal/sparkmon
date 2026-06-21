import { Alert, List, Group, Text } from "@mantine/core";
import type { GPUThrottling } from "../types";

interface ThrottleAlertProps {
  throttling: GPUThrottling;
}

const REASON_LABELS: Record<string, string> = {
  thermal_throttling: "Thermal Throttling",
  power_throttling: "Power Throttling",
  board_power_throttling: "Board Power Throttling",
  high_memory_usage: "High Memory Usage",
  memory_bound_workload: "Memory-Bound Workload",
  pcie_bandwidth_saturated: "PCIe Bandwidth Saturated",
};

export function ThrottleAlert({ throttling }: ThrottleAlertProps) {
  if (!throttling.is_throttled) {
    return (
      <Group gap="xs" p="xs">
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--mantine-color-teal-5)",
            boxShadow: "0 0 6px var(--mantine-color-teal-5)",
          }}
        />
        <Text size="sm" c="teal">
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
