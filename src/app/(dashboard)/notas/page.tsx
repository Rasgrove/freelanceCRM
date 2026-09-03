import { createClient } from '@/lib/supabase/server'
import { NotasView } from './NotasView'

export default async function NotasPage() {
  const supabase = await createClient()
  const [{ data: notas }, { data: contactos }, { data: proyectos }] = await Promise.all([
    supabase.from('notas').select(`*, contactos(nombre), proyectos(nombre)`).order('created_at', { ascending: false }),
    supabase.from('contactos').select('id, nombre').order('nombre'),
    supabase.from('proyectos').select('id, nombre').order('nombre'),
  ])
  return <NotasView notas={notas ?? []} contactos={contactos ?? []} proyectos={proyectos ?? []} />
}
