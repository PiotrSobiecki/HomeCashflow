// jsPDF importowany dynamicznie — ~150 kB gzip ładuje się dopiero przy pierwszym eksporcie.
// Wbudowane fonty jsPDF nie mają polskich diakrytyków — ładujemy DejaVu z public/fonts
// (poza bundlem; pobierane dopiero przy pierwszym eksporcie, potem z cache).
const TZ = 'Europe/Warsaw'
let fontsPromise = null

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      ['/fonts/DejaVuSans.ttf', '/fonts/DejaVuSans-Bold.ttf'].map(async (url) => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Nie udało się pobrać fontu: ${url}`)
        return bufferToBase64(await res.arrayBuffer())
      }),
    ).catch((err) => { fontsPromise = null; throw err })
  }
  return fontsPromise
}

const fmtKwh = (v) => (v !== 0 && Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(2))
const fmtUptime = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`)
const fmtDate = (d) => new Date(d).toLocaleDateString('pl-PL', { timeZone: TZ })

const TABLE_STYLE = {
  styles: { font: 'DejaVu', fontSize: 9, cellPadding: 2.5 },
  headStyles: { font: 'DejaVu', fontStyle: 'bold', fillColor: [79, 70, 229], textColor: 255 },
  footStyles: { font: 'DejaVu', fontStyle: 'bold', fillColor: [226, 232, 240], textColor: 30 },
  alternateRowStyles: { fillColor: [248, 250, 252] },
}

/**
 * Buduje PDF raportu energii z danych GET /api/smart-devices/report.
 * Zwraca instancję jsPDF — caller robi .save() (pobranie) albo output (email).
 */
export async function buildEnergyReportPdf(report) {
  const [{ jsPDF }, { default: autoTable }, [regular, bold]] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadFonts(),
  ])
  const doc = new jsPDF()
  doc.addFileToVFS('DejaVuSans.ttf', regular)
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal')
  doc.addFileToVFS('DejaVuSans-Bold.ttf', bold)
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVu', 'bold')

  doc.setFont('DejaVu', 'bold')
  doc.setFontSize(16)
  doc.text('Raport zużycia energii', 14, 18)

  doc.setFont('DejaVu', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Okres: ${fmtDate(report.from)} – ${fmtDate(report.to)} (${report.days} dni)`, 14, 26)
  const priceLine = report.energyPricePln != null
    ? `Cena za 1 kWh: ${report.energyPricePln.toFixed(2)} zł`
    : 'Cena za 1 kWh: nieustawiona (brak kosztów)'
  doc.text(priceLine, 14, 32)
  doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL', { timeZone: TZ })} — HomeCashflow`, 14, 38)
  doc.setTextColor(0)

  const totalKwh = report.devices.reduce((s, d) => s + d.energyKwh, 0)
  const totalCost = report.energyPricePln == null
    ? null
    : report.devices.reduce((s, d) => s + (d.costPln ?? 0), 0)

  autoTable(doc, {
    ...TABLE_STYLE,
    startY: 44,
    head: [['Urządzenie', 'Zużycie [kWh]', 'Koszt [zł]', 'Szczyt mocy [W]', 'Czas poboru']],
    body: report.devices.map((d) => [
      d.name,
      fmtKwh(d.energyKwh),
      d.costPln != null ? d.costPln.toFixed(2) : '—',
      d.peakW != null ? String(Math.round(d.peakW)) : '—',
      fmtUptime(d.uptimeMin),
    ]),
    foot: [['Razem', fmtKwh(totalKwh), totalCost != null ? totalCost.toFixed(2) : '—', '', '']],
  })

  if (report.daily.length > 0) {
    autoTable(doc, {
      ...TABLE_STYLE,
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Data', 'Zużycie [kWh]', 'Koszt [zł]']],
      body: report.daily.map((r) => [
        fmtDate(r.date),
        fmtKwh(r.kwh),
        report.energyPricePln != null ? (r.kwh * report.energyPricePln).toFixed(2) : '—',
      ]),
    })
  }

  return doc
}

/** PDF → czysty base64 (bez prefiksu data URI) — payload do wysyłki mailem. */
export const pdfToBase64 = (doc) => bufferToBase64(doc.output('arraybuffer'))
