import type { MachineConfig } from "./types.js";

const DEFAULT_MACHINES: MachineConfig[] = [
  {
    id: "spark",
    name: "DGX Spark",
    url: "http://192.168.4.140:8024",
    model: "Qwen3.6-35B",
  },
  {
    id: "ascent",
    name: "ASUS Ascent GX10",
    url: "http://192.168.4.153:8024",
    model: "Holo3.1",
  },
];

export function getMachines(): MachineConfig[] {
  const raw = process.env.SPARKMON_MACHINES_JSON;
  if (!raw) return DEFAULT_MACHINES;
  try {
    const parsed = JSON.parse(raw) as MachineConfig[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("SPARKMON_MACHINES_JSON must be a non-empty array");
    }
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid SPARKMON_MACHINES_JSON: ${message}`);
  }
}

export function getMachineById(machineId: string): MachineConfig | undefined {
  return getMachines().find((m) => m.id === machineId);
}

export const FETCH_TIMEOUT_MS = Number(process.env.SPARKMON_FETCH_TIMEOUT_MS ?? 8000);
