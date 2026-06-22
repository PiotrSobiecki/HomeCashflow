import { useEffect, useRef } from "react";
import { msUntilNextUtcMinuteMarks, periodMsForMarks } from "../lib/cronAlign";

/**
 * Polling zsynchronizowany z minutami UTC (np. :00/:30 jak cron termostatu).
 * Pierwszy tick na najbliższym znaczniku + settleMs, potem stały okres między marks.
 */
export function useAlignedPolling({
  marks,
  settleMs = 5000,
  enabled,
  onTick,
  isBlocked,
}) {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;
  const wasHiddenRef = useRef(
    typeof document !== "undefined" ? !!document.hidden : false,
  );
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (typeof isBlocked === "function" && isBlocked()) return;
      onTickRef.current();
    };

    const period = periodMsForMarks(marks);

    const clear = () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
      timeoutRef.current = null;
      intervalRef.current = null;
    };

    const arm = () => {
      clear();
      const delay = msUntilNextUtcMinuteMarks(marks, settleMs);
      timeoutRef.current = setTimeout(() => {
        tick();
        intervalRef.current = setInterval(tick, period);
      }, delay);
    };

    arm();

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      const hidden = !!document.hidden;
      if (wasHiddenRef.current && !hidden) {
        tick();
        arm();
      }
      wasHiddenRef.current = hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [marks, settleMs, enabled, isBlocked]);
}
