import { useEffect, useRef } from "react";
import { msUntilNextUtcMinuteMarks, periodMsForMarks } from "../lib/cronAlign";

/**
 * Polling zsynchronizowany z minutami UTC (np. :00/:30 jak cron termostatu).
 * Pierwszy tick na najbliższym znaczniku + settleMs, potem stały okres między marks.
 * isBlocked / followUpMs trzymane w ref — rerender rodzica nie resetuje timera.
 */
export function useAlignedPolling({
  marks,
  settleMs = 5000,
  followUpMs = [],
  enabled,
  onTick,
  isBlocked,
}) {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;
  const isBlockedRef = useRef(isBlocked);
  isBlockedRef.current = isBlocked;
  const followUpRef = useRef(followUpMs);
  followUpRef.current = followUpMs;
  const wasHiddenRef = useRef(
    typeof document !== "undefined" ? !!document.hidden : false,
  );
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const followUpTimersRef = useRef([]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const blocked = isBlockedRef.current;
      if (typeof blocked === "function" && blocked()) return;
      onTickRef.current();
    };

    const scheduleFollowUps = () => {
      for (const id of followUpTimersRef.current) clearTimeout(id);
      followUpTimersRef.current = [];
      for (const delay of followUpRef.current) {
        followUpTimersRef.current.push(setTimeout(() => tick(), delay));
      }
    };

    const period = periodMsForMarks(marks);

    const clear = () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
      for (const id of followUpTimersRef.current) clearTimeout(id);
      followUpTimersRef.current = [];
      timeoutRef.current = null;
      intervalRef.current = null;
    };

    const arm = () => {
      clear();
      const delay = msUntilNextUtcMinuteMarks(marks, settleMs);
      timeoutRef.current = setTimeout(() => {
        tick();
        scheduleFollowUps();
        intervalRef.current = setInterval(() => {
          tick();
          scheduleFollowUps();
        }, period);
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
  }, [marks, settleMs, enabled]);
}
