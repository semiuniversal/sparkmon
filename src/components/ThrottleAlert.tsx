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
      <div className="throttle-ok">
        <span className="throttle-dot ok" />
        No Throttling
      </div>
    );
  }

  return (
    <div className="throttle-alert">
      <span className="throttle-dot crit" />
      <div>
        <strong>THROTTLED</strong>
        <ul className="throttle-reasons">
          {throttling.bottlenecks.map((b) => (
            <li key={b}>{REASON_LABELS[b] || b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
