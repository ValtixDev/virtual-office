import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://efvkcqnffmqodingqfbk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_iDUKwnqCiORGlMEsSe4bYA_eki5rNPF'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
