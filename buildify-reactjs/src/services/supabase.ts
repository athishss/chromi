import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl &&
    supabaseUrl !== 'your_supabase_url_here' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your_supabase_anon_key_here';

let supabase: ReturnType<typeof createClient>;

if (isConfigured) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn('[Chromi] Supabase not configured. Using mock auth mode.');
    supabase = {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({
                data: { subscription: { unsubscribe: () => { } } }
            }),
            signUp: async () => { throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'); },
            signInWithPassword: async () => { throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'); },
            signOut: async () => ({ error: null }),
            getUser: async () => ({ data: { user: null }, error: null })
        },
        from: () => ({
            select: () => ({ data: [], error: null }),
            insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }),
            delete: () => ({ eq: () => ({ error: null }) })
        })
    } as unknown as ReturnType<typeof createClient>;
}

export const supabaseConfigured = isConfigured;
export default supabase;
