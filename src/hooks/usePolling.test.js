import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePolling } from './usePolling'

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls onTick after intervalMs when enabled', () => {
    const onTick = vi.fn()
    renderHook(() => usePolling({ intervalMs: 30000, enabled: true, onTick }))

    expect(onTick).not.toHaveBeenCalled()
    vi.advanceTimersByTime(30000)
    expect(onTick).toHaveBeenCalledTimes(1)
  })

  it('calls onTick repeatedly at each interval', () => {
    const onTick = vi.fn()
    renderHook(() => usePolling({ intervalMs: 30000, enabled: true, onTick }))

    vi.advanceTimersByTime(30000)
    vi.advanceTimersByTime(30000)
    vi.advanceTimersByTime(30000)
    expect(onTick).toHaveBeenCalledTimes(3)
  })

  it('does not call onTick when enabled is false', () => {
    const onTick = vi.fn()
    renderHook(() => usePolling({ intervalMs: 30000, enabled: false, onTick }))

    vi.advanceTimersByTime(60000)
    expect(onTick).not.toHaveBeenCalled()
  })

  it('does not call onTick when document is hidden', () => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    const onTick = vi.fn()
    renderHook(() => usePolling({ intervalMs: 30000, enabled: true, onTick }))

    vi.advanceTimersByTime(60000)
    expect(onTick).not.toHaveBeenCalled()

    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
  })

  it('calls onTick immediately when document becomes visible after being hidden', () => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    const onTick = vi.fn()
    renderHook(() => usePolling({ intervalMs: 30000, enabled: true, onTick }))

    vi.advanceTimersByTime(30000)
    expect(onTick).not.toHaveBeenCalled()

    // user wraca do karty
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(onTick).toHaveBeenCalledTimes(1)
  })

  it('skips tick when isBlocked returns true; next tick proceeds when unblocked', () => {
    const onTick = vi.fn()
    let blocked = true
    const isBlocked = () => blocked
    renderHook(() => usePolling({ intervalMs: 30000, enabled: true, onTick, isBlocked }))

    vi.advanceTimersByTime(30000)
    expect(onTick).not.toHaveBeenCalled()

    blocked = false
    vi.advanceTimersByTime(30000)
    expect(onTick).toHaveBeenCalledTimes(1)
  })

  it('stops ticking after unmount', () => {
    const onTick = vi.fn()
    const { unmount } = renderHook(() => usePolling({ intervalMs: 30000, enabled: true, onTick }))

    vi.advanceTimersByTime(30000)
    expect(onTick).toHaveBeenCalledTimes(1)

    unmount()
    vi.advanceTimersByTime(60000)
    expect(onTick).toHaveBeenCalledTimes(1)
  })
})
