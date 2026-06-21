import type { GPUProcess } from "../types";

interface ProcessTableProps {
  processes: GPUProcess[];
  title: string;
}

function formatMb(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

export function ProcessTable({ processes, title }: ProcessTableProps) {
  if (processes.length === 0) return null;

  return (
    <div className="process-table">
      <h4>{title}</h4>
      <table>
        <thead>
          <tr>
            <th>PID</th>
            <th>Name</th>
            <th>Memory</th>
            <th>CPU%</th>
          </tr>
        </thead>
        <tbody>
          {processes.map((p) => (
            <tr key={p.pid}>
              <td className="mono">{p.pid}</td>
              <td title={p.name}>{p.name || `pid:${p.pid}`}</td>
              <td className="mono">{formatMb(p.memory_mb)}</td>
              <td className="mono">{p.cpu_percent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
