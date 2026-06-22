import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAlignedPolling } from "./useAlignedPolling";

const CRON_MARKS = [0, 30];

describe("useAlignedPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T10:10:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("pierwszy tick na zsynchronizowanym znaczniku UTC", () => {
    const onTick = vi.fn();
    renderHook(() =>
      useAlignedPolling({
        marks: CRON_MARKS,
        settleMs: 0,
        enabled: true,
        onTick,
      }),
    );

    vi.advanceTimersByTime(19 * 60 * 1000);
    expect(onTick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60 * 1000);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it("kolejne ticki co 30 min", () => {
    const onTick = vi.fn();
    renderHook(() =>
      useAlignedPolling({
        marks: CRON_MARKS,
        settleMs: 0,
        enabled: true,
        onTick,
      }),
    );

    vi.advanceTimersByTime(20 * 60 * 1000);
    vi.advanceTimersByTime(30 * 60 * 1000);
    vi.advanceTimersByTime(30 * 60 * 1000);
    expect(onTick).toHaveBeenCalledTimes(3);
  });
});
