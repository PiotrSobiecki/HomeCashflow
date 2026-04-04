import { createContext, useContext, useEffect, useState } from 'react'
import { getApiUrl, saveFinanceDataOnServer } from '../lib/api'

const GUEST_STORAGE_KEY = 'homecashflow-guest-data'
const GUEST_MODE_KEY = 'homecashflow-guest-mode'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    const guestMode = localStorage.getItem(GUEST_MODE_KEY)
    if (guestMode === 'true') {
      setIsGuest(true)
      setUser({ id: 'guest', email: 'guest@demo.local', name: 'Gość' })
      setLoading(false)
      return
    }

    const checkSession = async () => {
      try {
        const apiUrl = getApiUrl()
        const res = await fetch(`${apiUrl}/api/auth/me`, {
          credentials: 'include'
        })

        if (res.ok) {
          const { user } = await res.json()
          setUser(user)

          // Migrate guest data if present
          const guestData = localStorage.getItem(GUEST_STORAGE_KEY)
          if (guestData) {
            try {
              await saveFinanceDataOnServer(JSON.parse(guestData))
            } catch {
              // migration failed silently — data stays in localStorage for retry
            }
            localStorage.removeItem(GUEST_STORAGE_KEY)
            localStorage.removeItem(GUEST_MODE_KEY)
          }
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const signInWithGoogle = () => {
    const apiUrl = getApiUrl()
    window.location.href = `${apiUrl}/api/auth/google`
  }

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_MODE_KEY, 'true')
    setIsGuest(true)
    setUser({ id: 'guest', email: 'guest@demo.local', name: 'Gość' })
  }

  const signOut = async () => {
    if (isGuest) {
      localStorage.removeItem(GUEST_MODE_KEY)
      setIsGuest(false)
      setUser(null)
      return
    }

    try {
      const apiUrl = getApiUrl()
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch {
      // ignore
    }
    setUser(null)
  }

  const value = {
    user,
    loading,
    isGuest,
    signInWithGoogle,
    signOut,
    continueAsGuest
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
