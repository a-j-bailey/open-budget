import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

function Root() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const win = window as unknown as { electron?: unknown }
    if (win.electron) {
      setReady(true)
      return
    }
    const pollMs = 50
    const giveUpMs = 3000
    let cancelled = false
    const deadline = Date.now() + giveUpMs
    const id = setInterval(() => {
      if (cancelled) return
      if (win.electron) {
        clearInterval(id)
        setReady(true)
        return
      }
      if (Date.now() >= deadline) {
        clearInterval(id)
        setError('Electron API not available. Run the app with "npm run dev" from the project folder (it should open in an Electron window), not in a browser.')
      }
    }, pollMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 480 }}>
        <h1 style={{ fontSize: 18, marginBottom: 8 }}>Household Budget</h1>
        <p style={{ color: '#b91c1c' }}>{error}</p>
      </div>
    )
  }
  if (!ready) {
    return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Loading…</div>
  }
  return (
    <HashRouter>
      <App />
    </HashRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
