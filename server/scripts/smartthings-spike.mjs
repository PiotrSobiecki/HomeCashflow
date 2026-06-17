/**
 * Spike SmartThings (issue #38) — weryfikacja, że konto Samsung jest dostępne przez API
 * i że nasza pralka/suszarka jest widoczna. NIE jest to kod produkcyjny: używa PAT
 * (Personal Access Token, ważny 24h od 30.12.2024), nie OAuth. Produkcja = OAuth (Faza 1).
 *
 * Użycie (PowerShell):
 *   $env:SMARTTHINGS_PAT = "<token z https://account.smartthings.com/tokens>"
 *   node scripts/smartthings-spike.mjs
 *
 * Opcjonalnie ID konkretnego urządzenia, żeby pobrać jego pełny status:
 *   node scripts/smartthings-spike.mjs <deviceId>
 *
 * Drukowanie listy przechodzi przez czysty helper summarizeDevices (src/smartthings/devices.js),
 * pokryty testami — tu zostaje tylko warstwa I/O.
 */

import { summarizeDevices } from '../src/smartthings/devices.js'

const BASE = 'https://api.smartthings.com/v1'
const PAT = process.env.SMARTTHINGS_PAT

if (!PAT) {
  console.error('Brak SMARTTHINGS_PAT. Wygeneruj PAT (scopes r:devices:* r:locations:*) na')
  console.error('https://account.smartthings.com/tokens i ustaw zmienną środowiskową.')
  process.exit(1)
}

async function st(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${PAT}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`SmartThings ${path} → ${res.status} ${res.statusText}\n${body}`)
  }
  return res.json()
}

async function main() {
  const deviceId = process.argv[2]

  console.log('→ GET /devices')
  const devices = await st('/devices')
  const summary = summarizeDevices(devices)
  if (summary.length === 0) {
    console.log('  Konto nie ma żadnych urządzeń widocznych przez API.')
  } else {
    console.table(summary)
  }

  const target = deviceId ?? summary[0]?.deviceId
  if (target) {
    console.log(`\n→ GET /devices/${target}/status`)
    const status = await st(`/devices/${target}/status`)
    console.dir(status, { depth: 6 })
  }
}

main().catch((err) => {
  console.error('\nSpike nieudany:', err.message)
  process.exit(1)
})
