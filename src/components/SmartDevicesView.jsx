import { useState, useEffect, useRef } from 'react'
import { Plus, Loader2, Cpu, GripHorizontal } from 'lucide-react'

const ORDER_KEY = 'hc:deviceOrder'
const loadOrder = () => { try { return JSON.parse(localStorage.getItem(ORDER_KEY)) || [] } catch { return [] } }

// Sortuje urządzenia wg zapisanej kolejności id; nieznane (nowe) lądują na końcu (sort stabilny).
function applyOrder(items, order) {
  const pos = new Map(order.map((id, i) => [id, i]))
  return [...items].sort((a, b) => (pos.has(a.id) ? pos.get(a.id) : Infinity) - (pos.has(b.id) ? pos.get(b.id) : Infinity))
}
import { AppHeader } from './AppHeader'
import { AppFooter } from './AppFooter'
import { TuyaIntegration } from './TuyaIntegration'
import { SmartThingsIntegration } from './SmartThingsIntegration'
import { SmartDeviceCard } from './SmartDeviceCard'
import { EnergyReportExport } from './EnergyReportExport'
import { AddSmartDeviceModal } from './AddSmartDeviceModal'
import { ConfirmDialog } from './ConfirmDialog'
import { ErrorBoundary } from './ErrorBoundary'
import { useSmartDevices } from '../hooks/useSmartDevices'
import { getApiUrl } from '../lib/api'

/**
 * Widok „Inteligentne urządzenia" (?view=urzadzenia).
 * Panel poświadczeń Tuya + lista urządzeń ze statusem na żywo.
 * Sterowanie i wykresy dochodzą w kolejnych slice'ach.
 */
export const SmartDevicesView = () => {
  const [isOwner, setIsOwner] = useState(false)
  const {
    devices, statusById, loading, error,
    refreshStatus, add, rename, setActive, linkPlug, remove, sendCommand,
  } = useSmartDevices()
  const [showAdd, setShowAdd] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [order, setOrder] = useState(loadOrder)
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)
  const dragId = useRef(null)
  const [draggingId, setDraggingId] = useState(null)

  // Przeciąganie kafelków tylko na desktopie (na touch HTML5 DnD i tak nie działa).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    fetch(`${getApiUrl()}/api/household`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setIsOwner(!!d?.isOwner))
      .catch(() => {})
  }, [])

  const refreshOne = async () => { await refreshStatus() }

  // Urządzenia na podczerwień (Smart IR) to piloty — bez poboru mocy, wykresów i kosztów.
  const energyDevices = devices.filter((d) => !String(d.deviceType || '').startsWith('ir_'))
  // Gniazdka (do powiązania z pilotami IR — realny stan zestawu z poboru mocy).
  const plugs = devices.filter((d) => !d.deviceType || d.deviceType === 'plug')

  // „Zestaw": piloty IR powiązane z gniazdkiem chowamy z płaskiej listy i wyświetlamy
  // zagnieżdżone w kaflu gniazdka. Powiązanie liczy się tylko gdy gniazdko istnieje na liście.
  const plugIds = new Set(plugs.map((p) => p.id))
  const remotesByPlug = {}
  for (const d of devices) {
    if (String(d.deviceType || '').startsWith('ir_') && d.linkedPlugId && plugIds.has(d.linkedPlugId)) {
      (remotesByPlug[d.linkedPlugId] ||= []).push(d)
    }
  }
  const nestedIds = new Set(Object.values(remotesByPlug).flat().map((d) => d.id))
  const topLevel = applyOrder(devices.filter((d) => !nestedIds.has(d.id)), order)

  const handleDrop = (targetId) => {
    const dragged = dragId.current
    dragId.current = null
    setDraggingId(null)
    if (!dragged || dragged === targetId) return
    const ids = topLevel.map((d) => d.id)
    const from = ids.indexOf(dragged)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(to, 0, ids.splice(from, 1)[0])
    setOrder(ids)
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(ids)) } catch { /* brak miejsca — trudno */ }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <AppHeader activeView="urzadzenia" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel poświadczeń Tuya — pełna szerokość (owner-only, sam się ukrywa) */}
        <TuyaIntegration />

        {/* Panel SmartThings (OAuth-In) — status widoczny dla wszystkich, akcje owner-only */}
        <SmartThingsIntegration isOwner={isOwner} />

        {/* Sekcja urządzeń */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Urządzenia</h3>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Dodaj urządzenie
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : devices.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              {isOwner
                ? 'Brak urządzeń. Połącz konto Tuya powyżej i kliknij „Dodaj urządzenie".'
                : 'Właściciel gospodarstwa nie podpiął jeszcze żadnych urządzeń.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topLevel.map((device) => {
                const groupSize = (remotesByPlug[device.id] || []).length
                // Szerokość kafla zestawu = liczba elementów (gniazdko + piloty): 2 lub 3 kolumny.
                const span = groupSize === 0 ? ''
                  : groupSize === 1 ? 'sm:col-span-2 lg:col-span-2'
                  : 'sm:col-span-2 lg:col-span-3'
                return (
                <div
                  key={device.id}
                  onDragOver={isDesktop ? (e) => e.preventDefault() : undefined}
                  onDrop={isDesktop ? (e) => { e.preventDefault(); handleDrop(device.id) } : undefined}
                  className={`${span} ${draggingId === device.id ? 'opacity-50' : ''}`}
                >
                  {/* Uchwyt przeciągania — tylko desktop (nie koliduje z suwakami/przyciskami w kaflu) */}
                  {isDesktop && (
                    <div
                      draggable
                      onDragStart={(e) => { dragId.current = device.id; setDraggingId(device.id); e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => { dragId.current = null; setDraggingId(null) }}
                      title="Przeciągnij, aby zmienić kolejność"
                      className="flex justify-center -mb-1 text-slate-600 hover:text-indigo-400 cursor-move"
                    >
                      <GripHorizontal className="w-5 h-4" />
                    </div>
                  )}
                  <ErrorBoundary>
                    <SmartDeviceCard
                      device={device}
                      status={statusById[device.id]}
                      isOwner={isOwner}
                      plugs={plugs}
                      linkedRemotes={(remotesByPlug[device.id] || []).map((rd) => ({ device: rd, status: statusById[rd.id] }))}
                      onRefresh={refreshOne}
                      onRename={rename}
                      onToggleActive={setActive}
                      onLinkPlug={linkPlug}
                      onRemove={setRemoveTarget}
                      onSend={sendCommand}
                    />
                  </ErrorBoundary>
                </div>
                )
              })}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        </div>

        {/* Raport zużycia — tylko gniazdka z pomiarem (klima IR to pilot, bez poboru/kosztów) */}
        {energyDevices.length > 0 && (
          <div className="mt-6">
            <EnergyReportExport key={energyDevices.map((d) => d.id).join(',')} devices={energyDevices} />
          </div>
        )}
      </main>
      <AppFooter />

      {showAdd && (
        <AddSmartDeviceModal onClose={() => setShowAdd(false)} onAdd={add} />
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={async () => { const t = removeTarget; setRemoveTarget(null); if (t) await remove(t.id) }}
        title="Usunąć urządzenie?"
        description={
          removeTarget
            ? `„${removeTarget.displayName}" zniknie z aplikacji. W chmurze Tuya urządzenie pozostaje — możesz je dodać ponownie później.`
            : ''
        }
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
        variant="danger"
      />
    </div>
  )
}
