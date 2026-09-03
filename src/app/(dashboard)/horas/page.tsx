import { createClient } from '@/lib/supabase/server'
import { HorasView } from './HorasView'

export default async function HorasPage() {
  const supabase = await createClient()
  const [{ data: horas }, { data: proyectos }] = await Promise.all([
    supabase.from('horas_trabajadas').select(`*, proyectos(nombre)`).order('fecha', { ascending: false }),
    supabase.from('proyectos').select('id, nombre').order('nombre'),
  ])
  const total = (horas ?? []).reduce((s: number, h: any) => s + Number(h.horas), 0)
  return <HorasView horas={horas ?? []} proyectos={proyectos ?? []} totalGeneral={total} />
}
