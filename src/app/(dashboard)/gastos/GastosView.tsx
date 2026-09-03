'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { createGasto, deleteGasto } from '@/app/actions/gastos'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Gasto = { id: string; fecha: string; concepto: string; monto: number; categoria: string; periodicidad: string }
const CATEGORIAS = ['herramientas', 'transporte', 'dominio', 'publicidad', 'otro']
const PERIODICIDADES = ['unico', 'semanal', 'mensual']
const CAT_BADGE: Record<string, string> = { herramientas: 'badge-accent', transporte: 'badge-warn', dominio: 'badge-accent2', publicidad: 'badge-ok', otro: 'badge-muted' }

export function GastosView({ gastos: initial }: { gastos: Gasto[] }) {
  const [gastos, setGastos] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0)

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar gasto? También se eliminará su movimiento de caja asociado.')) return
    setGastos(prev => prev.filter(g => g.id !== id))
    startTransition(() => { void deleteGasto(id) })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const saved: Gasto = { id: crypto.randomUUID(), fecha: fd.get('fecha') as string, concepto: fd.get('concepto') as string, monto: Number(fd.get('monto')), categoria: fd.get('categoria') as string, periodicidad: fd.get('periodicidad') as string }
    setGastos(prev => [saved, ...prev])
    setShowForm(false)
    startTransition(() => { void createGasto(fd) })
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gastos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Total registrado: <span style={{ color: 'var(--status-danger)', fontWeight: 600 }}>Bs {total.toFixed(2)}</span></p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Nuevo gasto</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <form className="modal" onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span>Nuevo gasto</span>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input type="date" name="fecha" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">Monto (Bs) *</label>
                  <input type="number" name="monto" step="0.01" min="0.01" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Concepto *</label>
                <input name="concepto" required placeholder="Ej: Suscripción mensual Figma" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select name="categoria" defaultValue="otro">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Periodicidad</label>
                  <select name="periodicidad" defaultValue="unico">
                    {PERIODICIDADES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? 'Guardando...' : 'Registrar'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Periodicidad</th><th className="text-right">Monto</th><th></th></tr>
          </thead>
          <tbody>
            {gastos.length === 0 && <tr><td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>Sin gastos registrados.</td></tr>}
            {gastos.map(g => (
              <tr key={g.id}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{format(new Date(g.fecha), 'd MMM yyyy', { locale: es })}</td>
                <td style={{ fontWeight: 500 }}>{g.concepto}</td>
                <td><span className={`badge ${CAT_BADGE[g.categoria] || 'badge-muted'}`}>{g.categoria}</span></td>
                <td><span className="badge badge-muted">{g.periodicidad}</span></td>
                <td className="text-right" style={{ color: 'var(--status-danger)', fontWeight: 600 }}>Bs {Number(g.monto).toFixed(2)}</td>
                <td><button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', color: 'var(--status-danger)' }} onClick={() => handleDelete(g.id)}><Trash2 size={12} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
