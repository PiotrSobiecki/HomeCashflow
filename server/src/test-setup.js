import dotenv from 'dotenv'
dotenv.config({ path: '../.env' })
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// Clean test data before each run
export async function cleanDb() {
  await sql`DELETE FROM invitations`
  await sql`DELETE FROM finance_data`
  await sql`DELETE FROM household_members`
  await sql`DELETE FROM households`
  await sql`DELETE FROM users`
}
