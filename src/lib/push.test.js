import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPushSupportInfo } from './push'

describe('getPushSupportInfo', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
    Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true })
    vi.stubGlobal('Notification', class {})
    Object.defineProperty(window, 'PushManager', { value: class {}, configurable: true })
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14) Chrome/120',
      configurable: true,
    })
    Object.defineProperty(navigator, 'platform', { value: 'Linux armv8l', configurable: true })
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true })
    Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
    window.matchMedia = vi.fn(() => ({ matches: false }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('Android Chrome z Push API → supported', () => {
    expect(getPushSupportInfo().supported).toBe(true)
  })

  it('bez HTTPS → insecure', () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true })
    const info = getPushSupportInfo()
    expect(info.supported).toBe(false)
    expect(info.reason).toBe('insecure')
  })

  it('iPhone w Safari (nie PWA) → ios-install', () => {
    Reflect.deleteProperty(window, 'PushManager')
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    })
    const info = getPushSupportInfo()
    expect(info.supported).toBe(false)
    expect(info.reason).toBe('ios-install')
  })
})
