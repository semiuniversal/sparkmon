import type { GPUResponse } from "../types";

interface DetailDrawerProps {
  data: GPUResponse;
  onClose: () => void;
  machineName: string;
}

function renderValue(val: unknown, depth = 0): React.ReactNode {
  if (val === null || val === undefined) return <span className="json-null">null</span>;
  if (typeof val === "boolean")
    return <span className={`json-bool ${val ? "true" : "false"}`}>{String(val)}</span>;
  if (typeof val === "number") return <span className="json-num">{val}</span>;
  if (typeof val === "string") return <span className="json-str">"{val}"</span>;

  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="json-null">[]</span>;
    return (
      <div className="json-array" style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        {val.map((item, i) => (
          <div key={i} className="json-item">
            <span className="json-idx">[{i}]</span> {renderValue(item, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>);
    return (
      <div className="json-obj" style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        {entries.map(([k, v]) => (
          <div key={k} className="json-entry">
            <span className="json-key">{k}:</span> {renderValue(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(val)}</span>;
}

export function DetailDrawer({ data, onClose, machineName }: DetailDrawerProps) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>{machineName} — Full Data</h3>
          <button className="drawer-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="drawer-body">{renderValue(data)}</div>
      </div>
    </div>
  );
}
