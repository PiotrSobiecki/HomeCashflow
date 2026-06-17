import { describe, it, expect } from 'vitest'
import {
  buildAuthorizeUrl,
  parseTokenResponse,
  isAccessTokenExpired,
  exchangeCodeForTokens,
  refreshAccessToken,
  ensureFreshAccessToken,
} from './oauth.js'

describe('buildAuthorizeUrl', () => {
  it('builds the SmartThings authorize URL with required params', () => {
    const url = new URL(
      buildAuthorizeUrl({
        clientId: 'cid-123',
        redirectUri: 'https://api.homecashflow.org/api/smartthings/callback',
        scopes: ['r:locations:*', 'r:devices:*', 'x:devices:*'],
        state: 'st_abc',
      }),
    )
    expect(url.origin + url.pathname).toBe('https://api.smartthings.com/oauth/authorize')
    expect(url.searchParams.get('client_id')).toBe('cid-123')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://api.homecashflow.org/api/smartthings/callback',
    )
    expect(url.searchParams.get('scope')).toBe('r:locations:* r:devices:* x:devices:*')
    expect(url.searchParams.get('state')).toBe('st_abc')
  })
})

describe('parseTokenResponse', () => {
  it('extracts tokens and computes expiresAt from expires_in relative to now', () => {
    const now = 1_700_000_000_000
    const parsed = parseTokenResponse(
      {
        access_token: 'acc-1',
        refresh_token: 'ref-1',
        token_type: 'bearer',
        expires_in: 86400,
        scope: 'r:devices:* x:devices:*',
      },
      now,
    )
    expect(parsed.accessToken).toBe('acc-1')
    expect(parsed.refreshToken).toBe('ref-1')
    expect(parsed.scope).toBe('r:devices:* x:devices:*')
    expect(parsed.expiresAt).toBe(now + 86400 * 1000)
  })

  it('throws an error exposing the OAuth error code when the response is an error', () => {
    expect(() =>
      parseTokenResponse({ error: 'invalid_grant', error_description: 'expired' }, 1700000000000),
    ).toThrow(/invalid_grant/)
    try {
      parseTokenResponse({ error: 'invalid_grant' }, 1700000000000)
    } catch (err) {
      expect(err.code).toBe('invalid_grant')
    }
  })
})

describe('isAccessTokenExpired', () => {
  const expiresAt = 1_700_000_000_000

  it('is false well before expiry', () => {
    expect(isAccessTokenExpired(expiresAt, expiresAt - 10 * 60 * 1000)).toBe(false)
  })

  it('is true at/after expiry', () => {
    expect(isAccessTokenExpired(expiresAt, expiresAt)).toBe(true)
    expect(isAccessTokenExpired(expiresAt, expiresAt + 1000)).toBe(true)
  })

  it('treats the skew window before expiry as expired (refresh proactively)', () => {
    // domyślny skew 60s: 30s przed wygaśnięciem już odświeżamy
    expect(isAccessTokenExpired(expiresAt, expiresAt - 30 * 1000)).toBe(true)
    // 90s przed wygaśnięciem — jeszcze nie
    expect(isAccessTokenExpired(expiresAt, expiresAt - 90 * 1000)).toBe(false)
  })
})

describe('exchangeCodeForTokens', () => {
  it('POSTs the authorization_code grant with Basic auth and returns parsed tokens', async () => {
    let captured
    const fetchFn = async (url, init) => {
      captured = { url, init }
      return {
        ok: true,
        json: async () => ({ access_token: 'a', refresh_token: 'r', expires_in: 86400, scope: 's' }),
      }
    }
    const tokens = await exchangeCodeForTokens(
      {
        code: 'the-code',
        clientId: 'cid',
        clientSecret: 'secret',
        redirectUri: 'https://api.homecashflow.org/api/smartthings/callback',
      },
      { fetchFn, nowMs: 1_700_000_000_000 },
    )

    expect(captured.url).toBe('https://api.smartthings.com/oauth/token')
    expect(captured.init.method).toBe('POST')
    expect(captured.init.headers.Authorization).toBe('Basic ' + btoa('cid:secret'))
    const body = new URLSearchParams(captured.init.body)
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code')).toBe('the-code')
    expect(body.get('redirect_uri')).toBe('https://api.homecashflow.org/api/smartthings/callback')

    expect(tokens.accessToken).toBe('a')
    expect(tokens.expiresAt).toBe(1_700_000_000_000 + 86400 * 1000)
  })

  it('propagates invalid_grant from an error response', async () => {
    const fetchFn = async () => ({ ok: false, json: async () => ({ error: 'invalid_grant' }) })
    await expect(
      exchangeCodeForTokens(
        { code: 'x', clientId: 'c', clientSecret: 's', redirectUri: 'u' },
        { fetchFn },
      ),
    ).rejects.toMatchObject({ code: 'invalid_grant' })
  })
})

describe('refreshAccessToken', () => {
  it('POSTs the refresh_token grant and returns new tokens', async () => {
    let captured
    const fetchFn = async (url, init) => {
      captured = { url, init }
      return { ok: true, json: async () => ({ access_token: 'a2', refresh_token: 'r2', expires_in: 86400 }) }
    }
    const tokens = await refreshAccessToken(
      { refreshToken: 'r1', clientId: 'cid', clientSecret: 'secret' },
      { fetchFn, nowMs: 1_700_000_000_000 },
    )
    const body = new URLSearchParams(captured.init.body)
    expect(body.get('grant_type')).toBe('refresh_token')
    expect(body.get('refresh_token')).toBe('r1')
    expect(tokens.accessToken).toBe('a2')
    expect(tokens.refreshToken).toBe('r2')
  })

  it('keeps the previous refresh token when the response omits a new one (no rotation)', async () => {
    const fetchFn = async () => ({ ok: true, json: async () => ({ access_token: 'a2', expires_in: 86400 }) })
    const tokens = await refreshAccessToken(
      { refreshToken: 'r1', clientId: 'cid', clientSecret: 'secret' },
      { fetchFn, nowMs: 1_700_000_000_000 },
    )
    expect(tokens.refreshToken).toBe('r1')
  })
})

describe('ensureFreshAccessToken', () => {
  const expiresAt = 1_700_000_000_000
  const credential = { accessToken: 'old-acc', refreshToken: 'old-ref', expiresAt }

  it('returns the current token without refreshing when it is still fresh', async () => {
    let refreshed = false
    const token = await ensureFreshAccessToken(
      { credential, clientId: 'c', clientSecret: 's' },
      {
        nowMs: expiresAt - 10 * 60 * 1000,
        refreshFn: async () => { refreshed = true; return {} },
        onRefreshed: async () => {},
      },
    )
    expect(token).toBe('old-acc')
    expect(refreshed).toBe(false)
  })

  it('refreshes when expired, persists new tokens, and returns the new access token', async () => {
    let persisted
    const newTokens = { accessToken: 'new-acc', refreshToken: 'new-ref', expiresAt: expiresAt + 86400000 }
    const token = await ensureFreshAccessToken(
      { credential, clientId: 'c', clientSecret: 's' },
      {
        nowMs: expiresAt + 1000,
        refreshFn: async ({ refreshToken }) => {
          expect(refreshToken).toBe('old-ref')
          return newTokens
        },
        onRefreshed: async (t) => { persisted = t },
      },
    )
    expect(token).toBe('new-acc')
    expect(persisted).toEqual(newTokens)
  })
})
