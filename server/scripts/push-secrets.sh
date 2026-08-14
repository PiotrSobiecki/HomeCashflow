#!/usr/bin/env bash
# Wypycha komplet sekretów Workera homecashflow-api jednym `secret bulk`.
#
# Dotyczy tylko backendu. Worker frontendu serwuje statyczne assety i nie ma
# sekretów — VITE_API_URL to zmienna build-time.
#
# Pojedyncze `secret put` są niebezpieczne: pierwsza nowa wersja zostaje z jednym
# kluczem i produkcja leży, dopóki nie wklepiesz reszty. Stąd zawsze bulk.
#
# Wartości idą do wranglera strumieniem — nie są wypisywane ani zapisywane na dysk.
# Z pliku brane są wyłącznie klucze z listy KEYS, więc reszta zmiennych zostaje na miejscu.
#
# Użycie (z katalogu server/):
#   ./scripts/push-secrets.sh                  # plik produkcyjny w katalogu repozytorium
#   ./scripts/push-secrets.sh <ścieżka>        # inny plik w formacie KLUCZ=wartość
#   ./scripts/push-secrets.sh --op             # 1Password wg secrets.tpl.json
set -euo pipefail

KEYS=(
  DATABASE_URL
  NEXTAUTH_SECRET
  FINANCE_DATA_KEY
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  RESEND_API_KEY
  SMARTTHINGS_CLIENT_ID
  SMARTTHINGS_CLIENT_SECRET
  VAPID_PUBLIC_KEY
  VAPID_PRIVATE_JWK
  PUSH_ADMIN_CONTACT
  WEATHER_GOOGLE_API_KEY
)

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
server_dir="$(dirname "$here")"
repo_dir="$(dirname "$server_dir")"
config="$server_dir/wrangler.toml"
template="$server_dir/secrets.tpl.json"

wrangler_js=""
for candidate in "$server_dir/node_modules/wrangler/bin/wrangler.js" "$repo_dir/node_modules/wrangler/bin/wrangler.js"; do
  [ -f "$candidate" ] && wrangler_js="$candidate" && break
done
[ -n "$wrangler_js" ] || { echo "Nie znalazłem wranglera w node_modules — odpal npm install w server/."; exit 1; }
[ -f "$config" ] || { echo "Brak konfiguracji Workera: $config"; exit 1; }

joined="$(IFS='|'; echo "${KEYS[*]}")"
pattern="^(export[[:space:]]+)?(${joined})="

if [ "${1:-}" = "--op" ]; then
  command -v op >/dev/null || { echo "Nie znalazłem 1Password CLI (op)."; exit 1; }
  [ -f "$template" ] || { echo "Brak szablonu $template — same referencje op://, bez wartości."; exit 1; }
  source_label="1Password ($template)"
  # op inject rozwiązuje referencje op:// na stdout; wartości zostają w pamięci
  payload="$(op inject -i "$template")"
else
  src="${1:-$repo_dir/.env.production}"
  [ -f "$src" ] || { echo "Nie ma pliku $src — podaj ścieżkę argumentem."; exit 1; }
  source_label="$src"
  payload="$(grep -E "$pattern" "$src" | sed -E 's/^export[[:space:]]+//' || true)"
fi

echo "Worker: homecashflow-api"
echo "Źródło wartości: $source_label"

# Wartość rozbita na kilka linii zostałaby po cichu obcięta do pierwszej — lepiej stanąć.
truncated="$(printf '%s\n' "$payload" | awk '
  { i = index($0, "="); if (i == 0) next
    k = substr($0, 1, i - 1); v = substr($0, i + 1); q = substr(v, 1, 1)
    if ((q == "\"" || q == "\x27") && (length(v) < 2 || substr(v, length(v), 1) != q)) print k }')"
if [ -n "$truncated" ]; then
  echo "Wartość wielolinijkowa, zostałaby obcięta: $truncated"
  echo "Popraw plik źródłowy albo wypchnij ten klucz osobno."
  exit 1
fi

found=0
missing=()
for key in "${KEYS[@]}"; do
  if printf '%s' "$payload" | grep -qE "(^|[^A-Z_])${key}\"?[=:]"; then
    found=$((found + 1))
  else
    missing+=("$key")
  fi
done

echo "Znalezione klucze: $found / ${#KEYS[@]}"
if [ ${#missing[@]} -gt 0 ]; then
  echo "Brak w źródle: ${missing[*]}"
  echo "Wypchnięcie niepełnego kompletu zostawi produkcję z błędem 500."
fi

if [ "${SKIP_CONFIRM:-}" != "1" ]; then
  echo
  echo "To idzie na PRODUKCJĘ (homecashflow-api). Upewnij się, że to wartości produkcyjne,"
  echo "a nie deweloperskie — inaczej aplikacja zacznie pisać do innej bazy."
  read -r -p "Wpisz TAK, żeby kontynuować: " answer
  [ "$answer" = "TAK" ] || { echo "Przerwane — nic nie zostało wypchnięte."; exit 1; }
fi

# Wrangler czyta stdin: najpierw próbuje JSON, potem formatu KLUCZ=wartość.
# Wołamy go przez node, bo shim npx gubi strumień na Windows.
printf '%s\n' "$payload" | node "$wrangler_js" secret bulk --config "$config"

echo
echo "Sprawdzam, co Worker widzi po wypchnięciu..."
live="$(node "$wrangler_js" secret list --config "$config" | sed -n '/\[/,$p')"
still_missing=()
for key in "${KEYS[@]}"; do
  printf '%s' "$live" | grep -q "\"$key\"" || still_missing+=("$key")
done

echo "Kluczy na Workerze: $(( ${#KEYS[@]} - ${#still_missing[@]} )) / ${#KEYS[@]}"
if [ ${#still_missing[@]} -gt 0 ]; then
  echo
  echo "BRAKUJE: ${still_missing[*]}"
  echo "NIE wdrażaj kodu, dopóki lista nie jest kompletna — wyjdzie 500 na każdym zapytaniu."
  exit 1
fi

echo
echo "Komplet. Następny krok: npx wrangler deploy (z katalogu server/)."
