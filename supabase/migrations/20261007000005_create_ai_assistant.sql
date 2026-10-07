-- Migration: create_ai_assistant
-- Creates conversation memory tables for CampusConnect AI Assistant with RLS

CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at ASC);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Policies for ai_conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.ai_conversations;
CREATE POLICY "Users can view own conversations"
    ON public.ai_conversations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.ai_conversations;
CREATE POLICY "Users can insert own conversations"
    ON public.ai_conversations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.ai_conversations;
CREATE POLICY "Users can update own conversations"
    ON public.ai_conversations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete own conversations"
    ON public.ai_conversations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for ai_messages
DROP POLICY IF EXISTS "Users can view own conversation messages" ON public.ai_messages;
CREATE POLICY "Users can view own conversation messages"
    ON public.ai_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations c
            WHERE c.id = ai_messages.conversation_id
            AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages into own conversations" ON public.ai_messages;
CREATE POLICY "Users can insert messages into own conversations"
    ON public.ai_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations c
            WHERE c.id = ai_messages.conversation_id
            AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own conversation messages" ON public.ai_messages;
CREATE POLICY "Users can delete own conversation messages"
    ON public.ai_messages FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations c
            WHERE c.id = ai_messages.conversation_id
            AND c.user_id = auth.uid()
        )
    );
