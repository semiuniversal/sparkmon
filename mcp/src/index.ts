import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { createSparkmonMcpServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 8096);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = express();
app.use(express.json());

const transports: Record<string, StreamableHTTPServerTransport> = {};

function createServer(): McpServer {
  return createSparkmonMcpServer();
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sparkmon-mcp",
    transport: "streamable-http",
    endpoint: "/mcp",
  });
});

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport | undefined;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports[id] = transport!;
      },
    });

    transport.onclose = () => {
      if (transport?.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const server = createServer();
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message:
          "Bad Request: provide mcp-session-id for an existing session, or send an initialize request to start one",
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing mcp-session-id header");
    return;
  }

  await transports[sessionId].handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing mcp-session-id header");
    return;
  }

  try {
    await transports[sessionId].handleRequest(req, res);
  } finally {
    delete transports[sessionId];
  }
});

app.listen(PORT, HOST, () => {
  console.log(`SparkMon MCP server listening on http://${HOST}:${PORT}`);
  console.log(`  Health:  http://${HOST}:${PORT}/health`);
  console.log(`  MCP:     http://${HOST}:${PORT}/mcp`);
});
