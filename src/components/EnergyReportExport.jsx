import { useState } from 'react'
import { FileText, Download, Mail, Loader2, Check, X } from 'lucide-react'
import { fetchEnergyReport, emailEnergyReport } from '../lib/api'
import { buildEnergyReportPdf, pdfToBase64 } from '../lib/energyReportPdf'

const PRESETS = [7, 30, 90, 365]

/**
 * Eksport raportu energii: dowolna liczba dni (1–365), pobranie PDF
 * albo wysyłka na email zalogowanego usera (załącznik przez Resend).
 */
export const EnergyReportExport = () => {
  const [days, setDays] = useState('30')
  const [busy, setBusy] = useState('') // '' | 'download' | 'email'
  const [message, setMessage] = useState(null) // { ok: boolean, text: string }

  const parseDays = () => {
    const n = Number(days)
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      setMessage({ ok: false, text: 'Podaj liczbę dni od 1 do 365.' })
      return null
    }
    return n
  }

  const handleExport = async (mode) => {
    const n = parseDays()
    if (n == null) return
    setBusy(mode)
    setMessage(null)
    try {
      const report = await fetchEnergyReport(n)
      if (report.devices.length === 0) {
        setMessage({ ok: false, text: 'Brak urządzeń do raportu.' })
        return
      }
      const doc = await buildEnergyReportPdf(report)
      if (mode === 'download') {
        doc.save(`raport-energii-${new Date().toISOString().slice(0, 10)}.pdf`)
        setMessage({ ok: true, text: 'Pobrano raport PDF.' })
      } else {
        const { to } = await emailEnergyReport({ pdfBase64: pdfToBase64(doc), days: n })
        setMessage({ ok: true, text: `Wysłano raport na ${to}.` })
      }
    } catch (err) {
      setMessage({
        ok: false,
        text: err?.code === 'email_not_configured'
          ? 'Wysyłka maili nie jest skonfigurowana na serwerze.'
          : 'Nie udało się wygenerować raportu. Spróbuj ponownie.',
      })
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">Raport zużycia</h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="report-days" className="text-sm text-slate-300">Ostatnie</label>
        <input
          id="report-days"
          type="number" min="1" max="365" value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-20 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <span className="text-sm text-slate-300 mr-1">dni</span>
        {PRESETS.map((p) => (
          <button
            key={p} type="button" onClick={() => setDays(String(p))}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              Number(days) === p ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {p === 365 ? '1 rok' : `${p} dni`}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button" onClick={() => handleExport('download')} disabled={!!busy}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {busy === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Pobierz PDF
        </button>
        <button
          type="button" onClick={() => handleExport('email')} disabled={!!busy}
          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 border border-slate-600 rounded-xl text-sm transition-all disabled:opacity-50"
        >
          {busy === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Wyślij na mój email
        </button>
      </div>

      {message && (
        <p className={`flex items-center gap-1.5 mt-3 text-sm ${message.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
          {message.ok ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
          {message.text}
        </p>
      )}
    </div>
  )
}
