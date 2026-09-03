import { createClient } from '@/lib/supabase/server'
import { CitasView } from './CitasView'

export default async function CitasPage() {
  const supabase = await createClient()
  const [{ data: citas }, { data: contactos }, { data: proyectos }] = await Promise.all([
    supabase.from('citas').select(`*, contactos(nombre), proyectos(nombre)`).order('fecha_hora'),
    supabase.from('contactos').select('id, nombre').order('nombre'),
    supabase.from('proyectos').select('id, nombre').order('nombre'),
  ])
  return <CitasView citas={citas ?? []} contactos={contactos ?? []} proyectos={proyectos ?? []} />
}
