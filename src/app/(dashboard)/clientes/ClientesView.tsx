'use client'

import { useState, useTransition } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { updateContactoEstado, deleteContacto } from '@/app/actions/contactos'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { List, LayoutGrid, Plus, Phone, AlertTriangle, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ContactoForm } from './ContactoForm'

type Contacto = {
  id: string; nombre: string; rubro: string | null; canal: string | null
  telefono: string | null; estado: string; proxima_accion: string | null
  fecha_proxima_accion: string | null; vigencia_propuesta: string | null
  fecha_contacto: string | null
}
type Estado = { key: string; label: string }

const CANAL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp', referido: 'Referido', flyer: 'Flyer', redes: 'Redes', otro: 'Otro'
}

export function ClientesView({ contactos: initial, estados }: { contactos: Contacto[]; estados: Estado[] }) {
  const [contactos, setContactos] = useState(initial)
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Contacto | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newEstado = destination.droppableId
    setContactos(prev => prev.map(c => c.id === draggableId ? { ...c, estado: newEstado } : c))
    startTransition(() => { updateContactoEstado(draggableId, newEstado) })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este contacto?')) return
    setContactos(prev => prev.filter(c => c.id !== id))
    startTransition(() => { deleteContacto(id) })
  }

  const overdueDate = (d: string | null) => d && new Date(d) < new Date()

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Clientes / Leads</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className={`btn ${view === 'kanban' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('kanban')}>
            <LayoutGrid size={14} /> Kanban
          </button>
          <button className={`btn ${view === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('table')}>
            <List size={14} /> Tabla
          </button>
          <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true) }}>
            <Plus size={14} /> Nuevo
          </button>
        </div>
      </div>

      {showForm && (
        <ContactoForm
          estados={estados}
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSaved={(c) => {
            if (editTarget) {
              setContactos(prev => prev.map(x => x.id === c.id ? c : x))
            } else {
              setContactos(prev => [c, ...prev])
            }
            setShowForm(false); setEditTarget(null)
          }}
        />
      )}

      {/* ===== KANBAN VIEW ===== */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {estados.map(est => {
              const cards = contactos.filter(c => c.estado === est.key)
              return (
                <div key={est.key} className={`kanban-col${est.key === 'perdido' ? ' lost' : ''}`}>
                  <div className="kanban-col-header">
                    <span style={{ fontSize: '0.68rem' }}>{est.label}</span>
                    <span>{cards.length}</span>
                  </div>
                  <Droppable droppableId={est.key}>
                    {(provided, snapshot) => (
                      <div
                        className="kanban-cards"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ background: snapshot.isDraggingOver ? 'var(--accent-dim)' : undefined }}
                      >
                        {cards.map((c, index) => (
                          <Draggable key={c.id} draggableId={c.id} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className={`kanban-card${snap.isDragging ? ' dragging' : ''}`}
                              >
                                <div className="kanban-card-name">{c.nombre}</div>
                                {c.rubro && <div className="kanban-card-meta">{c.rubro}</div>}
                                {c.telefono && (
                                  <div className="kanban-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                                    <Phone size={10} />{c.telefono}
                                  </div>
                                )}
                                {c.fecha_proxima_accion && (
                                  <div className="kanban-card-meta" style={{ marginTop: '0.2rem', color: overdueDate(c.fecha_proxima_accion) ? 'var(--status-danger)' : 'var(--status-warn)' }}>
                                    {overdueDate(c.fecha_proxima_accion) && <AlertTriangle size={10} style={{ display: 'inline', marginRight: '2px' }} />}
                                    {c.proxima_accion} — {format(new Date(c.fecha_proxima_accion), 'd MMM', { locale: es })}
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}>
                                  <Link href={`/clientes/${c.id}`} style={{ fontSize: '0.68rem', color: 'var(--accent)', textDecoration: 'underline' }}>
                                    Ver
                                  </Link>
                                  <button
                                    onClick={() => { setEditTarget(c); setShowForm(true) }}
                                    style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                  >Editar</button>
                                  <button
                                    onClick={() => handleDelete(c.id)}
                                    style={{ fontSize: '0.68rem', color: 'var(--status-danger)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                                  ><Trash2 size={10} /></button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}

      {/* ===== TABLE VIEW ===== */}
      {view === 'table' && (
        <div className="overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th><th>Rubro</th><th>Canal</th><th>Teléfono</th>
                <th>Estado</th><th>Próxima acción</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contactos.length === 0 && (
                <tr><td colSpan={7} className="text-muted" style={{ padding: '1.5rem', textAlign: 'center' }}>Sin contactos aún.</td></tr>
              )}
              {contactos.map(c => {
                const badgeMap: Record<string, string> = {
                  contactado: 'badge-muted', descubrimiento: 'badge-accent',
                  propuesta_enviada: 'badge-warn', contrato_firmado: 'badge-ok',
                  en_desarrollo: 'badge-accent', entregado: 'badge-ok',
                  mantenimiento: 'badge-accent2', perdido: 'badge-danger',
                }
                const labelMap: Record<string, string> = {
                  contactado: 'Contactado', descubrimiento: 'Descubrimiento',
                  propuesta_enviada: 'Propuesta', contrato_firmado: 'Contrato',
                  en_desarrollo: 'En dev', entregado: 'Entregado',
                  mantenimiento: 'Mant.', perdido: 'Perdido',
                }
                return (
                  <tr key={c.id}>
                    <td><Link href={`/clientes/${c.id}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{c.nombre}</Link></td>
                    <td className="text-muted">{c.rubro || '—'}</td>
                    <td>{c.canal ? CANAL_LABELS[c.canal] || c.canal : '—'}</td>
                    <td>{c.telefono || '—'}</td>
                    <td><span className={`badge ${badgeMap[c.estado] || 'badge-muted'}`}>{labelMap[c.estado] || c.estado}</span></td>
                    <td style={{ color: overdueDate(c.fecha_proxima_accion) ? 'var(--status-danger)' : 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {c.proxima_accion ? `${c.proxima_accion}${c.fecha_proxima_accion ? ' — ' + format(new Date(c.fecha_proxima_accion), 'd MMM', { locale: es }) : ''}` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => { setEditTarget(c); setShowForm(true) }}>Editar</button>
                        <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--status-danger)' }} onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
