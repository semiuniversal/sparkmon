# SparkMon MCP Server

HTTP MCP server that lets agents monitor the GPU inference fleet. It polls each host's `gpu-metrics-api` (`GET /gpu`) and exposes read-only tools with full descriptions.

Runs on the protected LAN — no authentication is built in. Deploy only on networks you trust.

## Quick start

```bash
cd mcp
npm install
npm run build
npm start
```

Default listen address: `http://0.0.0.0:8096`

- Health check: `GET /health`
- MCP endpoint: `POST/GET/DELETE /mcp` (Streamable HTTP transport)

### Docker

```bash
cd mcp
docker build -t sparkmon-mcp:latest .
docker run -d --name sparkmon-mcp --restart unless-stopped -p 8097:8096 sparkmon-mcp:latest
```

## Cursor configuration

Add to your MCP settings (`.cursor/mcp.json` or Cursor Settings → MCP):

```json
{
  "mcpServers": {
    "sparkmon-fleet": {
      "url": "http://192.168.4.139:8097/mcp"
    }
  }
}
```

Replace the host/port with wherever the MCP container runs on your network.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8096` | HTTP listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `SPARKMON_MACHINES_JSON` | built-in fleet | JSON array of `{ id, name, url, model? }` |
| `SPARKMON_FETCH_TIMEOUT_MS` | `8000` | Per-host metrics fetch timeout |

Example custom fleet:

```bash
export SPARKMON_MACHINES_JSON='[
  {"id":"spark","name":"DGX Spark","url":"http://192.168.4.140:8024","model":"Qwen3.6-35B"},
  {"id":"ascent","name":"ASUS Ascent GX10","url":"http://192.168.4.153:8024","model":"Holo3.1"}
]'
```

## Tools

All tools are read-only and return JSON text.

### `list_fleet_machines`

List every inference host configured in SparkMon. Returns `machine_id`, display name, deployed model, and gpu-metrics-api URLs. **Call this first** to discover valid `machine_id` values.

### `get_fleet_health`

Poll all hosts and return a fleet-wide health snapshot: reachability, GPU utilization, temperature, power, graphics clock, and throttle analysis per machine. Includes an `alerts` array for unreachable hosts and **real** throttle events.

Real throttle detection requires all three:
- `throttling.is_throttled === true`
- GPU utilization > 20%
- Graphics clock < 1400 MHz

Idle NVML power-management flags are filtered out as false positives.

### `get_machine_metrics`

Fetch metrics for one host by `machine_id`.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `machine_id` | yes | e.g. `spark`, `ascent` |
| `include_full_response` | no | `true` returns raw gpu-metrics-api JSON |

### `check_machine_throttle`

Deep throttle analysis for one host. Returns NVML flags, utilization, clock speed, human-readable bottleneck labels, and an explanation distinguishing real throttles from idle false positives. Use when investigating ASUS GX10 PD-controller issues (clocks stuck ~660–747 MHz under load).

| Parameter | Required | Description |
|-----------|----------|-------------|
| `machine_id` | yes | Fleet machine identifier |

### `list_fleet_gpu_processes`

List GPU-attached processes across all reachable hosts (vLLM, inference engines, etc.) with PID, memory, and owning machine.

### `get_fleet_utilization_summary`

Side-by-side comparison of GPU utilization %, VRAM used, temperature, power, graphics clock, and inference-active status across the fleet.

## Data sources

Each machine's `url` points at a [gpu-metrics-api](https://github.com/your-org/gpu-metrics-api) instance:

| Endpoint | Purpose |
|----------|---------|
| `GET {url}/gpu` | Snapshot (used by MCP tools) |
| `GET {url}/gpu/stream` | SSE stream (used by dashboard) |

Default fleet matches [`src/config.ts`](../src/config.ts) in the dashboard.
