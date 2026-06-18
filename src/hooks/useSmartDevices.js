import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchSmartDevices, fetchSmartDevicesStatus,
  addSmartDevice, addSmartThingsDevice, patchSmartDevice, deleteSmartDevice, sendDeviceCommands, sendStCommand, sendStSetting,
} from '../lib/api'
import { usePolling } from './usePolling'

/**
 * Stan urządzeń Tuya gospodarstwa: lista + status na żywo (polling 30 s gdy zakładka aktywna).
 */
export function useSmartDevices() {
  const [devices, setDevices] = useState([])
  const [statusById, setStatusById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const inFlight = useRef(false)

  const reload = useCallback(async () => {
    try {
      const list = await fetchSmartDevices()
      setDevices(list)
      setError('')
    } catch (err) {
      setError(err?.message || 'Nie udało się pobrać urządzeń')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshStatus = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const statuses = await fetchSmartDevicesStatus()
      setStatusById((prev) => {
        const next = { ...prev }
        for (const s of statuses) next[s.id] = s
        return next
      })
    } catch {
      // status to nie source of truth — cicho, karta pokaże "brak odświeżenia"
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  // Po załadowaniu listy odśwież status raz od razu.
  useEffect(() => {
    if (!loading && devices.length > 0) refreshStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, devices.length])

  usePolling({
    intervalMs: 30000,
    enabled: devices.length > 0,
    onTick: refreshStatus,
  })

  const add = useCallback(async (tuyaDeviceId) => {
    await addSmartDevice(tuyaDeviceId)
    await reload()
  }, [reload])

  const addSt = useCallback(async (externalDeviceId, displayName) => {
    await addSmartThingsDevice(externalDeviceId, displayName)
    await reload()
  }, [reload])

  const rename = useCallback(async (id, displayName) => {
    const updated = await patchSmartDevice(id, { displayName })
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)))
  }, [])

  const setActive = useCallback(async (id, isActive) => {
    const updated = await patchSmartDevice(id, { isActive })
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)))
  }, [])

  // Własne nazwy programów pralki (mapa { kodKursu: nazwa }). Etykiety renderuje backend
  // w status.settings, więc po zapisie odśwież status, żeby zobaczyć nowe nazwy.
  const saveCycleLabels = useCallback(async (id, cycleLabels) => {
    const updated = await patchSmartDevice(id, { cycleLabels })
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)))
    refreshStatus()
  }, [refreshStatus])

  // Powiązanie urządzenia IR z gniazdkiem (plugId=null rozłącza). Po zmianie odśwież status.
  const linkPlug = useCallback(async (id, plugId) => {
    const updated = await patchSmartDevice(id, { linkedPlugId: plugId })
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)))
    refreshStatus()
  }, [refreshStatus])

  const remove = useCallback(async (id) => {
    await deleteSmartDevice(id)
    setDevices((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const sendCommand = useCallback(async (deviceId, commands) => {
    await sendDeviceCommands(deviceId, commands)
    // Optimistic: nadpisz raw w statusie, potem potwierdź realnym odczytem.
    setStatusById((prev) => {
      const s = prev[deviceId]
      if (!s) return prev
      const raw = { ...(s.raw || {}) }
      const ac = s.ac ? { ...s.ac } : null
      for (const cmd of commands) {
        raw[cmd.code] = cmd.value
        if (ac && cmd.code in ac) ac[cmd.code] = cmd.value
      }
      const switchOn = ac ? ac.power === 1 : (raw.switch_1 ?? raw.switch ?? raw.switch_led ?? s.switchOn)
      return { ...prev, [deviceId]: { ...s, raw, ...(ac ? { ac } : {}), switchOn } }
    })
    setTimeout(refreshStatus, 1200)
  }, [refreshStatus])

  // Sterowanie urządzeniem SmartThings (start/pauza/stop). Po wysłaniu odśwież status
  // (ST aktualizuje machineState z opóźnieniem — dajemy mu chwilę).
  const sendSt = useCallback(async (deviceId, action) => {
    await sendStCommand(deviceId, action)
    setTimeout(refreshStatus, 1500)
  }, [refreshStatus])

  // Zmiana ustawienia cyklu pralki ST (temperatura/wirowanie/płukanie/namaczanie/program).
  // Optimistic: od razu nadpisz wartość w settings, potem potwierdź realnym odczytem.
  const sendStSettingCmd = useCallback(async (deviceId, setting, value) => {
    await sendStSetting(deviceId, setting, value)
    setStatusById((prev) => {
      const s = prev[deviceId]
      if (!s?.settings?.[setting]) return prev
      const settings = { ...s.settings, [setting]: { ...s.settings[setting], value: String(value) } }
      return { ...prev, [deviceId]: { ...s, settings } }
    })
    setTimeout(refreshStatus, 1500)
  }, [refreshStatus])

  return { devices, statusById, loading, error, reload, refreshStatus, add, addSt, rename, setActive, linkPlug, saveCycleLabels, remove, sendCommand, sendSt, sendStSetting: sendStSettingCmd }
}
