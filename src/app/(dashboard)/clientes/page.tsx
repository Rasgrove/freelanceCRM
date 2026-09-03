import { createClient } from '@/lib/supabase/server'
import { ClientesView } from './ClientesView'

const ESTADOS = [
  { key: 'contactado', label: 'Contactado' },
  { key: 'descubrimiento', label: 'Descubrimiento' },
  { key: 'propuesta_enviada', label: 'Propuesta enviada' },
  { key: 'contrato_firmado', label: 'Contrato firmado' },
  { key: 'en_desarrollo', label: 'En desarrollo' },
  { key: 'entregado', label: 'Entregado' },
  { key: 'mantenimiento', label: 'Mantenimiento' },
  { key: 'perdido', label: 'Perdido' },
]

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: contactos } = await supabase
    .from('contactos')
    .select('*')
    .order('created_at', { ascending: false })

  return <ClientesView contactos={contactos ?? []} estados={ESTADOS} />
}
