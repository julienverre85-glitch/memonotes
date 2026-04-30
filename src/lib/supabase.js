import { createClient } from '@supabase/supabase-js'

// ⚠️ Remplace ces valeurs par celles de ton projet Supabase
// (Settings > API dans le dashboard Supabase)
const SUPABASE_URL = 'https://svnnwfkxyqzyqnyaascr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bm53Zmt4eXF6eXFueWFhc2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODMxMjMsImV4cCI6MjA5Mjk1OTEyM30.udc-x59b71Z-idU7dYoCc4q9dqx4aS4GxNqGpsrc_QI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
