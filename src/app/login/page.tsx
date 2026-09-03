'use client'

import { useActionState } from 'react'
import { signIn } from '@/app/actions/auth'
import { Lock, Mail } from 'lucide-react'

const initialState = { error: null as string | null }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '1rem',
    }}>
      {/* Decorative corner lines */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '40%', height: '2px', background: 'var(--accent)', opacity: 0.5 }} />
      <div style={{ position: 'fixed', top: 0, left: 0, width: '2px', height: '40%', background: 'var(--accent)', opacity: 0.5 }} />
      <div style={{ position: 'fixed', bottom: 0, right: 0, width: '40%', height: '2px', background: 'var(--accent-2)', opacity: 0.4 }} />
      <div style={{ position: 'fixed', bottom: 0, right: 0, width: '2px', height: '40%', background: 'var(--accent-2)', opacity: 0.4 }} />

      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Header block */}
        <div style={{
          background: 'var(--accent)',
          padding: '1.25rem 1.5rem',
          marginBottom: '0',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-on-accent)', lineHeight: 1.1 }}>
            FREELANCE
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(5,5,5,0.6)' }}>
            CRM PANEL
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent-border)',
          borderTop: 'none',
          padding: '1.75rem 1.5rem',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Acceso restringido — solo administrador
          </p>

          <form action={formAction}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={11} /> Email
                </span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="password">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Lock size={11} /> Contraseña
                </span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <div style={{
                background: 'var(--status-danger-dim)',
                border: '1px solid var(--status-danger)',
                color: 'var(--status-danger)',
                padding: '0.6rem 0.75rem',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                borderRadius: '2px',
              }}>
                {state.error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={pending}
              style={{ justifyContent: 'center', fontSize: '0.95rem' }}>
              {pending ? 'INGRESANDO...' : 'INGRESAR'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
