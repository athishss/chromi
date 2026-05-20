import { Router } from 'express';
import supabase from '../config/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/messages/:exchangeId — get all messages for an exchange
 */
router.get('/:exchangeId', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const exchangeId = req.params.exchangeId;

        // Verify the user is part of this exchange
        const { data: exchange, error: exErr } = await supabase
            .from('exchanges')
            .select('id, provider_id, requester_id')
            .eq('id', exchangeId)
            .single();

        if (exErr || !exchange) return res.status(404).json({ error: 'Exchange not found' });
        if (exchange.provider_id !== req.userId && exchange.requester_id !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to view these messages' });
        }

        const { data: messages, error } = await supabase
            .from('exchange_messages')
            .select('*, sender:profiles!exchange_messages_sender_id_fkey(full_name)')
            .eq('exchange_id', exchangeId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const formatted = (messages || []).map(m => ({
            id: m.id,
            exchange_id: m.exchange_id,
            sender_id: m.sender_id,
            sender_name: m.sender?.full_name || 'Unknown',
            content: m.content,
            created_at: m.created_at
        }));

        res.json(formatted);
    } catch (err) {
        console.error('[GET /messages/:exchangeId]', err);
        res.status(500).json({ error: err.message || 'Failed to fetch messages' });
    }
});

/**
 * POST /api/messages/:exchangeId — send a message in an exchange
 */
router.post('/:exchangeId', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Database not configured' });

        const exchangeId = req.params.exchangeId;
        const { content } = req.body;

        if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required' });

        // Verify the user is part of this exchange
        const { data: exchange, error: exErr } = await supabase
            .from('exchanges')
            .select('id, provider_id, requester_id')
            .eq('id', exchangeId)
            .single();

        if (exErr || !exchange) return res.status(404).json({ error: 'Exchange not found' });
        if (exchange.provider_id !== req.userId && exchange.requester_id !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to send messages here' });
        }

        const { data: message, error } = await supabase
            .from('exchange_messages')
            .insert({
                exchange_id: exchangeId,
                sender_id: req.userId,
                content: content.trim()
            })
            .select('*, sender:profiles!exchange_messages_sender_id_fkey(full_name)')
            .single();

        if (error) throw error;

        res.status(201).json({
            id: message.id,
            exchange_id: message.exchange_id,
            sender_id: message.sender_id,
            sender_name: message.sender?.full_name || 'Unknown',
            content: message.content,
            created_at: message.created_at
        });
    } catch (err) {
        console.error('[POST /messages/:exchangeId]', err);
        res.status(500).json({ error: err.message || 'Failed to send message' });
    }
});

export default router;
