import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  MantineProvider,
  createTheme,
  type MantineColorsTuple,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "./index.css";
import App from "./App";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("React ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: "#ff6b6b", fontFamily: "monospace" }}>
          <h2>SparkMon crashed</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const neonGreen: MantineColorsTuple = [
  "#e6ffe6",
  "#b3ffb3",
  "#80ff80",
  "#4dff4d",
  "#1aff1a",
  "#00e600",
  "#00cc00",
  "#00b300",
  "#009900",
  "#008000",
];

const theme = createTheme({
  primaryColor: "blue",
  colors: {
    neonGreen,
  },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace:
    '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <App />
      </MantineProvider>
    </ErrorBoundary>
  </StrictMode>
);
