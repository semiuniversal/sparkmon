import { useState } from "react";
import type { GPUResponse, MachineConfig } from "../types";
import type { ConnectionState } from "../hooks/useGpuStream";
import { Gauge } from "./Gauge";
import { ThrottleAlert } from "./ThrottleAlert";
import { StatRow } from "./StatRow";
import { ProcessTable } from "./ProcessTable";
import { DetailDrawer } from "./DetailDrawer";

interface MachinePanelProps {
  config: MachineConfig;
  data: GPUResponse | null;
  connectionState: ConnectionState;
}

function formatBytes(bytesPerSec: number): string {
  if (bytesPerSec >= 1048576) return `${(bytesPerSec / 1048576).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${Math.round(bytesPerSec)} B/s`;
}

export function MachinePanel({ config, data, connectionState }: MachinePanelProps) {
  const [showDetail, setShowDetail] = useState(false);

  if (connectionState === "connecting" && !data) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2>{config.name}</h2>
          <span className="conn-badge connecting">Connecting...</span>
        </div>
        <div className="panel-placeholder">Waiting for data stream...</div>
      </div>
    );
  }

  if (connectionState === "disconnected" && !data) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2>{config.name}</h2>
          <span className="conn-badge disconnected">Disconnected</span>
        </div>
        <div className="panel-placeholder">
          Cannot reach {config.url}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const gpu = data.gpus[0];
  const sys = data.system_info;
  const hasGpu = !!gpu;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>{config.name}</h2>
          <span className="panel-subtitle">
            {hasGpu ? gpu.name : "No GPU"} &middot; {sys.hostname}
            {config.model && <> &middot; {config.model}</>}
          </span>
        </div>
        <div className="panel-header-right">
          {hasGpu && (
            <span className={`status-badge ${gpu.status}`}>
              {gpu.status}
            </span>
          )}
          {connectionState === "disconnected" && (
            <span className="conn-badge disconnected">Stale</span>
          )}
          <button className="detail-btn" onClick={() => setShowDetail(true)}>
            All Data
          </button>
        </div>
      </div>

      {hasGpu && (
        <>
          {/* Throttle alert — most prominent */}
          <ThrottleAlert throttling={gpu.throttling} />

          {/* Primary gauges */}
          <div className="gauge-row">
            <Gauge
              value={gpu.temperature_celsius}
              max={100}
              label="GPU Temp"
              unit="°C"
              thresholds={{ warn: 60, crit: 80 }}
            />
            <Gauge
              value={gpu.power.usage_watts}
              max={gpu.power.limit_watts > 0 ? gpu.power.limit_watts / 1000 : 100}
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
          </div>

          {/* Secondary GPU stats */}
          <div className="stats-section">
            <h3>GPU</h3>
            <StatRow
              label="VRAM Used"
              value={
                gpu.memory.used_mb >= 1024
                  ? `${(gpu.memory.used_mb / 1024).toFixed(1)}`
                  : `${Math.round(gpu.memory.used_mb)}`
              }
              unit={gpu.memory.used_mb >= 1024 ? "GB" : "MB"}
            />
            {gpu.clocks.max_graphics_mhz > 0 && (
              <StatRow
                label="Clocks"
                value={`${gpu.clocks.graphics_mhz} / ${gpu.clocks.max_graphics_mhz}`}
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
            <StatRow
              label="Perf State"
              value={`P${gpu.performance_state}`}
            />
            {gpu.power.budget_watts > 0 && (
              <StatRow
                label="Power Budget"
                value={gpu.power.budget_watts.toFixed(1)}
                unit="W"
              />
            )}
          </div>

          {/* GPU processes */}
          <ProcessTable processes={gpu.top_processes} title="GPU Processes" />
        </>
      )}

      {/* System stats */}
      <div className="stats-section">
        <h3>System</h3>
        <StatRow
          label="CPU"
          value={sys.cpu.cpu_percent}
          unit="%"
          bar={{ value: sys.cpu.cpu_percent, max: 100 }}
        />
        {sys.cpu.cpu_per_core_percent.length > 0 && (
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
        <StatRow
          label="Host Temp"
          value={sys.temperature_celsius}
          unit="°C"
        />
      </div>

      {/* System process table */}
      <ProcessTable
        processes={sys.memory.top_processes.map((p) => ({
          ...p,
          cpu_percent: 0,
        }))}
        title="Top System Processes"
      />

      {showDetail && (
        <DetailDrawer
          data={data}
          machineName={config.name}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  );
}
