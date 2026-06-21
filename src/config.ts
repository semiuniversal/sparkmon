import type { MachineConfig } from "./types";

export const MACHINES: MachineConfig[] = [
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

export const STREAM_INTERVAL = 1;
