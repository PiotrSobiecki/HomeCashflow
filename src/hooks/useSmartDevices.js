import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchSmartDevices, fetchSmartDevicesStatus,
  addSmartDevice, patchSmartDevice, deleteSmartDevice,
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

  const rename = useCallback(async (id, displayName) => {
    const updated = await patchSmartDevice(id, { displayName })
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)))
  }, [])

  const setActive = useCallback(async (id, isActive) => {
    const updated = await patchSmartDevice(id, { isActive })
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)))
  }, [])

  const remove = useCallback(async (id) => {
    await deleteSmartDevice(id)
    setDevices((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { devices, statusById, loading, error, reload, refreshStatus, add, rename, setActive, remove }
}
