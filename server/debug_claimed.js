import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking claimed_rewards table...");
    const { data, error } = await supabase.from('claimed_rewards').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data:", data);
    }
}
check();
