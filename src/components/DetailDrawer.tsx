import { Drawer, ScrollArea, Code } from "@mantine/core";
import type { GPUResponse } from "../types";

interface DetailDrawerProps {
  data: GPUResponse;
  opened: boolean;
  onClose: () => void;
  machineName: string;
}

function renderValue(val: unknown, depth = 0): React.ReactNode {
  if (val === null || val === undefined)
    return <span className="json-null">null</span>;
  if (typeof val === "boolean")
    return (
      <span className={`json-bool ${val ? "true" : "false"}`}>
        {String(val)}
      </span>
    );
  if (typeof val === "number")
    return <span className="json-num">{val}</span>;
  if (typeof val === "string")
    return <span className="json-str">"{val}"</span>;

  if (Array.isArray(val)) {
    if (val.length === 0)
      return <span className="json-null">[]</span>;
    return (
      <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        {val.map((item, i) => (
          <div key={i}>
            <span className="json-idx">[{i}]</span>{" "}
            {renderValue(item, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>);
    return (
      <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        {entries.map(([k, v]) => (
          <div key={k} className="json-entry">
            <span className="json-key">{k}:</span>{" "}
            {renderValue(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(val)}</span>;
}

export function DetailDrawer({
  data,
  opened,
  onClose,
  machineName,
}: DetailDrawerProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={`${machineName} — Full Data`}
      position="right"
      size="lg"
      padding="md"
    >
      <ScrollArea h="calc(100vh - 80px)">
        <Code block p="md" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
          {renderValue(data)}
        </Code>
      </ScrollArea>
    </Drawer>
  );
}
