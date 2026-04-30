import { createClient as _create } from '@supabase/supabase-js'

let _instance: ReturnType<typeof _create> | null = null

export function createClient() {
  if (_instance) return _instance
  _instance = _create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
  return _instance
}
