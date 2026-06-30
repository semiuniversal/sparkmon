import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getMachines } from "./config.js";
import {
  fetchAllMachineMetrics,
  fetchMachineMetrics,
  listGpuProcesses,
  runMachinePdWedgeTest,
  summarizeFleet,
  summarizeMachine,
  utilizationComparison,
} from "./fleet.js";
import { analyzeThrottle } from "./throttle.js";

function textResult(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function createSparkmonMcpServer(): McpServer {
  const server = new McpServer({
    name: "sparkmon-fleet",
    version: "1.0.0",
  });

  server.registerTool(
    "list_fleet_machines",
    {
      title: "List Fleet Machines",
      description:
        "List every inference host configured in SparkMon. Returns machine_id, display name, deployed model name, and the base URL of the gpu-metrics-api instance on that host. Call this first to discover valid machine_id values for other tools.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (): Promise<CallToolResult> => {
      const machines = getMachines().map((machine) => ({
        machine_id: machine.id,
        name: machine.name,
        model: machine.model ?? null,
        metrics_api_url: machine.url,
        snapshot_endpoint: `${machine.url}/gpu`,
        stream_endpoint: `${machine.url}/gpu/stream`,
      }));

      return textResult({
        count: machines.length,
        machines,
      });
    }
  );

  server.registerTool(
    "get_fleet_health",
    {
      title: "Get Fleet Health",
      description:
        "Poll all inference hosts and return a fleet-wide health snapshot. For each machine: reachability, hostname, GPU utilization, temperature, power, graphics clock, and throttle analysis. Also returns fleet-level counts and an alerts array for unreachable hosts or real throttle events (NVML flag + utilization > 20% + clock < 1400 MHz). Use this for routine fleet monitoring and alerting.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (): Promise<CallToolResult> => {
      const results = await fetchAllMachineMetrics();
      return textResult(summarizeFleet(results));
    }
  );

  server.registerTool(
    "get_machine_metrics",
    {
      title: "Get Machine Metrics",
      description:
        "Fetch current GPU and system metrics for a single inference host by machine_id. By default returns a concise summary suitable for agents. Set include_full_response=true to return the complete gpu-metrics-api JSON payload (gpus, system_info, summary, processes).",
      inputSchema: z.object({
        machine_id: z
          .string()
          .describe(
            "Fleet machine identifier, e.g. 'spark' or 'ascent'. Use list_fleet_machines for valid values."
          ),
        include_full_response: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "When true, include the raw gpu-metrics-api response instead of only the summary."
          ),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ machine_id, include_full_response }): Promise<CallToolResult> => {
      const result = await fetchMachineMetrics(machine_id);
      if (include_full_response) {
        return textResult(result);
      }
      return textResult(summarizeMachine(result));
    }
  );

  server.registerTool(
    "check_machine_throttle",
    {
      title: "Check Machine Throttle",
      description:
        "Analyze GPU throttling for one inference host. Distinguishes real throttle events from idle false positives. A real throttle requires all three: NVML is_throttled=true, GPU utilization > 20%, and graphics clock < 1400 MHz. Returns NVML flags, clock speed, utilization, human-readable bottleneck labels, and an explanation. Use when investigating suspected ASUS GX10 PD-controller issues (clocks stuck ~660–747 MHz under load).",
      inputSchema: z.object({
        machine_id: z
          .string()
          .describe(
            "Fleet machine identifier. Use list_fleet_machines for valid values."
          ),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ machine_id }): Promise<CallToolResult> => {
      const result = await fetchMachineMetrics(machine_id);
      const gpu = result.metrics?.gpus?.[0];

      if (!result.reachable) {
        return textResult({
          machine_id,
          reachable: false,
          error: result.error,
        });
      }

      if (!gpu) {
        return textResult({
          machine_id,
          reachable: true,
          error: result.error ?? "No GPU data in metrics response",
        });
      }

      return textResult({
        machine_id,
        name: result.machine.name,
        model: result.machine.model ?? null,
        timestamp: result.metrics?.timestamp ?? null,
        throttle: analyzeThrottle(
          gpu.throttling,
          gpu.utilization.gpu_percent,
          gpu.clocks.graphics_mhz
        ),
        gpu_status: gpu.status,
        performance_state: `P${gpu.performance_state}`,
      });
    }
  );

  server.registerTool(
    "list_fleet_gpu_processes",
    {
      title: "List Fleet GPU Processes",
      description:
        "List GPU-attached processes across all reachable inference hosts. Useful for identifying which vLLM or inference workloads are running, their PIDs, memory footprint, and which machine they belong to. Returns an empty list for unreachable hosts.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (): Promise<CallToolResult> => {
      const results = await fetchAllMachineMetrics();
      const processes = listGpuProcesses(results);
      return textResult({
        count: processes.length,
        processes,
      });
    }
  );

  server.registerTool(
    "get_fleet_utilization_summary",
    {
      title: "Get Fleet Utilization Summary",
      description:
        "Compare GPU performance metrics across all inference hosts side by side: utilization %, VRAM used (MB), temperature (°C), power draw (W), graphics clock (MHz), and whether inference is active. Use for capacity planning, load balancing decisions, and spotting underutilized or overheating nodes.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (): Promise<CallToolResult> => {
      const results = await fetchAllMachineMetrics();
      return textResult({
        machines: utilizationComparison(results),
      });
    }
  );

  server.registerTool(
    "check_machine_pd_wedge",
    {
      title: "Check Machine PD Wedge",
      description:
        "Run the definitive PD (power distribution) wedge test on one inference host. Samples GPU metrics 20 times at 0.5s intervals while the GPU should be under inference load. Flags PD wedge when utilization > 90%, power < 20W, and graphics clock variance is near zero — the signature of a defective PD unit where the GPU reports high load but power and clock stay flat and low (~611 MHz). Distinct from NVML throttle flags. Requires an active workload during the ~10s test window.",
      inputSchema: z.object({
        machine_id: z
          .string()
          .describe(
            "Fleet machine identifier. Use list_fleet_machines for valid values."
          ),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ machine_id }): Promise<CallToolResult> => {
      const result = await runMachinePdWedgeTest(machine_id);
      return textResult(result);
    }
  );

  return server;
}
