import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

const ESTADO_LABELS: Record<string, string> = {
  contactado: 'Contactado', descubrimiento: 'Descubrimiento',
  propuesta_enviada: 'Propuesta enviada', contrato_firmado: 'Contrato firmado',
  en_desarrollo: 'En desarrollo', entregado: 'Entregado',
  mantenimiento: 'Mantenimiento', perdido: 'Perdido',
}
const ESTADO_BADGE: Record<string, string> = {
  contactado: 'badge-muted', descubrimiento: 'badge-accent',
  propuesta_enviada: 'badge-warn', contrato_firmado: 'badge-ok',
  en_desarrollo: 'badge-accent', entregado: 'badge-ok',
  mantenimiento: 'badge-accent2', perdido: 'badge-danger',
}

export default async function ContactoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: contacto }, { data: proyectos }, { data: notas }] = await Promise.all([
    supabase.from('contactos').select('*').eq('id', id).single(),
    supabase.from('proyectos').select('id, nombre, estado, costo_total, fecha_entrega_estimada').eq('contacto_id', id),
    supabase.from('notas').select('*').eq('contacto_id', id).order('created_at', { ascending: false }),
  ])

  if (!contacto) notFound()

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/clientes" className="btn btn-ghost" style={{ padding: '0.3rem 0.5rem' }}><ArrowLeft size={16} /></Link>
          <h1 className="page-title">{contacto.nombre}</h1>
        </div>
        <span className={`badge ${ESTADO_BADGE[contacto.estado] || 'badge-muted'}`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
          {ESTADO_LABELS[contacto.estado] || contacto.estado}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Info básica */}
        <div className="card-flat">
          <div className="section-header">Datos de contacto</div>
          <dl style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.4rem 1rem', fontSize: '0.85rem' }}>
            {[
              ['Rubro', contacto.rubro],
              ['Canal', contacto.canal],
              ['Teléfono', contacto.telefono],
              ['Primer contacto', contacto.fecha_contacto ? format(new Date(contacto.fecha_contacto), 'd MMM yyyy', { locale: es }) : null],
              ['Vigencia propuesta', contacto.vigencia_propuesta ? format(new Date(contacto.vigencia_propuesta), 'd MMM yyyy', { locale: es }) : null],
              ['Próxima acción', contacto.proxima_accion],
              ['Fecha acción', contacto.fecha_proxima_accion ? format(new Date(contacto.fecha_proxima_accion), 'd MMM yyyy', { locale: es }) : null],
            ].map(([label, val]) => val ? (
              <>
                <dt key={`l-${label}`} style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', paddingTop: '0.15rem' }}>{label}</dt>
                <dd key={`v-${label}`} style={{ color: 'var(--text-primary)' }}>{val}</dd>
              </>
            ) : null)}
          </dl>
        </div>

        {/* Proyectos del contacto */}
        <div className="card-flat">
          <div className="section-header">Proyectos asociados</div>
          {(!proyectos || proyectos.length === 0) ? (
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>Sin proyectos.</p>
          ) : proyectos.map(p => (
            <Link key={p.id} href={`/proyectos/${p.id}`} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0.6rem', background: 'var(--bg-surface-2)',
              borderLeft: '2px solid var(--accent)', marginBottom: '0.4rem',
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.nombre}</div>
                {p.costo_total && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Bs {Number(p.costo_total).toFixed(2)}</div>}
              </div>
              <ExternalLink size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>

        {/* Notas */}
        <div className="card-flat">
          <div className="section-header">Notas</div>
          {(!notas || notas.length === 0) ? (
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>Sin notas.</p>
          ) : notas.map(n => (
            <div key={n.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginBottom: '0.15rem' }}>
                {n.fecha ? format(new Date(n.fecha), 'd MMM yyyy', { locale: es }) : ''}
              </div>
              {n.texto}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
