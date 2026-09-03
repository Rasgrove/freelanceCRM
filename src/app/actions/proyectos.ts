'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createProyecto(formData: FormData) {
  const supabase = await createClient()
  const tecnologias = (formData.get('tecnologias') as string || '')
    .split(',').map(t => t.trim()).filter(Boolean)

  const { data, error } = await supabase.from('proyectos').insert({
    contacto_id: formData.get('contacto_id') as string || null,
    nombre: formData.get('nombre') as string,
    url_produccion: formData.get('url_produccion') as string || null,
    tecnologias: tecnologias.length > 0 ? tecnologias : null,
    notas: formData.get('notas') as string || null,
    es_practica: formData.get('es_practica') === 'true',
    costo_total: formData.get('costo_total') ? Number(formData.get('costo_total')) : null,
    estado: formData.get('estado') as string || 'en_desarrollo',
    monto_mantenimiento: formData.get('monto_mantenimiento') ? Number(formData.get('monto_mantenimiento')) : null,
    dia_cobro_mantenimiento: formData.get('dia_cobro_mantenimiento') ? Number(formData.get('dia_cobro_mantenimiento')) : null,
    modo_cobro_mantenimiento: formData.get('modo_cobro_mantenimiento') as string || null,
    anticipo_monto: formData.get('anticipo_monto') ? Number(formData.get('anticipo_monto')) : null,
    anticipo_fecha: formData.get('anticipo_fecha') as string || null,
    anticipo_estado: formData.get('anticipo_estado') as string || 'pendiente',
    saldo_monto: formData.get('saldo_monto') ? Number(formData.get('saldo_monto')) : null,
    saldo_fecha: formData.get('saldo_fecha') as string || null,
    saldo_estado: formData.get('saldo_estado') as string || 'pendiente',
    metodo_pago: formData.get('metodo_pago') as string || null,
    revisiones_incluidas: formData.get('revisiones_incluidas') ? Number(formData.get('revisiones_incluidas')) : 2,
    fecha_entrega_estimada: formData.get('fecha_entrega_estimada') as string || null,
    plataforma_deploy: formData.get('plataforma_deploy') as string || null,
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/proyectos')
  return { success: true, id: data.id }
}

export async function updateProyecto(id: string, formData: FormData) {
  const supabase = await createClient()
  const tecnologias = (formData.get('tecnologias') as string || '')
    .split(',').map(t => t.trim()).filter(Boolean)

  const { error } = await supabase.from('proyectos').update({
    contacto_id: formData.get('contacto_id') as string || null,
    nombre: formData.get('nombre') as string,
    url_produccion: formData.get('url_produccion') as string || null,
    tecnologias: tecnologias.length > 0 ? tecnologias : null,
    notas: formData.get('notas') as string || null,
    es_practica: formData.get('es_practica') === 'true',
    costo_total: formData.get('costo_total') ? Number(formData.get('costo_total')) : null,
    estado: formData.get('estado') as string,
    monto_mantenimiento: formData.get('monto_mantenimiento') ? Number(formData.get('monto_mantenimiento')) : null,
    dia_cobro_mantenimiento: formData.get('dia_cobro_mantenimiento') ? Number(formData.get('dia_cobro_mantenimiento')) : null,
    modo_cobro_mantenimiento: formData.get('modo_cobro_mantenimiento') as string || null,
    anticipo_monto: formData.get('anticipo_monto') ? Number(formData.get('anticipo_monto')) : null,
    anticipo_fecha: formData.get('anticipo_fecha') as string || null,
    saldo_monto: formData.get('saldo_monto') ? Number(formData.get('saldo_monto')) : null,
    saldo_fecha: formData.get('saldo_fecha') as string || null,
    metodo_pago: formData.get('metodo_pago') as string || null,
    revisiones_incluidas: formData.get('revisiones_incluidas') ? Number(formData.get('revisiones_incluidas')) : 2,
    revisiones_usadas: formData.get('revisiones_usadas') ? Number(formData.get('revisiones_usadas')) : 0,
    fecha_entrega_estimada: formData.get('fecha_entrega_estimada') as string || null,
    fecha_entrega_real: formData.get('fecha_entrega_real') as string || null,
    plataforma_deploy: formData.get('plataforma_deploy') as string || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${id}`)
  return { success: true }
}

export async function registrarCobro(proyectoId: string, campo: 'anticipo' | 'saldo', nuevoEstado: string, monto: number, concepto: string) {
  const supabase = await createClient()
  // Atomic: uses the PL/pgSQL function defined in the migration
  const { error } = await supabase.rpc('registrar_cobro_proyecto', {
    p_proyecto_id: proyectoId,
    p_campo: campo,
    p_nuevo_estado: nuevoEstado,
    p_monto: monto,
    p_concepto: concepto,
  })
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${proyectoId}`)
  revalidatePath('/caja')
  revalidatePath('/')
  return { success: true }
}

export async function generarMantenimiento(mes?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('generar_movimientos_mantenimiento', {
    p_mes: mes || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/caja')
  return { success: true, generados: data }
}

export async function deleteProyecto(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('proyectos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/proyectos')
  return { success: true }
}
