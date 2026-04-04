import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Auth } from './components/Auth'
import { Dashboard } from './components/Dashboard'
import { InviteAccept } from './components/InviteAccept'
import { Loader2 } from 'lucide-react'

const AppContent = () => {
  const { user, loading } = useAuth()

  // Check for invite token in URL
  const params = new URLSearchParams(window.location.search)
  const inviteToken = params.get('invite')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Ładowanie...</p>
        </div>
      </div>
    )
  }

  if (inviteToken) {
    return user ? <InviteAccept token={inviteToken} /> : <Auth />
  }

  return user ? <Dashboard /> : <Auth />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
