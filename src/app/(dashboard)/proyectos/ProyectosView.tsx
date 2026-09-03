'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ExternalLink, AlertTriangle } from 'lucide-react'
import { deleteProyecto } from '@/app/actions/proyectos'
import { ProyectoForm } from './ProyectoForm'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { isPast, isWithinInterval, addDays, startOfDay } from 'date-fns'

const ESTADO_BADGE: Record<string, string> = {
  en_desarrollo: 'badge-accent', entregado: 'badge-ok',
  mantenimiento: 'badge-accent2', pausado: 'badge-muted',
}
const PAGO_BADGE: Record<string, string> = {
  pendiente: 'badge-muted', parcial: 'badge-warn', pagado: 'badge-ok', vencido: 'badge-danger',
}

type Proyecto = any
type Contacto = { id: string; nombre: string }

export function ProyectosView({ proyectos: initial, contactos }: { proyectos: Proyecto[]; contactos: Contacto[] }) {
  const [proyectos, setProyectos] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const now = new Date()

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return
    setProyectos(prev => prev.filter(p => p.id !== id))
    startTransition(() => { void deleteProyecto(id) })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Proyectos</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Nuevo</button>
      </div>

      {showForm && (
        <ProyectoForm
          contactos={contactos}
          initial={null}
          onClose={() => setShowForm(false)}
          onSaved={(p) => { setProyectos(prev => [p, ...prev]); setShowForm(false) }}
        />
      )}

      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Proyecto</th><th>Cliente</th><th>Estado</th>
              <th>Anticipo</th><th>Saldo</th><th>Entrega</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.length === 0 && (
              <tr><td colSpan={7} className="text-muted" style={{ padding: '1.5rem', textAlign: 'center' }}>Sin proyectos aún.</td></tr>
            )}
            {proyectos.map((p: Proyecto) => {
              const overdue = p.fecha_entrega_estimada && isPast(new Date(p.fecha_entrega_estimada)) && p.estado === 'en_desarrollo'
              const nearDue = p.fecha_entrega_estimada && isWithinInterval(new Date(p.fecha_entrega_estimada), {
                start: startOfDay(now), end: addDays(now, 5)
              }) && p.estado === 'en_desarrollo'
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Link href={`/proyectos/${p.id}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{p.nombre}</Link>
                      {p.es_practica && <span className="badge badge-muted" style={{ fontSize: '0.6rem' }}>Práctica</span>}
                      {p.url_produccion && <a href={p.url_produccion} target="_blank" rel="noopener noreferrer"><ExternalLink size={11} style={{ color: 'var(--text-secondary)' }} /></a>}
                    </div>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.82rem' }}>{p.contactos?.nombre || '—'}</td>
                  <td><span className={`badge ${ESTADO_BADGE[p.estado] || 'badge-muted'}`}>{p.estado.replace('_', ' ')}</span></td>
                  <td>
                    {p.anticipo_monto ? (
                      <div>
                        <div style={{ fontSize: '0.8rem' }}>Bs {Number(p.anticipo_monto).toFixed(0)}</div>
                        <span className={`badge ${PAGO_BADGE[p.anticipo_estado] || 'badge-muted'}`}>{p.anticipo_estado}</span>
                      </div>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    {p.saldo_monto ? (
                      <div>
                        <div style={{ fontSize: '0.8rem' }}>Bs {Number(p.saldo_monto).toFixed(0)}</div>
                        <span className={`badge ${PAGO_BADGE[p.saldo_estado] || 'badge-muted'}`}>{p.saldo_estado}</span>
                      </div>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td style={{ color: overdue ? 'var(--status-danger)' : nearDue ? 'var(--status-warn)' : 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {(overdue || nearDue) && <AlertTriangle size={11} style={{ display: 'inline', marginRight: 3 }} />}
                    {p.fecha_entrega_estimada ? format(new Date(p.fecha_entrega_estimada), 'd MMM', { locale: es }) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Link href={`/proyectos/${p.id}`} className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Ver</Link>
                      <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--status-danger)' }} onClick={() => handleDelete(p.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
