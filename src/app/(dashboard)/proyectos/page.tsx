import { createClient } from '@/lib/supabase/server'
import { ProyectosView } from './ProyectosView'

export default async function ProyectosPage() {
  const supabase = await createClient()
  const [{ data: proyectos }, { data: contactos }] = await Promise.all([
    supabase.from('proyectos').select(`
      id, nombre, estado, costo_total, es_practica,
      anticipo_estado, saldo_estado, fecha_entrega_estimada,
      fecha_entrega_real, url_produccion, plataforma_deploy,
      monto_mantenimiento, modo_cobro_mantenimiento,
      contactos(nombre)
    `).order('created_at', { ascending: false }),
    supabase.from('contactos').select('id, nombre').order('nombre'),
  ])
  return <ProyectosView proyectos={proyectos ?? []} contactos={contactos ?? []} />
}
