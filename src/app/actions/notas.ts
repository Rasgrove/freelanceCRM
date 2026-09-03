'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createNota(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('notas').insert({
    texto: formData.get('texto') as string,
    fecha: formData.get('fecha') as string || new Date().toISOString().split('T')[0],
    contacto_id: formData.get('contacto_id') as string || null,
    proyecto_id: formData.get('proyecto_id') as string || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/notas')
  return { success: true }
}

export async function deleteNota(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('notas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/notas')
  return { success: true }
}

export async function createHora(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('horas_trabajadas').insert({
    proyecto_id: formData.get('proyecto_id') as string || null,
    fecha: formData.get('fecha') as string,
    horas: Number(formData.get('horas')),
    nota: formData.get('nota') as string || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/horas')
  return { success: true }
}

export async function deleteHora(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('horas_trabajadas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/horas')
  return { success: true }
}
