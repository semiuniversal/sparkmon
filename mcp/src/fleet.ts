import { FETCH_TIMEOUT_MS, getMachineById, getMachines } from "./config.js";
import {
  analyzePdWedge,
  extractPdWedgeSample,
  PD_WEDGE_SAMPLE_INTERVAL_MS,
  PD_WEDGE_SAMPLE_SIZE,
  type PdWedgeAnalysis,
  type PdWedgeSample,
} from "./pdWedge.js";
import { analyzeThrottle } from "./throttle.js";
import type {
  GPUResponse,
  MachineConfig,
  MachineMetricsResult,
} from "./types.js";

async function fetchGpuMetrics(
  machine: MachineConfig
): Promise<MachineMetricsResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${machine.url}/gpu`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return {
        machine,
        reachable: false,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    const metrics = (await response.json()) as GPUResponse;
    if (metrics.status === "error" || !metrics.gpus || !metrics.system_info) {
      return {
        machine,
        reachable: true,
        error: metrics.error ?? "GPU metrics API returned an error payload",
        metrics,
      };
    }

    return { machine, reachable: true, metrics };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? `Timed out after ${FETCH_TIMEOUT_MS}ms`
          : err.message
        : String(err);
    return { machine, reachable: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAllMachineMetrics(): Promise<MachineMetricsResult[]> {
  const machines = getMachines();
  return Promise.all(machines.map(fetchGpuMetrics));
}

export async function fetchMachineMetrics(
  machineId: string
): Promise<MachineMetricsResult> {
  const machine = getMachineById(machineId);
  if (!machine) {
    throw new Error(
      `Unknown machine_id "${machineId}". Use list_fleet_machines to see valid IDs.`
    );
  }
  return fetchGpuMetrics(machine);
}

export function summarizeMachine(result: MachineMetricsResult) {
  const gpu = result.metrics?.gpus?.[0];
  const sys = result.metrics?.system_info;

  const throttle =
    gpu != null
      ? analyzeThrottle(
          gpu.throttling,
          gpu.utilization.gpu_percent,
          gpu.clocks.graphics_mhz
        )
      : null;

  return {
    machine_id: result.machine.id,
    name: result.machine.name,
    model: result.machine.model ?? null,
    metrics_url: result.machine.url,
    reachable: result.reachable,
    error: result.error ?? null,
    timestamp: result.metrics?.timestamp ?? null,
    hostname: sys?.hostname ?? null,
    gpu_name: gpu?.name ?? null,
    gpu_status: gpu?.status ?? null,
    gpu_util_percent: gpu?.utilization.gpu_percent ?? null,
    gpu_memory_used_mb: gpu?.memory.used_mb ?? null,
    gpu_temperature_c: gpu?.temperature_celsius ?? null,
    gpu_power_watts: gpu?.power.usage_watts ?? null,
    graphics_clock_mhz: gpu?.clocks.graphics_mhz ?? null,
    host_cpu_percent: sys?.cpu.cpu_percent ?? null,
    host_memory_percent: sys?.memory.percent ?? null,
    host_temperature_c: sys?.temperature_celsius ?? null,
    throttle,
  };
}

export function summarizeFleet(results: MachineMetricsResult[]) {
  const machines = results.map(summarizeMachine);
  const reachable = machines.filter((m) => m.reachable && !m.error);
  const throttled = machines.filter((m) => m.throttle?.is_real_throttle);
  const unreachable = machines.filter((m) => !m.reachable || m.error);

  return {
    fleet_size: machines.length,
    reachable_count: reachable.length,
    real_throttle_count: throttled.length,
    problem_count: unreachable.length + throttled.length,
    machines,
    alerts: [
      ...unreachable.map((m) => ({
        severity: "error" as const,
        machine_id: m.machine_id,
        message: m.error ?? "Unreachable",
      })),
      ...throttled.map((m) => ({
        severity: "critical" as const,
        machine_id: m.machine_id,
        message: `Real throttle under load: ${m.throttle?.bottlenecks_human.join(", ") || "unknown cause"}`,
      })),
    ],
  };
}

export function listGpuProcesses(results: MachineMetricsResult[]) {
  return results.flatMap((result) => {
    const gpu = result.metrics?.gpus?.[0];
    if (!gpu) return [];

    return gpu.top_processes.map((process) => ({
      machine_id: result.machine.id,
      machine_name: result.machine.name,
      model: result.machine.model ?? null,
      pid: process.pid,
      name: process.name,
      memory_mb: process.memory_mb,
      memory_percent: process.memory_percent,
      cpu_percent: process.cpu_percent,
      username: process.username,
    }));
  });
}

export function utilizationComparison(results: MachineMetricsResult[]) {
  return results.map((result) => {
    const gpu = result.metrics?.gpus?.[0];
    const summary = result.metrics?.summary;
    return {
      machine_id: result.machine.id,
      name: result.machine.name,
      model: result.machine.model ?? null,
      reachable: result.reachable,
      error: result.error ?? null,
      gpu_util_percent:
        gpu?.utilization.gpu_percent ??
        summary?.average_gpu_utilization_percent ??
        null,
      gpu_memory_used_mb: gpu?.memory.used_mb ?? summary?.total_used_memory_mb ?? null,
      gpu_temperature_c:
        gpu?.temperature_celsius ?? summary?.average_temperature_celsius ?? null,
      gpu_power_watts:
        gpu?.power.usage_watts ?? summary?.total_power_usage_watts ?? null,
      graphics_clock_mhz: gpu?.clocks.graphics_mhz ?? null,
      inference_active: gpu?.status === "active",
    };
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runMachinePdWedgeTest(machineId: string): Promise<{
  machine_id: string;
  name: string;
  samples: PdWedgeSample[];
  analysis: PdWedgeAnalysis;
  error?: string;
}> {
  const machine = getMachineById(machineId);
  if (!machine) {
    throw new Error(
      `Unknown machine_id "${machineId}". Use list_fleet_machines to see valid IDs.`
    );
  }

  const samples: PdWedgeSample[] = [];

  for (let i = 0; i < PD_WEDGE_SAMPLE_SIZE; i++) {
    const result = await fetchGpuMetrics(machine);
    if (!result.reachable || result.error || !result.metrics?.gpus?.[0]) {
      return {
        machine_id: machine.id,
        name: machine.name,
        samples,
        analysis: analyzePdWedge(samples),
        error: result.error ?? "Failed to fetch GPU metrics during PD wedge test",
      };
    }

    samples.push(extractPdWedgeSample(result.metrics.gpus[0]));

    if (i < PD_WEDGE_SAMPLE_SIZE - 1) {
      await sleep(PD_WEDGE_SAMPLE_INTERVAL_MS);
    }
  }

  return {
    machine_id: machine.id,
    name: machine.name,
    samples,
    analysis: analyzePdWedge(samples),
  };
}
