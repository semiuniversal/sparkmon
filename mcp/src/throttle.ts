import type { GPUThrottling } from "./types.js";

export const MIN_UTIL_FOR_THROTTLE = 20;
export const MAX_CLOCK_MHZ_FOR_THROTTLE_ALERT = 1400;

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

export function formatBottlenecks(bottlenecks: string[]): string[] {
  return bottlenecks.map((b) => REASON_LABELS[b] ?? b);
}

export interface ThrottleAnalysis {
  nvml_is_throttled: boolean;
  gpu_util_percent: number;
  graphics_clock_mhz: number;
  is_real_throttle: boolean;
  bottlenecks: string[];
  bottlenecks_human: string[];
  explanation: string;
}

export function analyzeThrottle(
  throttling: GPUThrottling,
  gpuUtilPercent: number,
  graphicsMhz: number
): ThrottleAnalysis {
  const isReal = isRealGpuThrottle(throttling, gpuUtilPercent, graphicsMhz);
  const bottlenecksHuman = formatBottlenecks(throttling.bottlenecks);

  let explanation: string;
  if (!throttling.is_throttled) {
    explanation =
      "NVML reports no throttle flags. GPU is not throttled.";
  } else if (isReal) {
    explanation =
      "Real throttle detected: NVML throttle flag is set, GPU utilization is above 20%, and graphics clock is below 1400 MHz. This pattern matches hardware power-delivery issues under load (e.g. ASUS GX10 PD-controller bug with clocks locked around 660–747 MHz).";
  } else if (gpuUtilPercent <= MIN_UTIL_FOR_THROTTLE) {
    explanation =
      "NVML throttle flag is set but GPU utilization is at or below 20%. This is normal idle power-management behavior, not a real throttle event.";
  } else if (graphicsMhz >= MAX_CLOCK_MHZ_FOR_THROTTLE_ALERT) {
    explanation =
      "NVML throttle flag is set under load but graphics clock is at or above 1400 MHz. Clocks are healthy; treating as a false positive.";
  } else {
    explanation =
      "Throttle flags present but conditions for a real throttle event are not all met.";
  }

  return {
    nvml_is_throttled: throttling.is_throttled,
    gpu_util_percent: gpuUtilPercent,
    graphics_clock_mhz: graphicsMhz,
    is_real_throttle: isReal,
    bottlenecks: throttling.bottlenecks,
    bottlenecks_human: bottlenecksHuman,
    explanation,
  };
}
