'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createGasto(formData: FormData) {
  const supabase = await createClient()
  const fecha = formData.get('fecha') as string
  const concepto = formData.get('concepto') as string
  const monto = Number(formData.get('monto'))
  const categoria = formData.get('categoria') as string || 'otro'
  const periodicidad = formData.get('periodicidad') as string || 'unico'

  // Atomic: creates gasto + movimiento_caja in one transaction via PL/pgSQL
  const { error } = await supabase.rpc('crear_gasto_con_movimiento', {
    p_fecha: fecha,
    p_concepto: concepto,
    p_monto: monto,
    p_categoria: categoria,
    p_periodicidad: periodicidad,
  })

  if (error) return { error: error.message }
  revalidatePath('/gastos')
  revalidatePath('/caja')
  revalidatePath('/')
  return { success: true }
}

export async function updateGasto(id: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('gastos').update({
    fecha: formData.get('fecha') as string,
    concepto: formData.get('concepto') as string,
    monto: Number(formData.get('monto')),
    categoria: formData.get('categoria') as string || 'otro',
    periodicidad: formData.get('periodicidad') as string || 'unico',
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/gastos')
  return { success: true }
}

export async function deleteGasto(id: string) {
  const supabase = await createClient()
  // ON DELETE CASCADE in movimientos_caja will remove the linked movement
  const { error } = await supabase.from('gastos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/gastos')
  revalidatePath('/caja')
  revalidatePath('/')
  return { success: true }
}
