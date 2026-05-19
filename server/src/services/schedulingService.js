import supabase from '../config/supabase.js';

export async function checkConflicts(userId, startTime, endTime) {
    if (!supabase) return { hasConflict: false };

    try {
        const { data, error } = await supabase
            .from('exchanges')
            .select('*')
            .or(`provider_id.eq.${userId},requester_id.eq.${userId}`)
            .not('scheduled_at', 'is', null)
            .not('scheduled_end_at', 'is', null)
            .in('status', ['accepted', 'in_progress']);

        if (error) throw error;
        if (!data || data.length === 0) return { hasConflict: false };

        const newStart = new Date(startTime).getTime();
        const newEnd = new Date(endTime).getTime();

        const conflicts = data.filter(ex => {
            const exStart = new Date(ex.scheduled_at).getTime();
            const exEnd = new Date(ex.scheduled_end_at).getTime();
            // Check for overlap
            return (newStart < exEnd && newEnd > exStart);
        });

        if (conflicts.length > 0) {
            return { hasConflict: true, conflicts };
        }
        return { hasConflict: false };
    } catch (err) {
        console.error('[SchedulingService] Conflict check failed:', err.message);
        return { hasConflict: false };
    }
}
