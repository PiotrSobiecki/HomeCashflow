import { neon } from '@neondatabase/serverless'

let _sql

export function getDb(databaseUrl) {
  if (!_sql) {
    _sql = neon(databaseUrl || process.env.DATABASE_URL)
  }
  return _sql
}
