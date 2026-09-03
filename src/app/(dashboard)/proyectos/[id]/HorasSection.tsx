'use client'

import { useState, useTransition } from 'react'
import { createHora, deleteHora } from '@/app/actions/notas'
import { Plus, Trash2, X, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Hora = { id: string; fecha: string; horas: number; nota: string | null }

export function HorasSection({ proyectoId, horas: initial, totalHoras }: { proyectoId: string; horas: Hora[]; totalHoras: number }) {
  const [horas, setHoras] = useState(initial)
  const [total, setTotal] = useState(totalHoras)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string, hrs: number) => {
    setHoras(prev => prev.filter(h => h.id !== id))
    setTotal(prev => prev - hrs)
    startTransition(() => { void deleteHora(id) })
  }

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('proyecto_id', proyectoId)
    const hrs = Number(fd.get('horas'))
    const newHora: Hora = { id: crypto.randomUUID(), fecha: fd.get('fecha') as string, horas: hrs, nota: fd.get('nota') as string || null }
    setHoras(prev => [newHora, ...prev])
    setTotal(prev => prev + hrs)
    setShowForm(false)
    startTransition(() => { void createHora(fd) })
  }

  return (
    <div className="card-flat">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <div className="section-header" style={{ marginBottom: 0 }}>Horas trabajadas</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Solo informativo — no afecta precios ni caja</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
            <Clock size={13} style={{ display: 'inline', marginRight: 3 }} />{total.toFixed(1)}h
          </span>
          <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setShowForm(true)}><Plus size={12} /></button>
        </div>
      </div>

      {horas.length === 0 && <p className="text-muted" style={{ fontSize: '0.82rem' }}>Sin registros.</p>}
      {horas.slice(0, 8).map(h => (
        <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-secondary)', width: 70, flexShrink: 0 }}>{format(new Date(h.fecha), 'd MMM', { locale: es })}</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600, width: 44, flexShrink: 0 }}>{h.horas}h</span>
          <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.nota || '—'}</span>
          <button className="btn btn-ghost" style={{ padding: '0.1rem 0.3rem', color: 'var(--text-muted)' }} onClick={() => handleDelete(h.id, h.horas)}><Trash2 size={11} /></button>
        </div>
      ))}

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <form className="modal" onSubmit={handleAdd} style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <span>Registrar horas</span>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input type="date" name="fecha" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="form-label">Horas</label>
                <input type="number" name="horas" step="0.5" min="0.5" required placeholder="2.5" />
              </div>
              <div className="form-group">
                <label className="form-label">Nota (opcional)</label>
                <input name="nota" placeholder="Ej: Configuré Supabase Auth" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
