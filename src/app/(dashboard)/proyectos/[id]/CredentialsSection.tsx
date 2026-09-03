'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Copy, Plus, Trash2, Check, X } from 'lucide-react'
import { listCredentials, revealCredential, createCredential, deleteCredential } from '@/app/actions/credentials'
import { useEffect } from 'react'

type Credential = { id: string; servicio: string; notas: string | null; created_at: string }

const SERVICIOS = ['supabase', 'netlify', 'cloudinary', 'github', 'otro']

export function CredentialsSection({ proyectoId }: { proyectoId: string }) {
  const [creds, setCreds] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, { usuario?: string; password?: string; timer?: ReturnType<typeof setTimeout> }>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    listCredentials(proyectoId).then(({ data }) => { setCreds(data ?? []); setLoading(false) })
  }, [proyectoId])

  const reveal = (id: string, field: 'usuario' | 'password') => {
    startTransition(async () => {
      const { value, error } = await revealCredential(id, field)
      if (error || !value) return
      setRevealed(prev => {
        // Clear previous timer if any
        if (prev[id]?.timer) clearTimeout(prev[id].timer)
        const timer = setTimeout(() => {
          setRevealed(p => ({ ...p, [id]: { ...p[id], [field]: undefined, timer: undefined } }))
        }, 30000)
        return { ...prev, [id]: { ...prev[id], [field]: value, timer } }
      })
    })
  }

  const copy = (id: string, field: 'usuario' | 'password') => {
    startTransition(async () => {
      // If already revealed, copy from state
      const existing = revealed[id]?.[field]
      if (existing) {
        await navigator.clipboard.writeText(existing)
      } else {
        const { value, error } = await revealCredential(id, field)
        if (error || !value) return
        await navigator.clipboard.writeText(value)
      }
      setCopied(`${id}-${field}`)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta credencial?')) return
    setCreds(prev => prev.filter(c => c.id !== id))
    startTransition(() => { void deleteCredential(id, proyectoId) })
  }

  const handleAddCred = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setFormError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createCredential(proyectoId, fd)
      if (result?.error) { setFormError(result.error); return }
      const res = await listCredentials(proyectoId)
      setCreds(res.data ?? [])
      setShowForm(false)
    })
  }

  function FieldRow({ credId, label, field }: { credId: string; label: string; field: 'usuario' | 'password' }) {
    const val = revealed[credId]?.[field]
    const cpKey = `${credId}-${field}`
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.65rem', width: 72, flexShrink: 0 }}>{label}</span>
        <span className={val ? 'font-mono' : 'masked'} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {val ?? '••••••••••••'}
        </span>
        <button
          className="btn btn-ghost" style={{ padding: '0.2rem 0.35rem' }}
          onClick={() => val ? setRevealed(p => ({ ...p, [credId]: { ...p[credId], [field]: undefined } })) : reveal(credId, field)}
          title={val ? 'Ocultar' : 'Revelar (30s)'}
        >
          {val ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
        <button
          className="btn btn-ghost" style={{ padding: '0.2rem 0.35rem', color: copied === cpKey ? 'var(--status-ok)' : undefined }}
          onClick={() => copy(credId, field)}
          title="Copiar"
        >
          {copied === cpKey ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    )
  }

  return (
    <div className="card-flat">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>Credenciales de servicios</div>
        <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => setShowForm(true)}>
          <Plus size={12} /> Agregar
        </button>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Cifradas con AES-256 · Solo visibles al revelar explícitamente · Auto-ocultan en 30s
      </p>

      {loading && <p className="text-muted" style={{ fontSize: '0.82rem' }}>Cargando...</p>}

      {!loading && creds.length === 0 && (
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>Sin credenciales registradas.</p>
      )}

      {creds.map(c => (
        <div key={c.id} style={{
          border: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem', marginBottom: '0.5rem',
          borderLeft: '2px solid var(--accent-2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--accent-2)' }}>{c.servicio}</span>
            <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', color: 'var(--status-danger)' }} onClick={() => handleDelete(c.id)}>
              <Trash2 size={12} />
            </button>
          </div>
          <FieldRow credId={c.id} label="Usuario" field="usuario" />
          <FieldRow credId={c.id} label="Password" field="password" />
          {c.notas && <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.notas}</div>}
        </div>
      ))}

      {/* Add credential form */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <form className="modal" onSubmit={handleAddCred} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span>Agregar credencial</span>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Servicio *</label>
                <select name="servicio" required>
                  {SERVICIOS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Usuario / Email *</label>
                <input name="usuario" required autoComplete="off" placeholder="usuario@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña *</label>
                <input name="password" type="password" required autoComplete="new-password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Notas (opcional)</label>
                <input name="notas" placeholder="Ej: cuenta free tier, región us-east-1" />
              </div>
              {formError && <div style={{ color: 'var(--status-danger)', fontSize: '0.82rem' }}>{formError}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? 'Cifrando...' : 'Guardar cifrado'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
