import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  MantineProvider,
  createTheme,
  type MantineColorsTuple,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "./index.css";
import App from "./App";

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
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>
);
