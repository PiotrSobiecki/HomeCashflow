/**
 * Ustawienia cyklu pralki Samsung (SmartThings): definicje capability/komend, mapy
 * etykiet PL i odczyt aktualnych wartości + list dozwolonych opcji ze statusu.
 *
 * Współdzielone przez status.js (UI-model) i commands.js (budowa/walidacja komend),
 * żeby lista wspieranych wartości i nazwy komend żyły w jednym miejscu.
 *
 * Na razie tylko pralka (washer). Suszarka/zmywarka mają inne capability (dryerDryLevel
 * itd.) — dorobić analogicznie, gdy zajdzie potrzeba.
 *
 * @see https://developer.smartthings.com/docs/devices/capabilities/capabilities-reference
 */

/** Wartość atrybutu capability z komponentu `main` (lub null gdy brak). */
function attr(status, capability, attribute) {
  return status?.components?.main?.[capability]?.[attribute]?.value ?? null
}

// Definicja każdego ustawienia: skąd czytać aktualną wartość i listę wspieranych,
// oraz jaką komendę ST wysłać przy zmianie.
export const WASHER_SETTINGS = {
  temperature: {
    capability: 'custom.washerWaterTemperature',
    command: 'setWasherWaterTemperature',
    currentAttr: 'washerWaterTemperature',
    supportedAttr: 'supportedWasherWaterTemperature',
  },
  spin: {
    capability: 'custom.washerSpinLevel',
    command: 'setWasherSpinLevel',
    currentAttr: 'washerSpinLevel',
    supportedAttr: 'supportedWasherSpinLevel',
  },
  rinse: {
    capability: 'custom.washerRinseCycles',
    command: 'setWasherRinseCycles',
    currentAttr: 'washerRinseCycles',
    supportedAttr: 'supportedWasherRinseCycles',
  },
  bubbleSoak: {
    capability: 'samsungce.washerBubbleSoak',
    command: 'setWasherBubbleSoak',
    currentAttr: 'status',
    // Bez listy „supported" w statusie — namaczanie to zawsze on/off.
    staticOptions: ['off', 'on'],
  },
  cycle: {
    capability: 'samsungce.washerCycle',
    command: 'setWasherCycle',
    // Aktualny cykl jest jak "Table_02_Course_1C" → interesuje nas sam kod kursu (1C).
    currentAttr: 'washerCycle',
    // Lista kodów kursów żyje pod custom.supportedOptions.supportedCourses.
    coursesCapability: 'custom.supportedOptions',
    coursesAttr: 'supportedCourses',
  },
}

// Etykiety PL. Wartości spoza mapy renderujemy „jak są" (degradacja, nie crash).
const TEMP_LABEL = { none: 'Brak', cold: 'Zimna', 20: '20°C', 30: '30°C', 40: '40°C', 60: '60°C', 70: '70°C', 90: '90°C' }
const SPIN_LABEL = { noSpin: 'Bez wirowania', rinseHold: 'Stop w wodzie', 400: '400 obr.', 800: '800 obr.', 1000: '1000 obr.', 1200: '1200 obr.', 1400: '1400 obr.' }
const BUBBLE_LABEL = { on: 'Włączone', off: 'Wyłączone' }

// Programy: ST zwraca surowe kody kursów (1C, 25…) BEZ nazw — w publicznym API ich nie ma
// (apka SmartThings rozwiązuje je z wbudowanej tablicy `Table_XX`, niewystawianej przez REST).
// Dlatego nazwy mamy w trzech warstwach (od najwyższego priorytetu):
//   1) etykiety własne usera (cycle_labels per urządzenie) — edytowalne w UI,
//   2) draft COURSE_LABEL poniżej — tylko kursy pewne po „odcisku" parametrów,
//   3) opis z parametrów kursu (np. „60° · 1400 · 4× płuk") — informacyjny fallback,
//   4) „Program 1C" — gdy nie znamy nawet parametrów.
//
// DRAFT nazw PL (Table_02, model WW90T65). Lista programów potwierdzona przez usera (pokrętło/apka),
// kody dopasowane po „odcisku" parametrów. PEWNE (parametry jednoznaczne):
//   1C = Eco 40-60 (potwierdzone przez usera; temp auto pasuje), 26 = Wełna (jedyny maks. wir. 400),
//   28 = Wirowanie (jedyny bez płukania), 3A = Czyszczenie bębna (wszystko zablokowane 70°/1200),
//   27 = Płukanie i wirowanie (bez prania, temp auto). RESZTA = best-guess po parametrach,
//   do weryfikacji na sprzęcie (user poprawia w UI; potwierdzone wpisy lądują tu na stałe).
const COURSE_LABEL = {
  '1C': 'Eco 40-60',          // ✓ pewne (user)
  26: 'Wełna',                // ✓ pewne (spin 400)
  28: 'Wirowanie',            // ✓ pewne (bez płukania)
  '3A': 'Czyszczenie bębna',  // ✓ pewne (70° zablokowane)
  27: 'Płukanie i wirowanie', // ✓ pewne (bez prania, auto)
  // — poniżej best-guess (do potwierdzenia) —
  '2E': 'Higieniczna para',   // 90° (najgorętszy)
  20: 'Bawełna',              // 60°/1400/4× płuk
  33: 'Ręczniki',             // 60°/1400/4× płuk
  '1B': 'Dziecięce',          // do 90°/1200/4× płuk
  24: 'Syntetyki',            // 40°/800/3× płuk
  '2A': 'Jeansy',             // 30°/800/4× płuk (extra płukanie)
  '2F': 'Odzież sportowa',    // 30°/800/3× płuk
  '1E': 'Koszule',            // 30°/1200/3× płuk
  '1F': 'Delikatne',          // tylko zimna (najdelikatniejszy)
  30: 'Kolory',               // 40–60°/1400/2× płuk
  34: 'Pościel',              // 40–60°/1400/3× płuk
  25: 'Mieszane',             // 40–60°/1200/2× płuk
  32: 'Ekonomiczne',          // 30–60°/800 (niskie wir.)
  22: 'Pranie szybkie 15',    // 40°/800/2× płuk (proste)
  23: 'Ciche pranie',         // 30°/1200/3× płuk
  21: 'Pochmurny dzień',      // 30°/1200/4× płuk
  '2D': 'Odzież wierzchnia',  // 40°/800/2× płuk
}

/** Skrócona etykieta wartości (do opisu kursu): bez „°C"/„obr." żeby zmieścić w jednej linii. */
function shortTemp(v) { return v === 'cold' ? 'zimna' : `${v}°` }
function shortSpin(v) { return v === 'noSpin' ? 'bez wir.' : v === 'rinseHold' ? 'stop w wodzie' : `${v} obr` }

/**
 * Opis kursu z jego domyślnych parametrów (`samsungce.washerCycle.supportedCycles`):
 * „60° · 1400 · 4× płuk". Pomija temperaturę gdy kurs jej nie ustawia (default 'none').
 * Zwraca null gdy nie znajdziemy wpisu kursu — wtedy wołający da „Program {kod}".
 */
function describeCourse(status, code) {
  const cycles = attr(status, 'samsungce.washerCycle', 'supportedCycles')
  const entry = Array.isArray(cycles) ? cycles.find((cyc) => cyc?.cycle === code) : null
  if (!entry?.supportedOptions) return null
  const o = entry.supportedOptions
  const parts = []
  if (o.waterTemperature?.default && o.waterTemperature.default !== 'none') parts.push(shortTemp(o.waterTemperature.default))
  if (o.spinLevel?.default) parts.push(shortSpin(o.spinLevel.default))
  if (o.rinseCycle?.default && o.rinseCycle.default !== '0') parts.push(`${o.rinseCycle.default}× płuk`)
  return parts.length ? parts.join(' · ') : null
}

function labelFor(setting, value, ctx) {
  if (setting === 'temperature') return TEMP_LABEL[value] ?? String(value)
  if (setting === 'spin') return SPIN_LABEL[value] ?? String(value)
  if (setting === 'rinse') return value === '0' ? 'Bez płukania' : `${value}× płukanie`
  if (setting === 'bubbleSoak') return BUBBLE_LABEL[value] ?? String(value)
  if (setting === 'cycle') {
    return ctx?.custom?.[value] ?? COURSE_LABEL[value] ?? describeCourse(ctx?.status, value) ?? `Program ${value}`
  }
  return String(value)
}

/** Kod kursu z wartości washerCycle ("Table_02_Course_1C" → "1C"; gołe "1C" zostaje). */
function courseCode(raw) {
  if (!raw) return null
  const m = String(raw).match(/Course_([0-9A-Za-z]+)$/)
  return m ? m[1] : String(raw)
}

/** Surowa lista wspieranych wartości danego ustawienia (do walidacji komend). */
function supportedValues(status, setting) {
  const def = WASHER_SETTINGS[setting]
  if (!def) return []
  // Statyczne opcje (namaczanie on/off) tylko gdy urządzenie faktycznie ma to capability.
  if (def.staticOptions) {
    return attr(status, def.capability, def.currentAttr) != null ? def.staticOptions : []
  }
  if (setting === 'cycle') return attr(status, def.coursesCapability, def.coursesAttr) ?? []
  return attr(status, def.capability, def.supportedAttr) ?? []
}

/**
 * UI-model ustawień pralki: per ustawienie aktualna wartość + opcje [{value,label}].
 * Pomija ustawienia bez sensownych opcji (np. temperatura = tylko „none"). Zwraca
 * null gdy urządzenie nie wystawia żadnego z capability (nie-Samsung / nie-pralka).
 */
export function readWasherSettings(status, customLabels) {
  // Kontekst dla etykiet programów: nazwy własne usera + status (do opisu z parametrów).
  const ctx = { custom: customLabels && typeof customLabels === 'object' ? customLabels : null, status }
  const out = {}
  for (const setting of Object.keys(WASHER_SETTINGS)) {
    const def = WASHER_SETTINGS[setting]
    const raw = supportedValues(status, setting).filter((v) => v !== 'none')
    if (!raw.length) continue
    const current = setting === 'cycle'
      ? courseCode(attr(status, def.capability, def.currentAttr))
      : attr(status, def.capability, def.currentAttr)
    out[setting] = {
      value: current != null ? String(current) : null,
      options: raw.map((v) => ({ value: String(v), label: labelFor(setting, v, ctx) })),
    }
  }
  return Object.keys(out).length ? out : null
}

/** Mapa { setting: [wspierane wartości] } — do walidacji komend (commands.js). */
export function allowedWasherSettings(status) {
  const out = {}
  for (const setting of Object.keys(WASHER_SETTINGS)) {
    const raw = supportedValues(status, setting).filter((v) => v !== 'none').map(String)
    if (raw.length) out[setting] = raw
  }
  return out
}
