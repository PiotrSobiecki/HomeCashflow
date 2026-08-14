<#
.SYNOPSIS
Wypycha komplet sekretów Workera homecashflow-api jednym żądaniem.

.DESCRIPTION
Dotyczy wyłącznie backendu (homecashflow-api). Worker frontendu serwuje statyczne
assety i nie ma żadnych sekretów — VITE_API_URL to zmienna build-time, nie sekret.

Zawsze `secret bulk`, nigdy dwanaście razy `secret put`: pojedyncze puty tworzą
kolejne wersje, a pierwsza z nich zostaje z jednym kluczem i produkcja leży,
dopóki nie wklepiesz reszty.

Wartości idą do wranglera strumieniem — nie są wypisywane ani zapisywane na dysk.
Ze wskazanego pliku brane są wyłącznie klucze z listy $Keys, więc reszta zmiennych
(VITE_*, adresy testowej bazy) nigdzie nie wyjeżdża.

.EXAMPLE
.\push-secrets.ps1
Wartości z pliku produkcyjnego w katalogu repozytorium.

.EXAMPLE
.\push-secrets.ps1 -Path D:\tmp\wartosci.json
Inny plik: JSON albo KEY=VALUE.

.EXAMPLE
.\push-secrets.ps1 -Source op
Wartości z 1Password przez `op inject` na podstawie secrets.tpl.json.

.EXAMPLE
.\push-secrets.ps1 -Source prompt
Pyta o każdy klucz po kolei, nic nie czyta z dysku.
#>
[CmdletBinding()]
param(
  [ValidateSet('file', 'op', 'prompt')]
  [string]$Source = 'file',
  [string]$Path,
  [string]$Template = (Join-Path $PSScriptRoot '..\secrets.tpl.json'),
  [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [System.Text.Encoding]::UTF8

$Config = Join-Path $PSScriptRoot '..\wrangler.toml'
if (-not (Test-Path $Config)) { throw "Brak konfiguracji Workera: $Config" }

# Komplet kluczy, których wymaga homecashflow-api. Brak któregokolwiek = 500 na produkcji.
$Keys = @(
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'FINANCE_DATA_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'SMARTTHINGS_CLIENT_ID',
  'SMARTTHINGS_CLIENT_SECRET',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_JWK',
  'PUSH_ADMIN_CONTACT',
  'WEATHER_GOOGLE_API_KEY'
)

# Wrangler wolamy przez node, nie przez npx: shim .cmd gubi strumien wejsciowy
# w PowerShellu i `secret bulk` dostaje puste wejscie ("No content found in file").
$WranglerJs = @(
  (Join-Path $PSScriptRoot '..\node_modules\wrangler\bin\wrangler.js'),
  (Join-Path $PSScriptRoot '..\..\node_modules\wrangler\bin\wrangler.js')
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $WranglerJs) { throw "Nie znalazlem wranglera w node_modules - odpal `npm install` w server\." }

function Invoke-Wrangler {
  param([string[]]$Arguments, [string]$StdIn)
  if ($null -ne $StdIn) { return ($StdIn | & node $WranglerJs @Arguments) }
  return (& node $WranglerJs @Arguments)
}

function Get-WorkerSecretNames {
  $raw = (Invoke-Wrangler -Arguments @('secret', 'list', '--config', $Config)) -join "`n"
  $start = $raw.IndexOf('[')
  if ($start -lt 0) { return @() }
  $parsed = $raw.Substring($start) | ConvertFrom-Json
  return @($parsed | ForEach-Object { $_.name })
}

function Read-ValuesFromFile([string]$FilePath) {
  $text = Get-Content -Raw -Path $FilePath
  $picked = [ordered]@{}
  if ($FilePath -match '\.json$') {
    $obj = $text | ConvertFrom-Json
    $present = $obj.PSObject.Properties.Name
    foreach ($key in $Keys) {
      if ($present -contains $key) { $picked[$key] = [string]$obj.$key }
    }
    return $picked
  }
  foreach ($line in ($text -split "`r?`n")) {
    if ($line -match '^\s*#') { continue }
    $entry = $line -replace '^\s*export\s+', ''
    $eq = $entry.IndexOf('=')
    if ($eq -lt 1) { continue }
    $key = $entry.Substring(0, $eq).Trim()
    if ($Keys -notcontains $key) { continue }
    $picked[$key] = $entry.Substring($eq + 1).Trim().Trim('"').Trim("'")
  }
  return $picked
}

function Send-Values($Values) {
  $missing = @($Keys | Where-Object { -not $Values.Contains($_) })
  Write-Host "Znalezione klucze: $($Values.Count) / $($Keys.Count)"
  if ($missing.Count -gt 0) {
    Write-Host "Brak w zrodle: $($missing -join ', ')"
    Write-Host "Wypchniecie niepelnego kompletu zostawi produkcje z bledem 500."
  }
  if (-not $Yes) {
    Write-Host "`nTo idzie na PRODUKCJE (homecashflow-api). Upewnij sie, ze to wartosci produkcyjne,"
    Write-Host "a nie deweloperskie - inaczej aplikacja zacznie pisac do innej bazy."
    $answer = Read-Host "Wpisz TAK, zeby kontynuowac"
    if ($answer -cne 'TAK') { throw "Przerwane - nic nie zostalo wypchniete." }
  }
  $json = $Values | ConvertTo-Json -Compress
  Invoke-Wrangler -Arguments @('secret', 'bulk', '--config', $Config) -StdIn $json
  if ($LASTEXITCODE -ne 0) { throw "secret bulk zwrocil blad ($LASTEXITCODE) - sekrety NIE zostaly wypchniete." }
}

Write-Host "Worker: homecashflow-api"
Write-Host "Zrodlo wartosci: $Source`n"

switch ($Source) {
  'file' {
    if (-not $Path) { $Path = Join-Path $PSScriptRoot '..\..\.env.production' }
    if (-not (Test-Path $Path)) {
      throw "Nie ma pliku $Path - wskaz go przez -Path albo uzyj -Source prompt."
    }
    Write-Host "Plik: $Path"
    Send-Values (Read-ValuesFromFile $Path)
  }
  'op' {
    if (-not (Get-Command op -ErrorAction SilentlyContinue)) {
      throw "Nie znalazlem 1Password CLI (op). Uzyj -Source file albo -Source prompt."
    }
    if (-not (Test-Path $Template)) {
      throw "Brak szablonu $Template - ma zawierac wylacznie referencje op://, bez wartosci."
    }
    # op inject rozwiazuje referencje op:// na stdout - wartosci zostaja w pamieci
    $injected = ((op inject -i $Template) | Out-String) | ConvertFrom-Json
    $present = $injected.PSObject.Properties.Name
    $values = [ordered]@{}
    foreach ($key in $Keys) {
      if ($present -contains $key) { $values[$key] = [string]$injected.$key }
    }
    Send-Values $values
  }
  'prompt' {
    $values = [ordered]@{}
    foreach ($key in $Keys) {
      $secure = Read-Host -Prompt $key -AsSecureString
      $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
      try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
      finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
      if ([string]::IsNullOrWhiteSpace($plain)) {
        throw "Pusta wartosc dla $key - przerywam, zeby nie wgrac niepelnego kompletu."
      }
      $values[$key] = $plain
    }
    Send-Values $values
  }
}

Write-Host "`nSprawdzam, co Worker widzi po wypchnieciu..."
$live = Get-WorkerSecretNames
$missing = @($Keys | Where-Object { $live -notcontains $_ })
$extra = @($live | Where-Object { $Keys -notcontains $_ })

Write-Host "Kluczy na Workerze: $($live.Count) / $($Keys.Count)"
if ($extra.Count -gt 0) { Write-Host "Dodatkowe (spoza listy): $($extra -join ', ')" }

if ($missing.Count -gt 0) {
  Write-Host "`nBRAKUJE: $($missing -join ', ')"
  Write-Host "NIE wdrazaj kodu, dopoki lista nie jest kompletna - wyjdzie 500 na kazdym zapytaniu."
  exit 1
}

Write-Host "`nKomplet. Nastepny krok:"
Write-Host "  npx wrangler deploy --config server/wrangler.toml"
Write-Host "Weryfikacja po wdrozeniu: https://api.homecashflow.org/api/auth/google ma zwrocic 302."
