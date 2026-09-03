import { createClient } from '@/lib/supabase/server'
import { CajaView } from './CajaView'

export default async function CajaPage() {
  const supabase = await createClient()
  const { data: movimientos } = await supabase
    .from('movimientos_caja')
    .select('*, proyectos(nombre), gastos(concepto)')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  const saldo = (movimientos ?? []).reduce((acc: number, m: any) =>
    m.tipo === 'ingreso' ? acc + Number(m.monto) : acc - Number(m.monto), 0)

  return <CajaView movimientos={movimientos ?? []} saldoActual={saldo} />
}
