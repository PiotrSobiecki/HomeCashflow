import { describe, it, expect } from 'vitest'
import {
  decodeFinanceDataKey,
  encryptFinancePayload,
  parseStoredFinanceData,
} from './finance-crypto.js'

const TEST_HEX_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

describe('finance-crypto', () => {
  it('roundtrips JSON', async () => {
    const key = decodeFinanceDataKey(TEST_HEX_KEY)
    expect(key).toBeTruthy()
    const obj = { months: { 0: { incomes: [{ name: 'X', amount: 1 }] } } }
    const enc = await encryptFinancePayload(JSON.stringify(obj), key)
    expect(enc.startsWith('ff1:')).toBe(true)
    const back = await parseStoredFinanceData(enc, key)
    expect(back.months['0'].incomes[0].name).toBe('X')
  })

  it('parses legacy plaintext JSON string', async () => {
    const back = await parseStoredFinanceData('{"a":1}', null)
    expect(back).toEqual({ a: 1 })
  })

  it('decodeFinanceDataKey accepts 32-byte Base64', () => {
    const keyB64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    const key = decodeFinanceDataKey(keyB64)
    expect(key?.length).toBe(32)
  })
})
