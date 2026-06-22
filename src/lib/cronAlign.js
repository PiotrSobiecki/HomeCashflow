/** Odstęp między kolejnymi znacznikami (minuty w godzinie), np. [0,30] → 30 min. */
export function periodMsForMarks(marks) {
  const sorted = [...marks].sort((a, b) => a - b);
  if (sorted.length < 2) return 30 * 60 * 1000;
  return (sorted[1] - sorted[0]) * 60 * 1000;
}

/**
 * Ms do następnego znacznika minuty UTC (jak cron w worker.js: getMinutes() % N).
 * settleMs — chwila po znaczniku, żeby cron zdążył zapisać do bazy.
 */
export function msUntilNextUtcMinuteMarks(marks, settleMs = 0) {
  const now = Date.now();
  const sorted = [...marks].sort((a, b) => a - b);
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth();
  const day = d.getUTCDate();
  const h = d.getUTCHours();

  for (let hourOffset = 0; hourOffset <= 1; hourOffset++) {
    for (const minute of sorted) {
      const target = Date.UTC(y, mo, day, h + hourOffset, minute, 0, 0) + settleMs;
      if (target > now) return target - now;
    }
  }
  return periodMsForMarks(sorted);
}
