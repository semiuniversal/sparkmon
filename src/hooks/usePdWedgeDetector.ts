import { useEffect, useRef, useState } from "react";
import type { GPU } from "../types";
import {
  analyzePdWedge,
  extractPdWedgeSample,
  PD_WEDGE_SAMPLE_SIZE,
  type PdWedgeAnalysis,
  type PdWedgeSample,
} from "../lib/pdWedge";

const INITIAL_ANALYSIS: PdWedgeAnalysis = {
  status: "collecting",
  sampleCount: 0,
  loadSampleCount: 0,
  avgUtil: null,
  avgPower: null,
  avgClock: null,
  clockStdDev: null,
  clockRange: null,
  explanation: "Collecting samples…",
};

export function usePdWedgeDetector(gpu: GPU | null | undefined): PdWedgeAnalysis {
  const samplesRef = useRef<PdWedgeSample[]>([]);
  const [analysis, setAnalysis] = useState<PdWedgeAnalysis>(INITIAL_ANALYSIS);

  useEffect(() => {
    if (!gpu) {
      samplesRef.current = [];
      setAnalysis(INITIAL_ANALYSIS);
      return;
    }

    const sample = extractPdWedgeSample(gpu);
    const prev = samplesRef.current;
    const next = [...prev, sample].slice(-PD_WEDGE_SAMPLE_SIZE);
    samplesRef.current = next;
    setAnalysis(analyzePdWedge(next));
  }, [gpu?.timestamp, gpu?.utilization.gpu_percent, gpu?.power.usage_watts, gpu?.clocks.graphics_mhz]);

  return analysis;
}
