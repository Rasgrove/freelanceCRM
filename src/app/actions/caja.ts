'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Create a MANUAL cash movement (editable/deletable) */
export async function createMovimiento(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('movimientos_caja').insert({
    fecha: formData.get('fecha') as string,
    tipo: formData.get('tipo') as string,
    monto: Number(formData.get('monto')),
    concepto: formData.get('concepto') as string,
    origen: 'manual',
  })
  if (error) return { error: error.message }
  revalidatePath('/caja')
  revalidatePath('/')
  return { success: true }
}

/** Update a MANUAL movement only */
export async function updateMovimiento(id: string, formData: FormData) {
  const supabase = await createClient()
  // Verify it is a manual movement before allowing edit
  const { data: existing } = await supabase
    .from('movimientos_caja')
    .select('origen')
    .eq('id', id)
    .single()

  if (!existing || existing.origen !== 'manual') {
    return { error: 'Solo se pueden editar movimientos manuales.' }
  }

  const { error } = await supabase.from('movimientos_caja').update({
    fecha: formData.get('fecha') as string,
    tipo: formData.get('tipo') as string,
    monto: Number(formData.get('monto')),
    concepto: formData.get('concepto') as string,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/caja')
  revalidatePath('/')
  return { success: true }
}

/** Delete a MANUAL movement only */
export async function deleteMovimiento(id: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('movimientos_caja')
    .select('origen')
    .eq('id', id)
    .single()

  if (!existing || existing.origen !== 'manual') {
    return { error: 'Solo se pueden eliminar movimientos manuales.' }
  }

  const { error } = await supabase.from('movimientos_caja').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/caja')
  revalidatePath('/')
  return { success: true }
}
