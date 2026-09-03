import type { Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

// Runs every 4 days to prevent Supabase project from pausing due to inactivity
export default async function handler() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.rpc('generar_movimientos_mantenimiento')

  if (error) {
    console.error('[keep-alive] Error:', error.message)
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
  }

  console.log('[keep-alive] Supabase pinged + maintenance movements generated')
  return new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), { status: 200 })
}

export const config: Config = {
  schedule: '0 10 */4 * *',
}
