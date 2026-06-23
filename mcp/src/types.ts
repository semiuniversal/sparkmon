export interface MachineConfig {
  id: string;
  name: string;
  url: string;
  model?: string;
}

export interface GPUProcess {
  pid: number;
  name: string;
  memory_mb: number;
  memory_percent: number;
  username: string;
  cpu_percent: number;
}

export interface GPUThrottling {
  reasons: number;
  is_throttled: boolean;
  bottlenecks: string[];
}

export interface GPU {
  id: number;
  timestamp: string;
  name: string;
  compute_capability: string;
  performance_state: number;
  utilization: {
    gpu_percent: number;
    memory_percent: number;
    sm_percent: number;
  };
  temperature_celsius: number;
  power: {
    usage_watts: number;
    limit_watts: number;
    budget_watts: number;
  };
  memory: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    utilization_percent: number;
  };
  clocks: {
    graphics_mhz: number;
    memory_mhz: number;
    max_graphics_mhz: number;
    max_memory_mhz: number;
  };
  throttling: GPUThrottling;
  fan_speed_rpm: number;
  status: "active" | "idle";
  top_processes: GPUProcess[];
}

export interface GPUResponse {
  timestamp: string;
  system_info: {
    hostname: string;
    cpu: {
      cpu_percent: number;
      cpu_per_core_percent: number[];
    };
    memory: {
      total_mb: number;
      used_mb: number;
      percent: number;
      top_processes: Array<{
        pid: number;
        name: string;
        memory_mb: number;
        memory_percent: number;
        username: string;
      }>;
    };
    disk_used_gb: number;
    disk_available_gb: number;
    temperature_celsius: number;
    driver_version: string;
    cuda_version: string;
  };
  gpu_count: number;
  gpus: GPU[];
  summary: {
    average_gpu_utilization_percent: number;
    average_temperature_celsius: number;
    total_power_usage_watts: number;
    total_used_memory_mb: number;
  };
  status: "ok" | "error";
  error?: string;
}

export interface MachineMetricsResult {
  machine: MachineConfig;
  reachable: boolean;
  error?: string;
  metrics?: GPUResponse;
}
