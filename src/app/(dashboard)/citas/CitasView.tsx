'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, X, Edit2 } from 'lucide-react'
import { createCita, deleteCita, updateCita } from '@/app/actions/citas'
import { format, isPast } from 'date-fns'
import { es } from 'date-fns/locale'

type Cita = any
const TIPOS = ['llamada', 'reunion', 'entrega', 'capacitacion', 'otro']
const TIPO_LABELS: Record<string, string> = { llamada: '📞 Llamada', reunion: '🤝 Reunión', entrega: '📦 Entrega', capacitacion: '🎓 Capacitación', otro: '📌 Otro' }

export function CitasView({ citas: initial, contactos, proyectos }: { citas: Cita[]; contactos: any[]; proyectos: any[] }) {
  const [citas, setCitas] = useState<Cita[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Cita | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar cita?')) return
    setCitas(prev => prev.filter(c => c.id !== id))
    startTransition(() => { void deleteCita(id) })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const saved: Cita = {
      id: editTarget?.id ?? crypto.randomUUID(),
      fecha_hora: fd.get('fecha_hora'),
      tipo: fd.get('tipo'),
      notas: fd.get('notas'),
      contacto_id: fd.get('contacto_id'),
      proyecto_id: fd.get('proyecto_id'),
      contactos: contactos.find(c => c.id === fd.get('contacto_id')) ? { nombre: contactos.find(c => c.id === fd.get('contacto_id'))!.nombre } : null,
      proyectos: proyectos.find(p => p.id === fd.get('proyecto_id')) ? { nombre: proyectos.find(p => p.id === fd.get('proyecto_id'))!.nombre } : null,
    }
    if (editTarget) setCitas(prev => prev.map(c => c.id === editTarget.id ? saved : c))
    else setCitas(prev => [saved, ...prev].sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()))
    setShowForm(false); setEditTarget(null)
    startTransition(() => { void (editTarget ? updateCita(editTarget.id, fd) : createCita(fd)) })
  }

  const upcoming = citas.filter(c => !isPast(new Date(c.fecha_hora)))
  const past = citas.filter(c => isPast(new Date(c.fecha_hora)))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Citas</h1>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true) }}><Plus size={14} /> Nueva cita</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <form className="modal" onSubmit={handleSubmit} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span>{editTarget ? 'Editar cita' : 'Nueva cita'}</span>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Fecha y hora *</label>
                <input type="datetime-local" name="fecha_hora" required defaultValue={editTarget?.fecha_hora ? editTarget.fecha_hora.slice(0, 16) : ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select name="tipo" defaultValue={editTarget?.tipo ?? 'llamada'}>
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cliente relacionado (opcional)</label>
                <select name="contacto_id" defaultValue={editTarget?.contacto_id ?? ''}>
                  <option value="">— Ninguno —</option>
                  {contactos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Proyecto relacionado (opcional)</label>
                <select name="proyecto_id" defaultValue={editTarget?.proyecto_id ?? ''}>
                  <option value="">— Ninguno —</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea name="notas" rows={2} defaultValue={editTarget?.notas ?? ''} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditTarget(null) }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>Guardar</button>
            </div>
          </form>
        </div>
      )}

      {[{ label: 'Próximas', items: upcoming }, { label: 'Pasadas', items: past }].map(({ label, items }) => (
        <div key={label} style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">{label} ({items.length})</div>
          {items.length === 0 && <p className="text-muted" style={{ fontSize: '0.82rem' }}>Sin citas.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `3px solid ${label === 'Próximas' ? 'var(--accent)' : 'var(--text-muted)'}` }}>
                <div style={{ minWidth: 52, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: label === 'Próximas' ? 'var(--accent)' : 'var(--text-muted)', lineHeight: 1 }}>
                    {format(new Date(c.fecha_hora), 'd')}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {format(new Date(c.fecha_hora), 'MMM', { locale: es })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {format(new Date(c.fecha_hora), 'HH:mm')} — {TIPO_LABELS[c.tipo] || c.tipo}
                  </div>
                  {(c.contactos?.nombre || c.proyectos?.nombre) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {c.contactos?.nombre}{c.contactos?.nombre && c.proyectos?.nombre ? ' · ' : ''}{c.proyectos?.nombre}
                    </div>
                  )}
                  {c.notas && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{c.notas}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem' }} onClick={() => { setEditTarget(c); setShowForm(true) }}><Edit2 size={12} /></button>
                  <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', color: 'var(--status-danger)' }} onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
