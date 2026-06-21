// TypeScript type definitions for NVIDIA GPU Metrics API
// Source: http://<host>:8024/types

export interface GPUProcess {
  pid: number;
  name: string;
  memory_mb: number;
  memory_percent: number;
  username: string;
  cpu_percent: number;
}

export interface GPUMemory {
  total_mb: number;
  used_mb: number;
  free_mb: number;
  utilization_percent: number;
  bandwidth_utilization_percent: number;
}

export interface GPUUtilization {
  gpu_percent: number;
  memory_percent: number;
  sm_percent: number;
}

export interface GPUPower {
  usage_watts: number;
  limit_watts: number;
  budget_watts: number;
  efficiency_percent: number;
}

export interface GPURateOfChange {
  temperature_delta_per_sec: number;
  power_delta_per_sec: number;
}

export interface GPUPeakValues {
  gpu_utilization_percent: number;
  power_watts: number;
  temperature_celsius: number;
}

export interface GPUClocks {
  graphics_mhz: number;
  memory_mhz: number;
  max_graphics_mhz: number;
  max_memory_mhz: number;
  efficiency_percent: number;
}

export interface GPUPCIe {
  generation: number;
  width: number;
  tx_throughput_mbps: number;
  rx_throughput_mbps: number;
  total_throughput_mbps: number;
  max_bandwidth_mbps: number;
  utilization_percent: number;
}

export interface GPUThrottling {
  reasons: number;
  is_throttled: boolean;
  bottlenecks: string[];
}

export interface GPUDebugInfo {
  gpu_util_threshold: string;
  power_threshold: string;
  memory_util_threshold: string;
  clock_threshold: string;
  temp_threshold: string;
  is_active: boolean;
}

export interface GPU {
  id: number;
  timestamp: string;
  name: string;
  compute_capability: string;
  performance_state: number;
  memory: GPUMemory;
  utilization: GPUUtilization;
  temperature_celsius: number;
  power: GPUPower;
  rate_of_change: GPURateOfChange;
  peak_values: GPUPeakValues;
  clocks: GPUClocks;
  pcie: GPUPCIe;
  throttling: GPUThrottling;
  fan_speed_rpm: number;
  status: "active" | "idle";
  top_processes: GPUProcess[];
  debug_info: GPUDebugInfo;
}

export interface CPUStats {
  cpu_count_physical: number;
  cpu_count_logical: number;
  cpu_percent: number;
  cpu_per_core_percent: number[];
  cpu_freq_current_mhz: number;
  cpu_freq_min_mhz: number;
  cpu_freq_max_mhz: number;
}

export interface MemoryStats {
  total_mb: number;
  available_mb: number;
  used_mb: number;
  percent: number;
  cached_mb: number;
  buffers_mb: number;
  top_processes: Array<{
    pid: number;
    name: string;
    memory_mb: number;
    memory_percent: number;
    username: string;
  }>;
}

export interface DiskIO {
  read_bytes_per_sec: number;
  write_bytes_per_sec: number;
  read_ops_per_sec: number;
  write_ops_per_sec: number;
  total_read_bytes: number;
  total_write_bytes: number;
  total_read_ops: number;
  total_write_ops: number;
}

export interface SystemInfo {
  os: string;
  os_release: string;
  os_version: string;
  architecture: string;
  processor: string;
  hostname: string;
  python_version: string;
  platform: string;
  driver_version: string;
  cuda_version: string;
  nvml_version: string;
  cpu: CPUStats;
  memory: MemoryStats;
  disk_used_gb: number;
  disk_available_gb: number;
  disk_io: DiskIO;
  temperature_celsius: number;
}

export interface GPUSummary {
  total_memory_mb: number;
  total_used_memory_mb: number;
  memory_utilization_percent: number;
  average_gpu_utilization_percent: number;
  average_temperature_celsius: number;
  total_power_usage_watts: number;
}

export interface GPUResponse {
  timestamp: string;
  system_info: SystemInfo;
  gpu_count: number;
  gpus: GPU[];
  summary: GPUSummary;
  status: "ok" | "error";
}

export interface MachineConfig {
  id: string;
  name: string;
  url: string;
  model?: string;
}
