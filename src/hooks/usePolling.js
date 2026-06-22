import { useEffect, useRef } from "react";

/**
 * Interwał bez resetu przy rerenderze rodzica (callback i isBlocked w ref).
 */
export function usePolling({ intervalMs, enabled, onTick, isBlocked }) {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;
  const isBlockedRef = useRef(isBlocked);
  isBlockedRef.current = isBlocked;
  const wasHiddenRef = useRef(
    typeof document !== "undefined" ? !!document.hidden : false,
  );

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const blocked = isBlockedRef.current;
      if (typeof blocked === "function" && blocked()) return;
      onTickRef.current();
    };

    const id = setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      const hidden = !!document.hidden;
      if (wasHiddenRef.current && !hidden) tick();
      wasHiddenRef.current = hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, enabled]);
}
