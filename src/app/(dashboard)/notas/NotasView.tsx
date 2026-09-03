'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { createNota, deleteNota } from '@/app/actions/notas'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Nota = any

export function NotasView({ notas: initial, contactos, proyectos }: { notas: Nota[]; contactos: any[]; proyectos: any[] }) {
  const [notas, setNotas] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar nota?')) return
    setNotas((prev: Nota[]) => prev.filter((n: Nota) => n.id !== id))
    startTransition(() => { void deleteNota(id) })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const saved: Nota = {
      id: crypto.randomUUID(), texto: fd.get('texto'), fecha: fd.get('fecha'),
      contacto_id: fd.get('contacto_id') || null, proyecto_id: fd.get('proyecto_id') || null,
      contactos: contactos.find(c => c.id === fd.get('contacto_id')) ? { nombre: contactos.find(c => c.id === fd.get('contacto_id'))!.nombre } : null,
      proyectos: proyectos.find(p => p.id === fd.get('proyecto_id')) ? { nombre: proyectos.find(p => p.id === fd.get('proyecto_id'))!.nombre } : null,
    }
    setNotas((prev: Nota[]) => [saved, ...prev])
    setShowForm(false)
    startTransition(() => { void createNota(fd) })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notas</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Nueva nota</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <form className="modal" onSubmit={handleSubmit} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span>Nueva nota</span>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nota *</label>
                <textarea name="texto" required rows={4} placeholder="Escribí tu nota..." />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input type="date" name="fecha" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Asociar a cliente (opcional)</label>
                <select name="contacto_id" defaultValue="">
                  <option value="">— Ninguno —</option>
                  {contactos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Asociar a proyecto (opcional)</label>
                <select name="proyecto_id" defaultValue="">
                  <option value="">— Ninguno —</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>Guardar</button>
            </div>
          </form>
        </div>
      )}

      {notas.length === 0 && <p className="text-muted">Sin notas registradas.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {notas.map((n: Nota) => (
          <div key={n.id} className="card-flat" style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                {n.fecha ? format(new Date(n.fecha), 'd MMM yyyy', { locale: es }) : ''}
                {n.contactos?.nombre ? <span style={{ marginLeft: '0.5rem' }}>· <span style={{ color: 'var(--accent)' }}>{n.contactos.nombre}</span></span> : null}
                {n.proyectos?.nombre ? <span style={{ marginLeft: '0.5rem' }}>· <span style={{ color: 'var(--accent-2)' }}>{n.proyectos.nombre}</span></span> : null}
              </div>
              <div style={{ fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>{n.texto}</div>
            </div>
            <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', color: 'var(--text-muted)', alignSelf: 'flex-start' }} onClick={() => handleDelete(n.id)}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
