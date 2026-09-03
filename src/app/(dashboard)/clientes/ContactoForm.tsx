'use client'

import { useTransition, useState } from 'react'
import { createContacto, updateContacto } from '@/app/actions/contactos'
import { X } from 'lucide-react'

type Contacto = { id: string; nombre: string; rubro: string | null; canal: string | null; telefono: string | null; estado: string; vigencia_propuesta: string | null; proxima_accion: string | null; fecha_proxima_accion: string | null; fecha_contacto: string | null }
type Estado = { key: string; label: string }

export function ContactoForm({ estados, initial, onClose, onSaved }: {
  estados: Estado[]
  initial: Contacto | null
  onClose: () => void
  onSaved: (c: Contacto) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = initial
        ? await updateContacto(initial.id, fd)
        : await createContacto(fd)

      if (result?.error) { setError(result.error); return }

      // Build the saved contacto with form values for optimistic update
      const saved: Contacto = {
        id: initial?.id ?? crypto.randomUUID(),
        nombre: fd.get('nombre') as string,
        rubro: fd.get('rubro') as string || null,
        canal: fd.get('canal') as string || null,
        telefono: fd.get('telefono') as string || null,
        estado: fd.get('estado') as string,
        vigencia_propuesta: fd.get('vigencia_propuesta') as string || null,
        proxima_accion: fd.get('proxima_accion') as string || null,
        fecha_proxima_accion: fd.get('fecha_proxima_accion') as string || null,
        fecha_contacto: fd.get('fecha_contacto') as string || null,
      }
      onSaved(saved)
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <span>{initial ? 'Editar contacto' : 'Nuevo contacto'}</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input name="nombre" required defaultValue={initial?.nombre} placeholder="Nombre del contacto" />
            </div>
            <div className="form-group">
              <label className="form-label">Rubro / Negocio</label>
              <input name="rubro" defaultValue={initial?.rubro ?? ''} placeholder="Ej: Ferretería" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono / WhatsApp</label>
              <input name="telefono" defaultValue={initial?.telefono ?? ''} placeholder="+591 7xxxxxxx" />
            </div>
            <div className="form-group">
              <label className="form-label">Canal de contacto</label>
              <select name="canal" defaultValue={initial?.canal ?? ''}>
                <option value="">— Seleccionar —</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="referido">Referido</option>
                <option value="flyer">Flyer</option>
                <option value="redes">Redes sociales</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado en el embudo</label>
              <select name="estado" defaultValue={initial?.estado ?? 'contactado'}>
                {estados.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de primer contacto</label>
              <input type="date" name="fecha_contacto" defaultValue={initial?.fecha_contacto ?? new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">Vigencia de propuesta</label>
              <input type="date" name="vigencia_propuesta" defaultValue={initial?.vigencia_propuesta ?? ''} />
            </div>
            <div className="form-group">
              <label className="form-label">Próxima acción</label>
              <input name="proxima_accion" defaultValue={initial?.proxima_accion ?? ''} placeholder="Ej: Enviar propuesta" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha próxima acción</label>
              <input type="date" name="fecha_proxima_accion" defaultValue={initial?.fecha_proxima_accion ?? ''} />
            </div>
          </div>
          {error && <div style={{ color: 'var(--status-danger)', fontSize: '0.82rem', marginTop: '0.5rem' }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
