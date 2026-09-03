'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createCita(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('citas').insert({
    fecha_hora: formData.get('fecha_hora') as string,
    tipo: formData.get('tipo') as string || 'otro',
    contacto_id: formData.get('contacto_id') as string || null,
    proyecto_id: formData.get('proyecto_id') as string || null,
    notas: formData.get('notas') as string || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/citas')
  revalidatePath('/')
  return { success: true }
}

export async function updateCita(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('citas').update({
    fecha_hora: formData.get('fecha_hora') as string,
    tipo: formData.get('tipo') as string || 'otro',
    contacto_id: formData.get('contacto_id') as string || null,
    proyecto_id: formData.get('proyecto_id') as string || null,
    notas: formData.get('notas') as string || null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/citas')
  revalidatePath('/')
  return { success: true }
}

export async function deleteCita(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('citas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/citas')
  revalidatePath('/')
  return { success: true }
}
