import { useState, useEffect } from 'react'
import { Users, Mail, Crown, UserPlus, Loader2, X, Check, UserMinus, LogOut, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getApiUrl } from '../lib/api'

export const HouseholdMembers = () => {
  const { user } = useAuth()
  const [household, setHousehold] = useState(null)
  const [members, setMembers] = useState([])
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [isOwner, setIsOwner] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const apiUrl = getApiUrl()

  const fetchHousehold = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/household`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setHousehold(data.household)
        setMembers(data.members)
        setPendingInvitations(data.pendingInvitations || [])
        setIsOwner(data.isOwner)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHousehold() }, [])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`${apiUrl}/api/household/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      if (res.ok) {
        const { invitation } = await res.json()
        const inviteLink = `${window.location.origin}?invite=${invitation.token}`
        setMessage(`Zaproszenie utworzone! Link: ${inviteLink}`)
        setInviteEmail('')
        fetchHousehold()
      } else {
        const body = await res.json()
        setError(body.error || 'Nie udało się wysłać zaproszenia')
      }
    } catch {
      setError('Błąd połączenia')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Czy na pewno chcesz usunąć ${memberName} z gospodarstwa?`)) return

    try {
      const res = await fetch(`${apiUrl}/api/household/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setMessage(`${memberName} został usunięty`)
        fetchHousehold()
      } else {
        const body = await res.json()
        setError(body.error || 'Nie udało się usunąć członka')
      }
    } catch {
      setError('Błąd połączenia')
    }
  }

  const handleLeave = async () => {
    if (!confirm('Czy na pewno chcesz opuścić to gospodarstwo? Otrzymasz nowe, puste gospodarstwo.')) return

    try {
      const res = await fetch(`${apiUrl}/api/household/leave`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const body = await res.json()
        setError(body.error || 'Nie udało się opuścić gospodarstwa')
      }
    } catch {
      setError('Błąd połączenia')
    }
  }

  const handleDeleteHousehold = async () => {
    setShowDeleteConfirm(false)
    try {
      const res = await fetch(`${apiUrl}/api/household`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const body = await res.json()
        setError(body.error || 'Nie udało się usunąć gospodarstwa')
      }
    } catch {
      setError('Błąd połączenia')
    }
  }

  if (loading) return null

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">Gospodarstwo domowe</h3>
      </div>

      {/* Members list */}
      <div className="space-y-2 mb-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-slate-900/30 rounded-xl">
            <div className="flex items-center gap-3">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-indigo-400 text-sm font-medium">
                    {member.name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm text-white">{member.name || member.email}</p>
                <p className="text-xs text-slate-400">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {household?.owner_id === member.id && (
                <div className="flex items-center gap-1 text-amber-400">
                  <Crown className="w-4 h-4" />
                  <span className="text-xs">Właściciel</span>
                </div>
              )}
              {/* Owner can remove non-owner members */}
              {isOwner && member.id !== user?.id && (
                <button
                  onClick={() => handleRemoveMember(member.id, member.name || member.email)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Usuń z gospodarstwa"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2">Oczekujące zaproszenia:</p>
          {pendingInvitations.map((inv) => (
            <div key={inv.id} className="flex items-center gap-2 py-1.5 px-3 bg-amber-500/10 rounded-lg mb-1">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm text-amber-300">{inv.email}</span>
            </div>
          ))}
        </div>
      )}

      {/* Invite form (owner only) */}
      {isOwner && (
        <form onSubmit={handleInvite} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email osoby do zaproszenia"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Zaproś
          </button>
        </form>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!isOwner && members.length > 1 && (
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-slate-600 rounded-xl text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            Opuść gospodarstwo
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-600 rounded-xl text-sm transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Usuń gospodarstwo
          </button>
        )}
      </div>

      {/* Modal potwierdzenia usunięcia */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-rose-500/20 p-2.5 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <h4 className="text-lg font-semibold text-white">Usunąć gospodarstwo?</h4>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              Czy na pewno chcesz usunąć całe gospodarstwo? Wszyscy członkowie stracą dostęp do wspólnych danych finansowych. Tej operacji nie można cofnąć.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-all"
              >
                Anuluj
              </button>
              <button
                onClick={handleDeleteHousehold}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all"
              >
                Tak, usuń
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-400 break-all">{message}</span>
        </div>
      )}
      {error && (
        <div className="mt-3 p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-2">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-sm text-rose-400">{error}</span>
        </div>
      )}
    </div>
  )
}
