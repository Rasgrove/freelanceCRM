'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Edit2, X, TrendingUp, TrendingDown } from 'lucide-react'
import { createMovimiento, updateMovimiento, deleteMovimiento } from '@/app/actions/caja'
import { generarMantenimiento } from '@/app/actions/proyectos'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Movimiento = any

const ORIGEN_BADGE: Record<string, string> = {
  proyecto: 'badge-ok', gasto: 'badge-danger', mantenimiento: 'badge-accent2', manual: 'badge-muted'
}

export function CajaView({ movimientos: initial, saldoActual: initialSaldo }: { movimientos: Movimiento[]; saldoActual: number }) {
  const [movimientos, setMovimientos] = useState(initial)
  const [saldo, setSaldo] = useState(initialSaldo)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Movimiento | null>(null)
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3000) }

  const handleDelete = (id: string, tipo: string, monto: number, origen: string) => {
    if (origen !== 'manual') { flash('Solo se pueden eliminar movimientos manuales.'); return }
    if (!confirm('¿Eliminar este movimiento manual?')) return
    setMovimientos((prev: Movimiento[]) => prev.filter((m: Movimiento) => m.id !== id))
    setSaldo(prev => tipo === 'ingreso' ? prev - monto : prev + monto)
    startTransition(() => { void deleteMovimiento(id) })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const tipo = fd.get('tipo') as string
    const monto = Number(fd.get('monto'))
    if (editTarget) {
      const diff = (tipo === 'ingreso' ? monto : -monto) - (editTarget.tipo === 'ingreso' ? editTarget.monto : -editTarget.monto)
      setSaldo(prev => prev + diff)
      setMovimientos((prev: Movimiento[]) => prev.map((m: Movimiento) => m.id === editTarget.id ? { ...m, fecha: fd.get('fecha'), tipo, monto, concepto: fd.get('concepto') } : m))
      startTransition(() => { void updateMovimiento(editTarget.id, fd) })
    } else {
      const saved: Movimiento = { id: crypto.randomUUID(), fecha: fd.get('fecha'), tipo, monto, concepto: fd.get('concepto'), origen: 'manual' }
      setMovimientos((prev: Movimiento[]) => [saved, ...prev])
      setSaldo(prev => tipo === 'ingreso' ? prev + monto : prev - monto)
      startTransition(() => { void createMovimiento(fd) })
    }
    setShowForm(false); setEditTarget(null)
  }

  const handleGenerarMant = () => {
    startTransition(async () => {
      const result = await generarMantenimiento()
      if (result.error) flash(result.error)
      else flash(`Mantenimiento generado: ${result.generados ?? 0} movimiento(s) nuevo(s). Recarga para ver.`)
    })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Flujo de caja</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={handleGenerarMant} disabled={isPending}>
            ↻ Generar mantenimiento
          </button>
          <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true) }}><Plus size={14} /> Movimiento manual</button>
        </div>
      </div>

      {msg && <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)', padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{msg}</div>}

      {/* Saldo */}
      <div style={{
        background: saldo >= 0 ? 'var(--accent)' : 'var(--status-danger)',
        color: saldo >= 0 ? 'var(--text-on-accent)' : '#fff',
        padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      }}>
        {saldo >= 0 ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>Saldo actual</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>
            {saldo < 0 ? '–' : ''}Bs {Math.abs(saldo).toFixed(2)}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <form className="modal" onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span>{editTarget ? 'Editar movimiento' : 'Movimiento manual'}</span>
              <button type="button" onClick={() => { setShowForm(false); setEditTarget(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input type="date" name="fecha" required defaultValue={editTarget?.fecha ?? new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo *</label>
                  <select name="tipo" defaultValue={editTarget?.tipo ?? 'ingreso'}>
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Monto (Bs) *</label>
                <input type="number" name="monto" step="0.01" min="0.01" required defaultValue={editTarget?.monto ?? ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Concepto *</label>
                <input name="concepto" required defaultValue={editTarget?.concepto ?? ''} placeholder="Descripción del movimiento" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditTarget(null) }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr><th>Fecha</th><th>Concepto</th><th>Origen</th><th className="text-right">Ingreso</th><th className="text-right">Egreso</th><th></th></tr>
          </thead>
          <tbody>
            {movimientos.length === 0 && <tr><td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>Sin movimientos.</td></tr>}
            {movimientos.map((m: Movimiento) => (
              <tr key={m.id}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{format(new Date(m.fecha), 'd MMM yyyy', { locale: es })}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  {m.concepto}
                  {m.proyectos?.nombre ? <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>· {m.proyectos.nombre}</span> : null}
                </td>
                <td><span className={`badge ${ORIGEN_BADGE[m.origen] || 'badge-muted'}`}>{m.origen}</span></td>
                <td className="text-right" style={{ color: 'var(--status-ok)', fontWeight: m.tipo === 'ingreso' ? 600 : 400 }}>
                  {m.tipo === 'ingreso' ? `Bs ${Number(m.monto).toFixed(2)}` : ''}
                </td>
                <td className="text-right" style={{ color: 'var(--status-danger)', fontWeight: m.tipo === 'egreso' ? 600 : 400 }}>
                  {m.tipo === 'egreso' ? `Bs ${Number(m.monto).toFixed(2)}` : ''}
                </td>
                <td>
                  {m.origen === 'manual' && (
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <button className="btn btn-ghost" style={{ padding: '0.1rem 0.3rem' }} onClick={() => { setEditTarget(m); setShowForm(true) }}><Edit2 size={11} /></button>
                      <button className="btn btn-ghost" style={{ padding: '0.1rem 0.3rem', color: 'var(--status-danger)' }} onClick={() => handleDelete(m.id, m.tipo, Number(m.monto), m.origen)}><Trash2 size={11} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
