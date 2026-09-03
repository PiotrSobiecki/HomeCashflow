import { describe, expect, it } from 'vitest'
import { isBankSyncHour } from './worker.js'

describe('isBankSyncHour', () => {
  it('latem (UTC+2) trafia w 8, 14, 20 czasu polskiego', () => {
    expect(isBankSyncHour('2026-07-01T06:00:00Z')).toBe(true)
    expect(isBankSyncHour('2026-07-01T12:00:00Z')).toBe(true)
    expect(isBankSyncHour('2026-07-01T18:00:00Z')).toBe(true)
    expect(isBankSyncHour('2026-07-01T00:00:00Z')).toBe(false)
    expect(isBankSyncHour('2026-07-01T07:00:00Z')).toBe(false)
  })

  it('zimą (UTC+1) trafia w 8, 14, 20 czasu polskiego', () => {
    expect(isBankSyncHour('2026-01-15T07:00:00Z')).toBe(true)
    expect(isBankSyncHour('2026-01-15T13:00:00Z')).toBe(true)
    expect(isBankSyncHour('2026-01-15T19:00:00Z')).toBe(true)
    expect(isBankSyncHour('2026-01-15T06:00:00Z')).toBe(false)
    expect(isBankSyncHour('2026-01-15T01:00:00Z')).toBe(false)
  })
})
