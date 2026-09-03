import { createClient } from '@/lib/supabase/server'
import { GastosView } from './GastosView'

export default async function GastosPage() {
  const supabase = await createClient()
  const { data: gastos } = await supabase.from('gastos').select('*').order('fecha', { ascending: false })
  return <GastosView gastos={gastos ?? []} />
}
