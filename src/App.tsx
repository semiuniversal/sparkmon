import {
  AppShell,
  Container,
  Group,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import { MachinePanel } from "./components/MachinePanel";
import { useGpuStream } from "./hooks/useGpuStream";
import { MACHINES, STREAM_INTERVAL } from "./config";

function MachinePanelWrapper({
  config,
}: {
  config: (typeof MACHINES)[number];
}) {
  const { data, connectionState } = useGpuStream(
    `${config.url}/gpu/stream?interval=${STREAM_INTERVAL}`
  );
  return (
    <MachinePanel
      config={config}
      data={data}
      connectionState={connectionState}
    />
  );
}

export default function App() {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" gap="sm">
            <Title order={3} c="blue">
              SparkMon
            </Title>
            <Text c="dimmed" size="sm">
              GPU Fleet Monitor
            </Text>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {MACHINES.map((m) => (
              <MachinePanelWrapper key={m.id} config={m} />
            ))}
          </SimpleGrid>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
