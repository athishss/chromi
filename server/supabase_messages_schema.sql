CREATE TABLE IF NOT EXISTS public.exchange_messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    exchange_id uuid REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_messages_exchange ON public.exchange_messages(exchange_id);

ALTER TABLE public.exchange_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see messages for their exchanges" ON public.exchange_messages
    FOR SELECT USING (
        sender_id = auth.uid() OR
        exchange_id IN (SELECT id FROM public.exchanges WHERE provider_id = auth.uid() OR requester_id = auth.uid())
    );
CREATE POLICY "Users send messages in their exchanges" ON public.exchange_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());
