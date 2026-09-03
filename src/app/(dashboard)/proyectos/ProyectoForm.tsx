'use client'

import { useState, useTransition } from 'react'
import { createProyecto, updateProyecto } from '@/app/actions/proyectos'
import { X } from 'lucide-react'

type Contacto = { id: string; nombre: string }
type Proyecto = any

const ESTADOS = ['en_desarrollo', 'entregado', 'mantenimiento', 'pausado']
const PAGO_ESTADOS = ['pendiente', 'parcial', 'pagado', 'vencido']
const METODOS_PAGO = ['QR Simple', 'Transferencia', 'Tigo Money', 'Efectivo', 'Otro']

export function ProyectoForm({ contactos, initial, onClose, onSaved }: {
  contactos: Contacto[]; initial: Proyecto | null
  onClose: () => void; onSaved: (p: Proyecto) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [esPractica, setEsPractica] = useState(initial?.es_practica ?? false)
  const [estadoValue, setEstadoValue] = useState(initial?.estado ?? 'en_desarrollo')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('es_practica', String(esPractica))

    startTransition(async () => {
      const result = initial ? await updateProyecto(initial.id, fd) : await createProyecto(fd)
      if (result?.error) { setError(result.error); return }

      const saved: Proyecto = {
        id: (result as any).id ?? initial?.id ?? crypto.randomUUID(),
        nombre: fd.get('nombre'),
        estado: fd.get('estado'),
        es_practica: esPractica,
        costo_total: fd.get('costo_total') ? Number(fd.get('costo_total')) : null,
        anticipo_monto: fd.get('anticipo_monto') ? Number(fd.get('anticipo_monto')) : null,
        anticipo_estado: fd.get('anticipo_estado'),
        saldo_monto: fd.get('saldo_monto') ? Number(fd.get('saldo_monto')) : null,
        saldo_estado: fd.get('saldo_estado'),
        fecha_entrega_estimada: fd.get('fecha_entrega_estimada') || null,
        url_produccion: fd.get('url_produccion') || null,
        contactos: contactos.find(c => c.id === fd.get('contacto_id')) ? { nombre: contactos.find(c => c.id === fd.get('contacto_id'))!.nombre } : null,
        monto_mantenimiento: fd.get('monto_mantenimiento') ? Number(fd.get('monto_mantenimiento')) : null,
        modo_cobro_mantenimiento: fd.get('modo_cobro_mantenimiento') || null,
        plataforma_deploy: fd.get('plataforma_deploy') || null,
      }
      onSaved(saved)
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit} style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <span>{initial ? 'Editar proyecto' : 'Nuevo proyecto'}</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre del proyecto *</label>
              <input name="nombre" required defaultValue={initial?.nombre} />
            </div>
            <div className="form-group">
              <label className="form-label">Cliente asociado</label>
              <select name="contacto_id" defaultValue={initial?.contacto_id ?? ''}>
                <option value="">— Sin cliente —</option>
                {contactos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select name="estado" value={estadoValue} onChange={e => setEstadoValue(e.target.value)}>
                {ESTADOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">URL en producción</label>
              <input name="url_produccion" type="url" defaultValue={initial?.url_produccion ?? ''} placeholder="https://" />
            </div>
            <div className="form-group">
              <label className="form-label">Tecnologías (separadas por coma)</label>
              <input name="tecnologias" defaultValue={initial?.tecnologias?.join(', ') ?? ''} placeholder="Next.js, Supabase, Netlify" />
            </div>
            <div className="form-group">
              <label className="form-label">Plataforma de deploy</label>
              <input name="plataforma_deploy" defaultValue={initial?.plataforma_deploy ?? ''} placeholder="Netlify, Vercel, VPS..." />
            </div>
          </div>

          <div className="neon-divider" />

          {/* Costo y práctica */}
          <div className="form-grid">
            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="es_practica" checked={esPractica} onChange={e => setEsPractica(e.target.checked)} style={{ width: 'auto' }} />
              <label htmlFor="es_practica" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Es ensayo / práctica (sin costo)</label>
            </div>
            {!esPractica && (
              <div className="form-group">
                <label className="form-label">Costo total (Bs)</label>
                <input name="costo_total" type="number" step="0.01" defaultValue={initial?.costo_total ?? ''} />
              </div>
            )}
          </div>

          {/* Pagos */}
          {!esPractica && <>
            <div className="section-header" style={{ marginBottom: '0.75rem' }}>Pagos</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Anticipo — Monto (Bs)</label>
                <input name="anticipo_monto" type="number" step="0.01" defaultValue={initial?.anticipo_monto ?? ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Anticipo — Fecha</label>
                <input name="anticipo_fecha" type="date" defaultValue={initial?.anticipo_fecha ?? ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Anticipo — Estado</label>
                <select name="anticipo_estado" defaultValue={initial?.anticipo_estado ?? 'pendiente'}>
                  {PAGO_ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Saldo — Monto (Bs)</label>
                <input name="saldo_monto" type="number" step="0.01" defaultValue={initial?.saldo_monto ?? ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Saldo — Fecha</label>
                <input name="saldo_fecha" type="date" defaultValue={initial?.saldo_fecha ?? ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Saldo — Estado</label>
                <select name="saldo_estado" defaultValue={initial?.saldo_estado ?? 'pendiente'}>
                  {PAGO_ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Método de pago</label>
                <select name="metodo_pago" defaultValue={initial?.metodo_pago ?? ''}>
                  <option value="">— Seleccionar —</option>
                  {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </>}

          {/* Mantenimiento */}
          {estadoValue === 'mantenimiento' && (
            <>
              <div className="neon-divider" />
              <div className="section-header" style={{ marginBottom: '0.75rem' }}>Mantenimiento mensual</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Monto mensual (Bs)</label>
                  <input name="monto_mantenimiento" type="number" step="0.01" defaultValue={initial?.monto_mantenimiento ?? ''} />
                </div>
                <div className="form-group">
                  <label className="form-label">Día de cobro</label>
                  <input name="dia_cobro_mantenimiento" type="number" min="1" max="31" defaultValue={initial?.dia_cobro_mantenimiento ?? ''} placeholder="1-31" />
                </div>
                <div className="form-group">
                  <label className="form-label">Modo de cobro</label>
                  <select name="modo_cobro_mantenimiento" defaultValue={initial?.modo_cobro_mantenimiento ?? 'manual'}>
                    <option value="manual">Manual (registro vos mismo)</option>
                    <option value="automatico">Automático (genera movimiento mensual)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="neon-divider" />
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Fecha entrega estimada</label>
              <input name="fecha_entrega_estimada" type="date" defaultValue={initial?.fecha_entrega_estimada ?? ''} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha entrega real</label>
              <input name="fecha_entrega_real" type="date" defaultValue={initial?.fecha_entrega_real ?? ''} />
            </div>
            <div className="form-group">
              <label className="form-label">Revisiones incluidas</label>
              <input name="revisiones_incluidas" type="number" min="0" defaultValue={initial?.revisiones_incluidas ?? 2} />
            </div>
            <div className="form-group">
              <label className="form-label">Revisiones usadas</label>
              <input name="revisiones_usadas" type="number" min="0" defaultValue={initial?.revisiones_usadas ?? 0} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea name="notas" rows={3} defaultValue={initial?.notas ?? ''} />
          </div>

          {error && <div style={{ color: 'var(--status-danger)', fontSize: '0.82rem', marginTop: '0.5rem' }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}
