import { describe, it, expect } from 'vitest'
import {
  signEbJwt, maskIban, mapBankTransaction, mapSessionAccount,
  categorizeExpense, isOwnTransfer, transactionDisplayName,
} from './enable-banking.js'

function b64urlToJson(part) {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
}

async function generateTestPem() {
  const { privateKey } = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ['sign', 'verify'],
  )
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', privateKey))
  const b64 = Buffer.from(der).toString('base64').match(/.{1,64}/g).join('\n')
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----\n`
}

describe('signEbJwt', () => {
  it('produces RS256 JWT with kid=appId and enablebanking claims', async () => {
    const pem = await generateTestPem()
    const jwt = await signEbJwt({ appId: 'app-123', privateKeyPem: pem, now: 1_700_000_000_000 })
    const [h, p, s] = jwt.split('.')
    expect(s.length).toBeGreaterThan(0)
    expect(b64urlToJson(h)).toEqual({ typ: 'JWT', alg: 'RS256', kid: 'app-123' })
    const payload = b64urlToJson(p)
    expect(payload.iss).toBe('enablebanking.com')
    expect(payload.aud).toBe('api.enablebanking.com')
    expect(payload.exp - payload.iat).toBe(3600)
  })

  it('accepts base64-encoded PEM (single-line secret)', async () => {
    const pem = await generateTestPem()
    const b64 = Buffer.from(pem, 'utf8').toString('base64')
    const jwt = await signEbJwt({ appId: 'app-123', privateKeyPem: b64 })
    expect(jwt.split('.')).toHaveLength(3)
  })

  it('throws without configuration', async () => {
    await expect(signEbJwt({ appId: null, privateKeyPem: null })).rejects.toThrow(/not configured/)
  })
})

describe('maskIban / mapSessionAccount', () => {
  it('keeps only prefix and last 4 chars', () => {
    expect(maskIban('PL61109010140000071219812874')).toBe('PL61…2874')
    expect(maskIban(null)).toBe(null)
  })

  it('maps EB session account without storing full IBAN', () => {
    const acc = mapSessionAccount({
      uid: 'u-1', name: 'Konto Direct', currency: 'PLN',
      account_id: { iban: 'PL61109010140000071219812874' },
    })
    expect(acc).toEqual({
      uid: 'u-1', displayName: 'Konto Direct', maskedIban: 'PL61…2874',
      currency: 'PLN', lastBookedDate: null,
    })
    expect(JSON.stringify(acc)).not.toContain('0000071219812874'.slice(0, 8))
  })
})

describe('mapBankTransaction', () => {
  const base = {
    status: 'BOOK',
    credit_debit_indicator: 'DBIT',
    transaction_amount: { amount: '50.00', currency: 'PLN' },
    booking_date: '2026-08-30',
    creditor: { name: 'ZABKA Z1234 K.1' },
    entry_reference: 'REF-1',
  }

  it('maps booked debit to expense with year/month/ref', () => {
    expect(mapBankTransaction(base, 'acc-1')).toEqual({
      kind: 'expense', name: 'ZABKA Z1234 K.1', amount: 50,
      txnDate: '2026-08-30', year: 2026, month: 7, ref: 'acc-1:REF-1',
    })
  })

  it('maps credit to income named after debtor', () => {
    const tx = mapBankTransaction({
      ...base,
      credit_debit_indicator: 'CRDT',
      transaction_amount: { amount: '8000.00', currency: 'PLN' },
      debtor: { name: 'AUDITMOS SP Z O O' },
    }, 'acc-1')
    expect(tx.kind).toBe('income')
    expect(tx.name).toBe('AUDITMOS SP Z O O')
    expect(tx.amount).toBe(8000)
  })

  it('skips pending, zero-amount and unparsable entries', () => {
    expect(mapBankTransaction({ ...base, status: 'PDNG' }, 'a')).toBe(null)
    expect(mapBankTransaction({ ...base, transaction_amount: { amount: '0' } }, 'a')).toBe(null)
    expect(mapBankTransaction({ ...base, booking_date: undefined, value_date: undefined }, 'a')).toBe(null)
    expect(mapBankTransaction({ ...base, credit_debit_indicator: undefined }, 'a')).toBe(null)
  })

  it('uses abs(amount) and fallback ref when entry_reference missing', () => {
    const tx = mapBankTransaction({
      ...base, entry_reference: undefined,
      transaction_amount: { amount: '-12.30', currency: 'PLN' },
    }, 'acc-9')
    expect(tx.amount).toBe(12.3)
    expect(tx.ref.startsWith('acc-9:2026-08-30:12.3:')).toBe(true)
  })

  it('falls back to remittance info for the name', () => {
    const tx = mapBankTransaction({
      ...base, creditor: undefined,
      remittance_information: ['BLIK P2P', 'telefon'],
    }, 'a')
    expect(tx.name).toBe('BLIK P2P telefon')
    expect(transactionDisplayName({}, 'expense')).toBe('Transakcja bankowa')
  })
})

describe('categorizeExpense', () => {
  const budgets = ['Żywność', 'Transport', 'Inne']

  it('matches keyword to an existing budget category', () => {
    expect(categorizeExpense('ZABKA Z0000 WARSZAWA', budgets)).toBe('Żywność')
    expect(categorizeExpense('LIDL SP. Z O.O.', budgets)).toBe('Żywność')
    expect(categorizeExpense('STACJA ORLEN 4321', budgets)).toBe('Transport')
  })

  it('returns null when no keyword matches or budget list empty', () => {
    expect(categorizeExpense('PRZELEW WLASNY', budgets)).toBe(null)
    expect(categorizeExpense('ZABKA', [])).toBe(null)
  })

  it('never assigns a category the household does not have', () => {
    expect(categorizeExpense('ROSSMANN 123', budgets)).toBe(null)
  })
})

describe('isOwnTransfer', () => {
  it('matches full name case- and diacritics-insensitively on either side', () => {
    expect(isOwnTransfer({ creditor: { name: 'JÓZEF ŻÓŁĆ' } }, 'Jozef Zolc')).toBe(true)
    expect(isOwnTransfer({ debtor: { name: 'jozef  zolc' } }, 'Józef Żółć')).toBe(true)
  })

  it('does not match a different person with the same surname', () => {
    expect(isOwnTransfer({ creditor: { name: 'Anna Kowalska' } }, 'Jan Kowalski')).toBe(false)
  })

  it('requires a full (two-word) owner name', () => {
    expect(isOwnTransfer({ creditor: { name: 'Jan' } }, 'Jan')).toBe(false)
    expect(isOwnTransfer({}, null)).toBe(false)
  })
})
