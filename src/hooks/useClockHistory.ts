import { useEffect, useRef, useState } from "react";
import type { GPU } from "../types";

const CLOCK_HISTORY_SIZE = 60;

export function useClockHistory(gpu: GPU | null | undefined) {
  const historyRef = useRef<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [currentMhz, setCurrentMhz] = useState<number | null>(null);

  useEffect(() => {
    if (!gpu) {
      historyRef.current = [];
      setHistory([]);
      setCurrentMhz(null);
      return;
    }

    const mhz = gpu.clocks.graphics_mhz;
    const next = [...historyRef.current, mhz].slice(-CLOCK_HISTORY_SIZE);
    historyRef.current = next;
    setHistory(next);
    setCurrentMhz(mhz);
  }, [gpu?.timestamp, gpu?.clocks.graphics_mhz]);

  return { currentMhz, history };
}
