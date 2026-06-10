import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Lekki error boundary — izoluje awarię pojedynczego poddrzewa (np. jednej karty),
 * żeby błąd renderu nie kładł całego widoku na biało.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-rose-300">Nie udało się wyświetlić tego elementu.</p>
              <p className="text-xs text-slate-500 mt-1 break-all">{String(this.state.error?.message || this.state.error)}</p>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
