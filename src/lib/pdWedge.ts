/** PD (power distribution) wedge detection — ASUS GX10 firmware defect signature. */

export const PD_WEDGE_SAMPLE_SIZE = 20;
export const PD_WEDGE_MIN_UTIL = 90;
export const PD_WEDGE_MAX_POWER_W = 20;
export const PD_WEDGE_HEALTHY_MIN_POWER_W = 30;
/** MHz — variance below this means clock is pinned flat. */
export const PD_WEDGE_MAX_CLOCK_STDDEV_MHZ = 5;
export const PD_WEDGE_MAX_CLOCK_RANGE_MHZ = 10;
/** Minimum high-util samples before evaluating wedge vs healthy. */
export const PD_WEDGE_MIN_LOAD_SAMPLES = 10;

export interface PdWedgeSample {
  timestamp: number;
  utilizationGpu: number;
  powerWatts: number;
  /** Graphics clock MHz from metrics API (proxy for nvidia-smi clocks.sm). */
  clockMhz: number;
}

export type PdWedgeStatus =
  | "collecting"
  | "idle"
  | "insufficient_clock_data"
  | "healthy"
  | "wedged";

export interface PdWedgeAnalysis {
  status: PdWedgeStatus;
  sampleCount: number;
  loadSampleCount: number;
  avgUtil: number | null;
  avgPower: number | null;
  avgClock: number | null;
  clockStdDev: number | null;
  clockRange: number | null;
  explanation: string;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function extractPdWedgeSample(gpu: {
  utilization: { gpu_percent: number };
  power: { usage_watts: number };
  clocks: { graphics_mhz: number };
}): PdWedgeSample {
  return {
    timestamp: Date.now(),
    utilizationGpu: gpu.utilization.gpu_percent,
    powerWatts: gpu.power.usage_watts,
    clockMhz: gpu.clocks.graphics_mhz,
  };
}

export function analyzePdWedge(samples: PdWedgeSample[]): PdWedgeAnalysis {
  const sampleCount = samples.length;

  if (sampleCount < PD_WEDGE_SAMPLE_SIZE) {
    return {
      status: "collecting",
      sampleCount,
      loadSampleCount: samples.filter((s) => s.utilizationGpu > PD_WEDGE_MIN_UTIL)
        .length,
      avgUtil: null,
      avgPower: null,
      avgClock: null,
      clockStdDev: null,
      clockRange: null,
      explanation: `Collecting samples (${sampleCount}/${PD_WEDGE_SAMPLE_SIZE})… Run inference load to exercise the PD test.`,
    };
  }

  const loadSamples = samples.filter((s) => s.utilizationGpu > PD_WEDGE_MIN_UTIL);

  if (loadSamples.length < PD_WEDGE_MIN_LOAD_SAMPLES) {
    return {
      status: "idle",
      sampleCount,
      loadSampleCount: loadSamples.length,
      avgUtil: mean(samples.map((s) => s.utilizationGpu)),
      avgPower: mean(samples.map((s) => s.powerWatts)),
      avgClock: null,
      clockStdDev: null,
      clockRange: null,
      explanation:
        "GPU not under heavy load. PD wedge test requires utilization > 90% (run inference or a CUDA stress test).",
    };
  }

  const utils = loadSamples.map((s) => s.utilizationGpu);
  const powers = loadSamples.map((s) => s.powerWatts);
  const clocks = loadSamples.map((s) => s.clockMhz).filter((c) => c > 0);

  const avgUtil = mean(utils);
  const avgPower = mean(powers);

  if (clocks.length < PD_WEDGE_MIN_LOAD_SAMPLES) {
    return {
      status: "insufficient_clock_data",
      sampleCount,
      loadSampleCount: loadSamples.length,
      avgUtil,
      avgPower,
      avgClock: null,
      clockStdDev: null,
      clockRange: null,
      explanation:
        "GPU is under load but clock data is unavailable from the metrics API. Cannot evaluate PD wedge signature.",
    };
  }

  const avgClock = mean(clocks);
  const clockStdDev = stdDev(clocks);
  const clockRange = Math.max(...clocks) - Math.min(...clocks);

  const clockPinned =
    clockStdDev <= PD_WEDGE_MAX_CLOCK_STDDEV_MHZ &&
    clockRange <= PD_WEDGE_MAX_CLOCK_RANGE_MHZ;

  const wedged =
    avgUtil > PD_WEDGE_MIN_UTIL &&
    avgPower < PD_WEDGE_MAX_POWER_W &&
    clockPinned;

  if (wedged) {
    return {
      status: "wedged",
      sampleCount,
      loadSampleCount: loadSamples.length,
      avgUtil,
      avgPower,
      avgClock,
      clockStdDev,
      clockRange,
      explanation:
        `PD wedge detected: utilization reports ${avgUtil.toFixed(0)}% load but power is stuck at ${avgPower.toFixed(1)}W and clock pinned at ~${avgClock.toFixed(0)} MHz (σ=${clockStdDev.toFixed(1)}). This util/power/clock mismatch indicates a defective power distribution unit — GPU appears busy but is starved of power.`,
    };
  }

  const healthyUnderLoad =
    avgPower >= PD_WEDGE_HEALTHY_MIN_POWER_W ||
    clockStdDev > PD_WEDGE_MAX_CLOCK_STDDEV_MHZ;

  return {
    status: "healthy",
    sampleCount,
    loadSampleCount: loadSamples.length,
    avgUtil,
    avgPower,
    avgClock,
    clockStdDev,
    clockRange,
    explanation: healthyUnderLoad
      ? `PD path healthy under load: ${avgUtil.toFixed(0)}% util, ${avgPower.toFixed(1)}W power, clock ~${avgClock.toFixed(0)} MHz with normal variance (σ=${clockStdDev.toFixed(1)}).`
      : `Under load but metrics inconclusive: ${avgUtil.toFixed(0)}% util, ${avgPower.toFixed(1)}W, clock ~${avgClock.toFixed(0)} MHz. Continue monitoring.`,
  };
}
