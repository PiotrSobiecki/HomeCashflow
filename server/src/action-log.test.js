import { describe, it, expect, beforeEach } from 'vitest'
import { neon } from '@neondatabase/serverless'
import { cleanDb } from './test-setup.js'
import { upsertUserAndHousehold } from './app.js'
import { logAction, readRecentActionLog } from './action-log.js'

const sql = neon(process.env.DATABASE_URL)

async function setupHousehold(suffix = '') {
  const user = await upsertUserAndHousehold(sql, {
    sub: `google-al${suffix}`,
    email: `al${suffix}@test.com`,
    name: `AL User ${suffix}`,
  })
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${user.id}`
  return { user, householdId: m.household_id }
}

describe('logAction + readRecentActionLog', () => {
  beforeEach(async () => {
    await cleanDb()
    await sql`DELETE FROM action_log`
  })

  it('zapisuje pojedynczy wpis i czyta go z powrotem', async () => {
    const { user, householdId } = await setupHousehold()

    await logAction(sql, {
      householdId,
      actorId: user.id,
      operation: 'CREATE',
      resourceType: 'transaction',
      resourceId: '11111111-1111-1111-1111-111111111111',
      before: null,
      after: { id: '11111111-1111-1111-1111-111111111111', name: 'ff1:dummy', amount: 'ff1:dummy' },
    })

    const entries = await readRecentActionLog(sql, householdId)
    expect(entries.length).toBe(1)
    expect(entries[0]).toMatchObject({
      operation: 'CREATE',
      resourceType: 'transaction',
      resourceId: '11111111-1111-1111-1111-111111111111',
      actorId: user.id,
    })
    expect(entries[0].after).toMatchObject({ name: 'ff1:dummy' })
    expect(entries[0].before).toBeNull()
    expect(entries[0].undoneAt).toBeNull()
    expect(typeof entries[0].at).toBe('string')
  })

  it('rotuje do 20 najnowszych wpisów per household (rotacja po INSERT)', async () => {
    const { user, householdId } = await setupHousehold()

    // 25 wpisów, każdy z innym resourceId żebyśmy mogli rozróżnić
    for (let i = 0; i < 25; i++) {
      await logAction(sql, {
        householdId,
        actorId: user.id,
        operation: 'CREATE',
        resourceType: 'transaction',
        resourceId: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
        before: null,
        after: { seq: i },
      })
    }

    const entries = await readRecentActionLog(sql, householdId)
    expect(entries.length).toBe(20)
    // Najnowszy wpis (seq=24) powinien być pierwszy (DESC)
    expect(entries[0].after.seq).toBe(24)
    // Wpisy z seq 0..4 powinny być wyrotowane
    const allSeqs = entries.map(e => e.after.seq)
    expect(Math.min(...allSeqs)).toBe(5)
  })

  it('izoluje wpisy per household', async () => {
    const a = await setupHousehold('-a')
    const b = await setupHousehold('-b')

    await logAction(sql, {
      householdId: a.householdId, actorId: a.user.id,
      operation: 'CREATE', resourceType: 'transaction', resourceId: 'aaa',
      before: null, after: { tag: 'A' },
    })
    await logAction(sql, {
      householdId: b.householdId, actorId: b.user.id,
      operation: 'CREATE', resourceType: 'transaction', resourceId: 'bbb',
      before: null, after: { tag: 'B' },
    })

    const aEntries = await readRecentActionLog(sql, a.householdId)
    const bEntries = await readRecentActionLog(sql, b.householdId)
    expect(aEntries.length).toBe(1)
    expect(bEntries.length).toBe(1)
    expect(aEntries[0].after.tag).toBe('A')
    expect(bEntries[0].after.tag).toBe('B')
  })
})
