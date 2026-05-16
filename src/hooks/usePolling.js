import { useEffect, useRef } from 'react'

export function usePolling({ intervalMs, enabled, onTick, isBlocked }) {
  // wasHiddenRef pamięta że tab był ukryty — wraca widoczność wywołuje natychmiastowy tick
  const wasHiddenRef = useRef(
    typeof document !== 'undefined' ? !!document.hidden : false,
  )

  useEffect(() => {
    if (!enabled) return

    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      if (typeof isBlocked === 'function' && isBlocked()) return
      onTick()
    }, intervalMs)

    const onVisibility = () => {
      if (typeof document === 'undefined') return
      const hidden = !!document.hidden
      if (wasHiddenRef.current && !hidden) {
        if (typeof isBlocked === 'function' && isBlocked()) {
          // pomiń natychmiastowy tick, zwykły interval go nadrobi
        } else {
          onTick()
        }
      }
      wasHiddenRef.current = hidden
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs, enabled, onTick, isBlocked])
}
