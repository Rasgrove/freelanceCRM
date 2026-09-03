import { createClient } from '@/lib/supabase/server'
import { format, addDays, isPast, isWithinInterval, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  TrendingUp, TrendingDown, Calendar, FolderOpen, Users, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardData() {
  const supabase = await createClient()

  const [
    { data: movimientos },
    { data: citas },
    { data: proyectos },
    { data: leads },
  ] = await Promise.all([
    supabase.from('movimientos_caja').select('tipo, monto').order('created_at'),
    supabase.from('citas')
      .select('*')
      .gte('fecha_hora', new Date().toISOString())
      .lte('fecha_hora', addDays(new Date(), 7).toISOString())
      .order('fecha_hora'),
    supabase.from('proyectos')
      .select('id, nombre, estado, fecha_entrega_estimada, fecha_entrega_real, url_produccion')
      .in('estado', ['en_desarrollo', 'mantenimiento'])
      .order('fecha_entrega_estimada', { ascending: true }),
    supabase.from('contactos')
      .select('id, nombre, rubro, estado, fecha_proxima_accion, proxima_accion')
      .not('estado', 'in', '("entregado","perdido","mantenimiento")')
      .lte('fecha_proxima_accion', format(addDays(new Date(), 3), 'yyyy-MM-dd'))
      .not('fecha_proxima_accion', 'is', null)
      .order('fecha_proxima_accion'),
  ])

  const saldo = (movimientos ?? []).reduce((acc, m) => {
    return m.tipo === 'ingreso' ? acc + Number(m.monto) : acc - Number(m.monto)
  }, 0)

  return { saldo, citas: citas ?? [], proyectos: proyectos ?? [], leads: leads ?? [] }
}

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    contactado: 'badge-muted',
    descubrimiento: 'badge-accent',
    propuesta_enviada: 'badge-warn',
    contrato_firmado: 'badge-ok',
    en_desarrollo: 'badge-accent',
    entregado: 'badge-ok',
    mantenimiento: 'badge-accent2',
    perdido: 'badge-danger',
  }
  const labels: Record<string, string> = {
    contactado: 'Contactado',
    descubrimiento: 'Descubrimiento',
    propuesta_enviada: 'Propuesta',
    contrato_firmado: 'Contrato',
    en_desarrollo: 'En desarrollo',
    entregado: 'Entregado',
    mantenimiento: 'Mantenimiento',
    perdido: 'Perdido',
  }
  return { cls: map[estado] || 'badge-muted', label: labels[estado] || estado }
}

export default async function DashboardPage() {
  const { saldo, citas, proyectos, leads } = await getDashboardData()
  const now = new Date()

  return (
    <div>
      {/* Page title */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {format(now, "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </span>
      </div>

      {/* ====== SALDO DESTACADO ====== */}
      <div style={{
        background: saldo >= 0 ? 'var(--accent)' : 'var(--status-danger)',
        color: saldo >= 0 ? 'var(--text-on-accent)' : '#fff',
        padding: '1.5rem 2rem',
        marginBottom: '1.75rem',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: '0.25rem' }}>
            Saldo actual en caja
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1 }}>
            {saldo >= 0 ? '' : '–'}Bs {Math.abs(saldo).toFixed(2)}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', opacity: 0.6 }}>
          {saldo >= 0 ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
        </div>
        <Link href="/caja" style={{
          fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.75,
          borderBottom: '1px solid currentColor', alignSelf: 'flex-end',
        }}>
          Ver flujo de caja →
        </Link>
      </div>

      {/* ====== GRID: citas + proyectos + leads ====== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* PRÓXIMAS CITAS */}
        <div className="card-flat" style={{ gridColumn: 'span 1' }}>
          <div className="section-header">
            <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
            Próximas citas
          </div>
          {citas.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>No hay citas en los próximos 7 días.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {citas.map((c: any) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', padding: '0.3rem 0.5rem', textAlign: 'center', minWidth: 44 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                      {format(new Date(c.fecha_hora), 'd')}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {format(new Date(c.fecha_hora), 'MMM', { locale: es })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{format(new Date(c.fecha_hora), 'HH:mm')} — <span style={{ textTransform: 'capitalize' }}>{c.tipo}</span></div>
                    {c.notas && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.notas}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/citas" className="btn btn-ghost" style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>Ver todas →</Link>
        </div>

        {/* PROYECTOS EN CURSO */}
        <div className="card-flat">
          <div className="section-header">
            <FolderOpen size={13} style={{ display: 'inline', marginRight: 4 }} />
            Proyectos en curso
          </div>
          {proyectos.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>No hay proyectos activos.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {proyectos.map((p: any) => {
                const overdue = p.fecha_entrega_estimada && isPast(new Date(p.fecha_entrega_estimada)) && p.estado === 'en_desarrollo'
                const nearDue = p.fecha_entrega_estimada && isWithinInterval(new Date(p.fecha_entrega_estimada), {
                  start: startOfDay(now), end: addDays(now, 5),
                }) && p.estado === 'en_desarrollo'
                return (
                  <Link key={p.id} href={`/proyectos/${p.id}`} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem 0.6rem', background: 'var(--bg-surface-2)',
                    borderLeft: `2px solid ${overdue ? 'var(--status-danger)' : nearDue ? 'var(--status-warn)' : 'var(--accent)'}`,
                    gap: '0.5rem',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.nombre}</div>
                      {p.fecha_entrega_estimada && (
                        <div style={{ fontSize: '0.72rem', color: overdue ? 'var(--status-danger)' : nearDue ? 'var(--status-warn)' : 'var(--text-secondary)' }}>
                          {overdue && <AlertTriangle size={10} style={{ display: 'inline', marginRight: 3 }} />}
                          Entrega: {format(new Date(p.fecha_entrega_estimada), 'd MMM', { locale: es })}
                        </div>
                      )}
                    </div>
                    <span className={`badge ${p.estado === 'mantenimiento' ? 'badge-accent2' : 'badge-accent'}`}>
                      {p.estado === 'mantenimiento' ? 'Mant.' : 'Dev'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
          <Link href="/proyectos" className="btn btn-ghost" style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>Ver todos →</Link>
        </div>

        {/* LEADS PENDIENTES */}
        <div className="card-flat">
          <div className="section-header">
            <Users size={13} style={{ display: 'inline', marginRight: 4 }} />
            Leads con acción pendiente
          </div>
          {leads.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>No hay leads con acciones próximas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {leads.map((l: any) => {
                const overdue = l.fecha_proxima_accion && isPast(new Date(l.fecha_proxima_accion))
                const { cls, label } = estadoBadge(l.estado)
                return (
                  <Link key={l.id} href={`/clientes/${l.id}`} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem 0.6rem', background: 'var(--bg-surface-2)',
                    borderLeft: `2px solid ${overdue ? 'var(--status-danger)' : 'var(--status-warn)'}`,
                    gap: '0.5rem',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{l.nombre}</div>
                      <div style={{ fontSize: '0.72rem', color: overdue ? 'var(--status-danger)' : 'var(--status-warn)' }}>
                        {overdue && <AlertTriangle size={10} style={{ display: 'inline', marginRight: 3 }} />}
                        {l.proxima_accion} — {l.fecha_proxima_accion && format(new Date(l.fecha_proxima_accion), 'd MMM', { locale: es })}
                      </div>
                    </div>
                    <span className={`badge ${cls}`}>{label}</span>
                  </Link>
                )
              })}
            </div>
          )}
          <Link href="/clientes" className="btn btn-ghost" style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>Ver pipeline →</Link>
        </div>
      </div>
    </div>
  )
}
