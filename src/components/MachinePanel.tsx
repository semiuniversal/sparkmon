import { useState } from "react";
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Divider,
  Loader,
  Center,
} from "@mantine/core";
import type { GPUResponse, MachineConfig } from "../types";
import type { ConnectionState } from "../hooks/useGpuStream";
import type { PdWedgeAnalysis } from "../lib/pdWedge";
import { Gauge } from "./Gauge";
import { ThrottleAlert } from "./ThrottleAlert";
import { PdWedgeAlert } from "./PdWedgeAlert";
import { ClockMetric } from "./ClockMetric";
import { StatRow } from "./StatRow";
import { ProcessTable } from "./ProcessTable";
import { DetailDrawer } from "./DetailDrawer";

interface MachinePanelProps {
  config: MachineConfig;
  data: GPUResponse | null;
  connectionState: ConnectionState;
  pdWedgeAnalysis: PdWedgeAnalysis;
  clockHistory: { currentMhz: number | null; history: number[] };
}

function formatBytes(bytesPerSec: number): string {
  if (bytesPerSec >= 1048576) return `${(bytesPerSec / 1048576).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${Math.round(bytesPerSec)} B/s`;
}

export function MachinePanel({
  config,
  data,
  connectionState,
  pdWedgeAnalysis,
  clockHistory,
}: MachinePanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (connectionState === "connecting" && !data) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Text fw={600} size="lg">
            {config.name}
          </Text>
          <Badge color="blue" variant="light">
            Connecting
          </Badge>
        </Group>
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader size="sm" />
            <Text c="dimmed" size="sm">
              Waiting for data stream...
            </Text>
          </Stack>
        </Center>
      </Card>
    );
  }

  if (connectionState === "disconnected" && !data) {
    return (
      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Text fw={600} size="lg">
            {config.name}
          </Text>
          <Badge color="red" variant="light">
            Disconnected
          </Badge>
        </Group>
        <Center py="xl">
          <Text c="dimmed" size="sm">
            Cannot reach {config.url}
          </Text>
        </Center>
      </Card>
    );
  }

  if (!data || !data.gpus || !data.system_info) return null;

  const gpu = data.gpus[0];
  const sys = data.system_info;
  const hasGpu = !!gpu;

  return (
    <Card withBorder padding="lg" radius="md">
      {/* Header */}
      <Group justify="space-between" mb="sm" wrap="nowrap">
        <div>
          <Text fw={600} size="lg">
            {config.name}
          </Text>
          <Text size="xs" c="dimmed">
            {hasGpu ? gpu.name : "No GPU"} &middot; {sys.hostname}
            {config.model && <> &middot; {config.model}</>}
          </Text>
        </div>
        <Group gap="xs">
          {hasGpu && (
            <Badge
              color={gpu.status === "active" ? "neonGreen" : "gray"}
              variant="light"
            >
              {gpu.status}
            </Badge>
          )}
          {connectionState === "disconnected" && (
            <Badge color="red" variant="light">
              Stale
            </Badge>
          )}
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={() => setDrawerOpen(true)}
          >
            All Data
          </Button>
        </Group>
      </Group>

      {hasGpu && (
        <>
          {/* Throttle alert */}
          <ThrottleAlert
            throttling={gpu.throttling}
            gpuUtilPercent={gpu.utilization.gpu_percent}
            graphicsMhz={gpu.clocks.graphics_mhz}
          />

          <PdWedgeAlert analysis={pdWedgeAnalysis} />

          <Divider my="xs" />

          {/* Primary gauges */}
          <Group justify="space-around" py="xs">
            <Gauge
              value={gpu.temperature_celsius}
              max={100}
              label="GPU Temp"
              unit="°C"
              thresholds={{ warn: 60, crit: 80 }}
            />
            <Gauge
              value={gpu.power.usage_watts}
              max={
                gpu.power.limit_watts > 0
                  ? gpu.power.limit_watts / 1000
                  : 100
              }
              label="Power"
              unit="W"
              thresholds={{ warn: 70, crit: 90 }}
            />
            <Gauge
              value={gpu.utilization.gpu_percent}
              max={100}
              label="GPU Util"
              unit="%"
              thresholds={{ warn: 80, crit: 95 }}
            />
          </Group>

          <ClockMetric
            currentMhz={clockHistory.currentMhz}
            history={clockHistory.history}
          />

          <Divider my="xs" />

          {/* Secondary GPU stats */}
          <Stack gap={6}>
            <Text
              size="xs"
              c="dimmed"
              tt="uppercase"
              fw={600}
              lts="0.8px"
              pb={2}
              style={{
                borderBottom: "1px solid var(--mantine-color-dark-4)",
              }}
            >
              GPU
            </Text>
            <StatRow
              label="VRAM Used"
              value={
                gpu.memory.used_mb >= 1024
                  ? `${(gpu.memory.used_mb / 1024).toFixed(1)}`
                  : `${Math.round(gpu.memory.used_mb)}`
              }
              unit={gpu.memory.used_mb >= 1024 ? "GB" : "MB"}
            />
            <StatRow
              label="Graphics"
              value={gpu.clocks.graphics_mhz > 0 ? gpu.clocks.graphics_mhz : "—"}
              unit={gpu.clocks.graphics_mhz > 0 ? "MHz" : undefined}
            />
            {gpu.clocks.max_graphics_mhz > 0 && (
              <StatRow
                label="Clock Max"
                value={gpu.clocks.max_graphics_mhz}
                unit="MHz"
                bar={{
                  value: gpu.clocks.graphics_mhz,
                  max: gpu.clocks.max_graphics_mhz,
                }}
              />
            )}
            {gpu.fan_speed_rpm > 0 && (
              <StatRow label="Fan" value={gpu.fan_speed_rpm} unit="RPM" />
            )}
            <StatRow label="Perf State" value={`P${gpu.performance_state}`} />
            {gpu.power.budget_watts > 0 && (
              <StatRow
                label="Power Budget"
                value={gpu.power.budget_watts.toFixed(1)}
                unit="W"
              />
            )}
          </Stack>

          {/* GPU processes */}
          <ProcessTable processes={gpu.top_processes} title="GPU Processes" />
        </>
      )}

      <Divider my="xs" />

      {/* System stats */}
      <Stack gap={6}>
        <Text
          size="xs"
          c="dimmed"
          tt="uppercase"
          fw={600}
          lts="0.8px"
          pb={2}
          style={{
            borderBottom: "1px solid var(--mantine-color-dark-4)",
          }}
        >
          System
        </Text>
        <StatRow
          label="CPU"
          value={sys.cpu.cpu_percent}
          unit="%"
          bar={{ value: sys.cpu.cpu_percent, max: 100 }}
        />
        {sys.cpu.cpu_per_core_percent?.length > 0 && (
          <div className="core-bars">
            {sys.cpu.cpu_per_core_percent.map((pct, i) => (
              <div
                key={i}
                className="core-bar"
                title={`Core ${i}: ${pct}%`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            ))}
          </div>
        )}
        <StatRow
          label="RAM"
          value={`${Math.round(sys.memory.used_mb / 1024)} / ${Math.round(sys.memory.total_mb / 1024)}`}
          unit="GB"
          bar={{ value: sys.memory.used_mb, max: sys.memory.total_mb }}
        />
        <StatRow
          label="Disk"
          value={`${sys.disk_used_gb.toFixed(0)} / ${(sys.disk_used_gb + sys.disk_available_gb).toFixed(0)}`}
          unit="GB"
        />
        <StatRow
          label="Disk I/O"
          value={`R:${formatBytes(sys.disk_io.read_bytes_per_sec)} W:${formatBytes(sys.disk_io.write_bytes_per_sec)}`}
        />
        <StatRow label="Host Temp" value={sys.temperature_celsius} unit="°C" />
      </Stack>

      {/* System process table */}
      <ProcessTable
        processes={sys.memory.top_processes.map((p) => ({
          ...p,
          cpu_percent: 0,
        }))}
        title="Top System Processes"
      />

      <DetailDrawer
        data={data}
        machineName={config.name}
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </Card>
  );
}
