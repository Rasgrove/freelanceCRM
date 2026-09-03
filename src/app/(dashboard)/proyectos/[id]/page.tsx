import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { CredentialsSection } from './CredentialsSection'
import { PagoSection } from './PagoSection'
import { HorasSection } from './HorasSection'

const PAGO_BADGE: Record<string, string> = {
  pendiente: 'badge-muted', parcial: 'badge-warn', pagado: 'badge-ok', vencido: 'badge-danger',
}

export default async function ProyectoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: p }, { data: contacto }, { data: horas }, { data: notas }] = await Promise.all([
    supabase.from('proyectos').select(`*, contactos(nombre)`).eq('id', id).single(),
    supabase.from('proyectos').select('contacto_id').eq('id', id).single(),
    supabase.from('horas_trabajadas').select('*').eq('proyecto_id', id).order('fecha', { ascending: false }),
    supabase.from('notas').select('*').eq('proyecto_id', id).order('created_at', { ascending: false }),
  ])

  if (!p) notFound()

  const totalHoras = (horas ?? []).reduce((s: number, h: any) => s + Number(h.horas), 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/proyectos" className="btn btn-ghost" style={{ padding: '0.3rem 0.5rem' }}><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="page-title">{p.nombre}</h1>
            {p.contactos?.nombre && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.contactos.nombre}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {p.url_produccion && (
            <a href={p.url_produccion} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
              <ExternalLink size={13} /> Producción
            </a>
          )}
          <span className={`badge ${p.estado === 'mantenimiento' ? 'badge-accent2' : p.estado === 'entregado' ? 'badge-ok' : p.estado === 'pausado' ? 'badge-muted' : 'badge-accent'}`} style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
            {p.estado.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Info general */}
        <div className="card-flat">
          <div className="section-header">Información general</div>
          <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.4rem 1rem', fontSize: '0.85rem' }}>
            {[
              ['Plataforma', p.plataforma_deploy],
              ['Tecnologías', p.tecnologias?.join(', ')],
              ['Es práctica', p.es_practica ? 'Sí (sin costo)' : null],
              ['Costo total', p.costo_total && !p.es_practica ? `Bs ${Number(p.costo_total).toFixed(2)}` : null],
              ['Revisiones', `${p.revisiones_usadas ?? 0} / ${p.revisiones_incluidas ?? 2} usadas`],
              ['Entrega estimada', p.fecha_entrega_estimada ? format(new Date(p.fecha_entrega_estimada), 'd MMM yyyy', { locale: es }) : null],
              ['Entrega real', p.fecha_entrega_real ? format(new Date(p.fecha_entrega_real), 'd MMM yyyy', { locale: es }) : null],
            ].map(([label, val]) => val ? (
              <>
                <dt key={`l-${label}`} style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', paddingTop: '0.15rem' }}>{label}</dt>
                <dd key={`v-${label}`}>{val}</dd>
              </>
            ) : null)}
          </dl>
          {p.notas && <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'var(--bg-surface-2)', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{p.notas}</div>}
        </div>

        {/* Pagos */}
        {!p.es_practica && (
          <PagoSection proyecto={p} />
        )}

        {/* Mantenimiento */}
        {p.estado === 'mantenimiento' && p.monto_mantenimiento && (
          <div className="card-flat">
            <div className="section-header">Mantenimiento mensual</div>
            <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.4rem 1rem', fontSize: '0.85rem' }}>
              <dt style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.72rem' }}>Monto</dt>
              <dd>Bs {Number(p.monto_mantenimiento).toFixed(2)} / mes</dd>
              <dt style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.72rem' }}>Día cobro</dt>
              <dd>{p.dia_cobro_mantenimiento ?? '—'}</dd>
              <dt style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.72rem' }}>Modo</dt>
              <dd>
                <span className={`badge ${p.modo_cobro_mantenimiento === 'automatico' ? 'badge-ok' : 'badge-warn'}`}>
                  {p.modo_cobro_mantenimiento === 'automatico' ? 'Automático' : 'Manual'}
                </span>
              </dd>
            </dl>
          </div>
        )}

        {/* Horas trabajadas — informativo */}
        <HorasSection proyectoId={p.id} horas={horas ?? []} totalHoras={totalHoras} />
      </div>

      <div className="neon-divider" style={{ margin: '1.5rem 0' }} />

      {/* CREDENTIALS — critical section */}
      <CredentialsSection proyectoId={p.id} />

      {/* Notas */}
      {notas && notas.length > 0 && (
        <div className="card-flat" style={{ marginTop: '1.25rem' }}>
          <div className="section-header">Notas del proyecto</div>
          {notas.map((n: any) => (
            <div key={n.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginBottom: '0.15rem' }}>
                {n.fecha ? format(new Date(n.fecha), 'd MMM yyyy', { locale: es }) : ''}
              </div>
              {n.texto}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
