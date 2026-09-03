'use client'

import { useState, useTransition } from 'react'
import { registrarCobro } from '@/app/actions/proyectos'

const PAGO_BADGE: Record<string, string> = {
  pendiente: 'badge-muted', parcial: 'badge-warn', pagado: 'badge-ok', vencido: 'badge-danger',
}
const ESTADOS_PAGO = ['pendiente', 'parcial', 'pagado', 'vencido']

export function PagoSection({ proyecto }: { proyecto: any }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const cambiar = (campo: 'anticipo' | 'saldo', estado: string) => {
    const monto = campo === 'anticipo' ? Number(proyecto.anticipo_monto) : Number(proyecto.saldo_monto)
    const concepto = `${campo === 'anticipo' ? 'Anticipo' : 'Saldo'} — ${proyecto.nombre}`
    startTransition(async () => {
      const result = await registrarCobro(proyecto.id, campo, estado, monto, concepto)
      if (result.error) setMsg(result.error)
      else setMsg(`Estado de ${campo} actualizado`)
      setTimeout(() => setMsg(null), 3000)
    })
  }

  return (
    <div className="card-flat">
      <div className="section-header">Pagos</div>
      {msg && <div style={{ fontSize: '0.8rem', color: 'var(--status-ok)', marginBottom: '0.5rem' }}>{msg}</div>}

      {[{ campo: 'anticipo' as const, label: 'Anticipo', monto: proyecto.anticipo_monto, estado: proyecto.anticipo_estado, fecha: proyecto.anticipo_fecha },
        { campo: 'saldo' as const, label: 'Saldo', monto: proyecto.saldo_monto, estado: proyecto.saldo_estado, fecha: proyecto.saldo_fecha }
      ].map(({ campo, label, monto, estado, fecha }) => (
        <div key={campo} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>{label}</span>
              {monto && <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>Bs {Number(monto).toFixed(2)}</span>}
              {fecha && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{fecha}</span>}
            </div>
            <span className={`badge ${PAGO_BADGE[estado] || 'badge-muted'}`}>{estado}</span>
          </div>
          {monto && (
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {ESTADOS_PAGO.map(e => (
                <button
                  key={e}
                  className={`btn ${e === estado ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                  disabled={isPending || e === estado}
                  onClick={() => cambiar(campo, e)}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          {!monto && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No configurado</p>}
        </div>
      ))}
      {proyecto.metodo_pago && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Método: {proyecto.metodo_pago}</div>
      )}
    </div>
  )
}
