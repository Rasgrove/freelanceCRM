'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, X, Clock } from 'lucide-react'
import { createHora, deleteHora } from '@/app/actions/notas'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Hora = any

export function HorasView({ horas: initial, proyectos, totalGeneral }: { horas: Hora[]; proyectos: any[]; totalGeneral: number }) {
  const [horas, setHoras] = useState(initial)
  const [total, setTotal] = useState(totalGeneral)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string, hrs: number) => {
    if (!confirm('¿Eliminar este registro?')) return
    setHoras((prev: Hora[]) => prev.filter((h: Hora) => h.id !== id))
    setTotal(prev => prev - hrs)
    startTransition(() => { void deleteHora(id) })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const hrs = Number(fd.get('horas'))
    const saved: Hora = {
      id: crypto.randomUUID(), fecha: fd.get('fecha'), horas: hrs,
      nota: fd.get('nota') || null, proyecto_id: fd.get('proyecto_id') || null,
      proyectos: proyectos.find(p => p.id === fd.get('proyecto_id')) ? { nombre: proyectos.find(p => p.id === fd.get('proyecto_id'))!.nombre } : null,
    }
    setHoras((prev: Hora[]) => [saved, ...prev])
    setTotal(prev => prev + hrs)
    setShowForm(false)
    startTransition(() => { void createHora(fd) })
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Horas trabajadas</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Solo informativo — no afecta precios ni caja</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
            <Clock size={16} style={{ display: 'inline', marginRight: 4 }} />{total.toFixed(1)}h total
          </span>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Registrar</button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <form className="modal" onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span>Registrar horas</span>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Proyecto</label>
                <select name="proyecto_id" defaultValue="">
                  <option value="">— Sin proyecto —</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input type="date" name="fecha" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">Horas *</label>
                  <input type="number" name="horas" step="0.5" min="0.5" required placeholder="2.0" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nota (opcional)</label>
                <input name="nota" placeholder="¿Qué hiciste?" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr><th>Fecha</th><th>Proyecto</th><th>Horas</th><th>Nota</th><th></th></tr>
          </thead>
          <tbody>
            {horas.length === 0 && <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>Sin registros.</td></tr>}
            {horas.map((h: Hora) => (
              <tr key={h.id}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{format(new Date(h.fecha), 'd MMM yyyy', { locale: es })}</td>
                <td style={{ fontSize: '0.82rem' }}>{h.proyectos?.nombre || <span className="text-muted">—</span>}</td>
                <td style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{Number(h.horas).toFixed(1)}h</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{h.nota || '—'}</td>
                <td><button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', color: 'var(--text-muted)' }} onClick={() => handleDelete(h.id, Number(h.horas))}><Trash2 size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
