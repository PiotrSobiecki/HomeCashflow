import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  msUntilNextUtcMinuteMarks,
  periodMsForMarks,
} from "./cronAlign";

describe("cronAlign", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("periodMsForMarks dla co 30 min", () => {
    expect(periodMsForMarks([0, 30])).toBe(30 * 60 * 1000);
  });

  it("periodMsForMarks dla co 15 min", () => {
    expect(periodMsForMarks([0, 15, 30, 45])).toBe(15 * 60 * 1000);
  });

  it("liczy czas do :30 UTC gdy jest :10 UTC", () => {
    vi.setSystemTime(new Date("2026-06-22T10:10:00.000Z"));
    expect(msUntilNextUtcMinuteMarks([0, 30], 0)).toBe(20 * 60 * 1000);
  });

  it("liczy czas do :00 UTC następnej godziny gdy jest :45 UTC", () => {
    vi.setSystemTime(new Date("2026-06-22T10:45:00.000Z"));
    expect(msUntilNextUtcMinuteMarks([0, 30], 0)).toBe(15 * 60 * 1000);
  });

  it("uwzględnia settleMs po znaczniku", () => {
    vi.setSystemTime(new Date("2026-06-22T10:30:00.000Z"));
    expect(msUntilNextUtcMinuteMarks([0, 30], 5000)).toBe(5000);
  });
});
