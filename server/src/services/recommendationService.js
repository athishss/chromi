import { GoogleGenAI } from '@google/genai';
import supabase from '../config/supabase.js';

let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
    console.warn('GEMINI_API_KEY is missing. AI recommendations will use fallback algorithm.');
}

/**
 * Get AI-powered service recommendations for a user
 */
export async function getAIRecommendations(userId) {
    if (!supabase) return { fallback: true, recommendations: ['Check out our Browse page to see what your community offers.'] };

    try {
        // Fetch user profile and skills
        const { data: profile } = await supabase.from('profiles').select('skills, campus, interests').eq('id', userId).single();
        if (!profile) throw new Error('Profile not found');

        // Fetch their current listings
        const { data: myListings } = await supabase.from('service_listings').select('title, category, type').eq('user_id', userId);
        
        // Fetch trending community categories
        const { data: activeListings } = await supabase.from('service_listings').select('category, title').eq('status', 'active').limit(50);
        
        const communityContext = activeListings ? activeListings.map(l => l.category).join(', ') : '';
        const myOffers = myListings.filter(l => l.type === 'offer').map(l => l.category).join(', ');
        const myRequests = myListings.filter(l => l.type === 'request').map(l => l.category).join(', ');

        if (!ai) {
            return { fallback: true, recommendations: ['Based on your profile, consider offering more services in your skilled areas.', 'Check out trending requests in your campus.'] };
        }

        const prompt = `You are an AI assistant for a time-exchange community platform called Chromi.
User context:
- Skills: ${profile.skills?.join(', ') || 'None listed'}
- Offers: ${myOffers || 'None'}
- Requests: ${myRequests || 'None'}
- Community trending categories: ${communityContext}

Based on this, generate 3 short, personalized suggestions (1 sentence each) for this user to maximize their experience on Chromi. 
Format as a JSON array of strings. Do not include markdown formatting or the word "json".`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        const recommendations = JSON.parse(text);

        return { fallback: false, recommendations };

    } catch (err) {
        console.error('[RecommendationService] AI failed:', err.message);
        return { fallback: true, recommendations: ['Consider adding more skills to your profile to get better matches.'] };
    }
}
