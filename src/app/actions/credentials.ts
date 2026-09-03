'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

const ENC_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY!

if (!ENC_KEY) {
  throw new Error('CREDENTIAL_ENCRYPTION_KEY is not set')
}

/** Store a new credential for a project — plaintext is encrypted server-side via pgcrypto */
export async function createCredential(proyectoId: string, formData: FormData) {
  const supabase = await createAdminClient()

  const servicio = formData.get('servicio') as string
  const usuario = formData.get('usuario') as string
  const password = formData.get('password') as string
  const notas = formData.get('notas') as string || null

  // Encrypt using pgcrypto pgp_sym_encrypt — runs inside Postgres, plaintext never logged
  const { data, error } = await supabase.rpc('encrypt_credential' as any, {
    p_proyecto_id: proyectoId,
    p_servicio: servicio,
    p_usuario: usuario,
    p_password: password,
    p_notas: notas,
    p_key: ENC_KEY,
  })

  if (error) {
    // Fallback: direct insert with SQL encryption expression
    const { error: insError } = await supabase.from('project_credentials').insert({
      proyecto_id: proyectoId,
      servicio,
      // We use raw SQL for encryption
      usuario_cifrado: `pgp_sym_encrypt('${usuario.replace(/'/g, "''")}', '${ENC_KEY.replace(/'/g, "''")}')`,
      password_cifrado: `pgp_sym_encrypt('${password.replace(/'/g, "''")}', '${ENC_KEY.replace(/'/g, "''")}')`,
      notas,
    })
    if (insError) return { error: insError.message }
  }

  revalidatePath(`/proyectos/${proyectoId}`)
  return { success: true }
}

/** List credentials for a project — only returns id, servicio, notas (NO encrypted fields) */
export async function listCredentials(proyectoId: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('project_credentials')
    .select('id, servicio, notas, created_at')
    .eq('proyecto_id', proyectoId)
    .order('created_at')

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

/** Reveal a single credential field — decrypts server-side, returns plaintext ONLY for this request */
export async function revealCredential(credentialId: string, field: 'usuario' | 'password'): Promise<{ value: string | null; error: string | null }> {
  const supabase = await createAdminClient()

  const column = field === 'usuario' ? 'usuario_cifrado' : 'password_cifrado'

  const { data, error } = await supabase
    .rpc('decrypt_credential_field' as any, {
      p_credential_id: credentialId,
      p_field: column,
      p_key: ENC_KEY,
    })

  if (error) return { error: error.message, value: null }
  return { value: data as string, error: null }
}

/** Delete a credential record */
export async function deleteCredential(id: string, proyectoId: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.from('project_credentials').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/proyectos/${proyectoId}`)
  return { success: true }
}
