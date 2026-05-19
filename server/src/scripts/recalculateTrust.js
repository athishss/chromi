import 'dotenv/config';
import supabase from '../config/supabase.js';
import { calculateTrustScore } from '../services/trustService.js';

async function run() {
    if (!supabase) {
        console.error("Supabase client not initialized.");
        return;
    }
    
    console.log("Fetching all profiles...");
    const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, trust_score');
    if (error) {
        console.error("Failed to fetch profiles:", error);
        return;
    }
    
    console.log(`Found ${profiles.length} profiles. Recalculating trust scores...`);
    for (const p of profiles) {
        const oldScore = p.trust_score;
        const newScore = await calculateTrustScore(p.id);
        console.log(`User: ${p.full_name || p.id} | Old Score: ${oldScore} -> New Score: ${newScore}`);
    }
    console.log("Recalculation complete!");
}

run();
