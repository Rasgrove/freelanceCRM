'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createContacto(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('contactos').insert({
    nombre: formData.get('nombre') as string,
    rubro: formData.get('rubro') as string || null,
    canal: formData.get('canal') as string || null,
    fecha_contacto: formData.get('fecha_contacto') as string || null,
    telefono: formData.get('telefono') as string || null,
    estado: formData.get('estado') as string || 'contactado',
    vigencia_propuesta: formData.get('vigencia_propuesta') as string || null,
    proxima_accion: formData.get('proxima_accion') as string || null,
    fecha_proxima_accion: formData.get('fecha_proxima_accion') as string || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { success: true }
}

export async function updateContacto(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('contactos').update({
    nombre: formData.get('nombre') as string,
    rubro: formData.get('rubro') as string || null,
    canal: formData.get('canal') as string || null,
    fecha_contacto: formData.get('fecha_contacto') as string || null,
    telefono: formData.get('telefono') as string || null,
    estado: formData.get('estado') as string,
    vigencia_propuesta: formData.get('vigencia_propuesta') as string || null,
    proxima_accion: formData.get('proxima_accion') as string || null,
    fecha_proxima_accion: formData.get('fecha_proxima_accion') as string || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}

export async function updateContactoEstado(id: string, estado: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contactos')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { success: true }
}

export async function deleteContacto(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contactos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { success: true }
}
