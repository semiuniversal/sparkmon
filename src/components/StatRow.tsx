import { Group, Text, Progress } from "@mantine/core";

interface StatRowProps {
  label: string;
  value: string | number;
  unit?: string;
  bar?: { value: number; max: number };
}

export function StatRow({ label, value, unit, bar }: StatRowProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm" c="dimmed" w={90} style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Text size="sm" ff="monospace" fw={500}>
        {value}
        {unit && (
          <Text span c="dimmed" fw={400}>
            {" "}
            {unit}
          </Text>
        )}
      </Text>
      {bar && bar.max > 0 && (
        <Progress
          value={Math.min((bar.value / bar.max) * 100, 100)}
          size="sm"
          radius="xl"
          style={{ flex: 1, minWidth: 40 }}
        />
      )}
    </Group>
  );
}
