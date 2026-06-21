import { MachinePanel } from "./components/MachinePanel";
import { useGpuStream } from "./hooks/useGpuStream";
import { MACHINES, STREAM_INTERVAL } from "./config";

function MachinePanelWrapper({ config }: { config: (typeof MACHINES)[number] }) {
  const { data, connectionState } = useGpuStream(
    `${config.url}/gpu/stream?interval=${STREAM_INTERVAL}`
  );
  return (
    <MachinePanel config={config} data={data} connectionState={connectionState} />
  );
}

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>SparkMon</h1>
        <span className="app-subtitle">GPU Fleet Monitor</span>
      </header>
      <div className="panels">
        {MACHINES.map((m) => (
          <MachinePanelWrapper key={m.id} config={m} />
        ))}
      </div>
    </div>
  );
}
