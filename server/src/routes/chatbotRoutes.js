import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

let ai = null;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * POST /api/chat - Talk to the Chromi AI Assistant
 */
router.post('/', async (req, res) => {
    try {
        if (!ai) {
            return res.status(503).json({ error: 'AI Assistant is currently unavailable (API key missing).' });
        }
        if (!supabase) {
            return res.status(503).json({ error: 'Database not configured.' });
        }

        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        // Fetch user profile
        const { data: profile } = await supabase.from('profiles').select('full_name, skills, campus, time_balance').eq('id', req.userId).single();
        
        // Fetch active listings for context
        const { data: listings } = await supabase.from('service_listings')
            .select('id, title, category, type, description, estimated_hours, profiles(full_name, rating)')
            .eq('status', 'active')
            .neq('user_id', req.userId)
            .limit(20);

        const listingsContext = listings ? listings.map(l => ({
            id: l.id,
            title: l.title,
            category: l.category,
            type: l.type,
            provider: l.profiles?.full_name || 'Anonymous',
            rating: l.profiles?.rating || 0
        })) : [];

        // Log profile for debugging
        console.log('[Chatbot] Fetched profile:', profile);

        const isFirstMessage = !history || history.length === 0 || (history.length === 1 && history[0].role === 'model');
        
        // Ensure we have a valid name to call them
        let userName = 'there';
        if (profile?.full_name && profile.full_name.trim() !== '') {
            userName = profile.full_name.split(' ')[0];
        }

        const systemPrompt = `You are the Chromi AI Assistant. Chromi is a community-powered platform where 1 hour of any skill equals 1 hour of any other. Users exchange time, not money.
Your goal is to help the user navigate the platform, understand how it works, and find services they might need or can provide.

Recent Features added to Chromi:
- Rewards System: Users earn Time Credits (TC) via Daily Check-Ins (0.1 TC) and Milestone Tasks.
- Collateral Bartering: Providers can ask for physical items as collateral when lending physical resources.
- Advanced Scheduling & Escrow: Credits are locked in escrow when an exchange is requested and released upon completion, with penalty mechanics for disputes.
- Group & Private Sessions: Providers can host group sessions (up to 20 people) or charge a 2x premium multiplier for 1-on-1 "Private" sessions.
- Live "Available Now" Mode: Users can toggle themselves as "Live" to appear on a real-time feed, indicating they are free to help instantly.
- DeFi Time Staking & Liquidity Pools: Users can stake idle credits to earn yields (1 Week at 7% yield, 1 Month at 15% yield). Early unstaking incurs a 10% slashing penalty on the principal.

User Profile:
- Name: ${profile?.full_name || 'Not set'}
- Campus: ${profile?.campus || 'Not set'}
- Skills: ${profile?.skills?.join(', ') || 'None listed'}
- Time Balance: ${profile?.time_balance || 0} hours

Available Services in Community (Max 20):
${JSON.stringify(listingsContext, null, 2)}

Instructions:
1. Answer the user's message naturally and concisely. Do NOT use markdown formatting (like **bold** or *italics*), just use plain text. Numbers should just be written as normal numbers.
2. Be helpful, friendly, and futuristic in your tone.
3. If the user is looking for a service, check the "Available Services" context and recommend specific listings if they match.
4. ${isFirstMessage 
    ? `Since this is your first response, you MUST start your message by saying exactly "Hi ${userName}!" and then answer the question.` 
    : `Since you are already in a conversation, NEVER start your message with a greeting. Do NOT say Hi, Hello, or use the user's name. Jump straight into the answer.`}
5. You MUST respond in JSON format with the following structure:
{
    "reply": "Your plain text response here. Do not use markdown.",
    "suggested_listings": ["listing_id_1", "listing_id_2"]
}`;

        // Format history for Gemini and ensure it starts with a 'user' message
        let formattedHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Gemini API will throw 400 if the conversation history starts with a 'model' message.
        while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift();
        }

        // Append current message
        formattedHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: formattedHistory,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json"
            }
        });

        const resultText = response.text;
        let result;
        try {
            result = JSON.parse(resultText);
        } catch (e) {
            console.error('[Chatbot] Failed to parse JSON from AI:', resultText);
            // Fallback response
            result = {
                reply: resultText,
                suggested_listings: []
            };
        }

        // If AI suggested listings, fetch their full details to return to the client
        let populatedListings = [];
        if (result.suggested_listings && result.suggested_listings.length > 0) {
            const { data: matchedListings } = await supabase.from('service_listings')
                .select('*, profiles(full_name, rating, campus)')
                .in('id', result.suggested_listings);
            
            if (matchedListings) {
                populatedListings = matchedListings;
            }
        }

        res.json({
            reply: result.reply,
            suggested_listings: populatedListings
        });

    } catch (err) {
        console.error('[POST /chat]', err);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

export default router;
