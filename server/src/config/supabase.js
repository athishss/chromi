import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseUrl !== 'your_supabase_url_here' && supabaseServiceKey && supabaseServiceKey !== 'your_supabase_service_role_key_here') {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
    console.warn('[Chromi Server] Supabase not configured — DB operations will fail.');
}

export default supabase;
