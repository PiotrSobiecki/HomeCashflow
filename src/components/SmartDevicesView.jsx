import { useState, useEffect } from 'react'
import { Plus, Loader2, Cpu } from 'lucide-react'
import { AppHeader } from './AppHeader'
import { AppFooter } from './AppFooter'
import { TuyaIntegration } from './TuyaIntegration'
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
    refreshStatus, add, rename, setActive, remove, sendCommand,
  } = useSmartDevices()
  const [showAdd, setShowAdd] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/household`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setIsOwner(!!d?.isOwner))
      .catch(() => {})
  }, [])

  const refreshOne = async () => { await refreshStatus() }

  // Klimy na podczerwień (Smart IR) to piloty — bez poboru mocy, wykresów i kosztów.
  const energyDevices = devices.filter((d) => d.deviceType !== 'ir_ac')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <AppHeader activeView="urzadzenia" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel poświadczeń Tuya — pełna szerokość (owner-only, sam się ukrywa) */}
        <TuyaIntegration />

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
              {devices.map((device) => (
                <ErrorBoundary key={device.id}>
                  <SmartDeviceCard
                    device={device}
                    status={statusById[device.id]}
                    isOwner={isOwner}
                    onRefresh={refreshOne}
                    onRename={rename}
                    onToggleActive={setActive}
                    onRemove={setRemoveTarget}
                    onSend={sendCommand}
                  />
                </ErrorBoundary>
              ))}
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
