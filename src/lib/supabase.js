import { createClient } from '@supabase/supabase-js'

// ⚠️ Remplace ces valeurs par celles de ton projet Supabase
// (Settings > API dans le dashboard Supabase)
const SUPABASE_URL = 'https://VOTRE_PROJECT_REF.supabase.co'
const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
