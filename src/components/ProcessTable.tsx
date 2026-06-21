import { Table, Text } from "@mantine/core";
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
    <div>
      <Text
        size="xs"
        c="dimmed"
        tt="uppercase"
        fw={600}
        lts="0.8px"
        mb={6}
        style={{ borderBottom: "1px solid var(--mantine-color-dark-4)" }}
        pb={4}
      >
        {title}
      </Text>
      <Table
        horizontalSpacing="xs"
        verticalSpacing={2}
        fz="xs"
        striped
        highlightOnHover
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>PID</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Memory</Table.Th>
            <Table.Th>CPU%</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {processes.map((p) => (
            <Table.Tr key={p.pid}>
              <Table.Td ff="monospace">{p.pid}</Table.Td>
              <Table.Td
                maw={160}
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={p.name}
              >
                {p.name || `pid:${p.pid}`}
              </Table.Td>
              <Table.Td ff="monospace">{formatMb(p.memory_mb)}</Table.Td>
              <Table.Td ff="monospace">{p.cpu_percent.toFixed(1)}%</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
