'use server';

import { getCurrentUser } from '../auth/user';
import { createClient } from '../supabase/server';
import { AIConversation, AIMessage, AISendMessageInput, AISendMessageResponse } from '../types/ai.types';
import { getStudentAIContext } from './context';
import { generateAIResponse } from './provider';

/**
 * Fetch all conversations belonging to the authenticated student
 */
export async function getStudentConversationsAction(): Promise<AIConversation[]> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return [];
    }

    const supabase: any = await createClient();
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, user_id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(15);

    if (error || !data) {
      return [];
    }

    return data.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      title: c.title,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  } catch (err) {
    console.error('getStudentConversationsAction error:', err);
    return [];
  }
}

/**
 * Fetch messages for a specific conversation, strictly ensuring user ownership
 */
export async function getConversationMessagesAction(
  conversationId: string
): Promise<AIMessage[]> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return [];
    }

    const supabase: any = await createClient();

    // Verify ownership
    const { data: conv } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!conv) {
      return [];
    }

    const { data: messages, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error || !messages) {
      return [];
    }

    return messages.map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    }));
  } catch (err) {
    console.error('getConversationMessagesAction error:', err);
    return [];
  }
}

/**
 * Send a message to CampusConnect AI and receive a context-grounded response
 */
export async function sendMessageAction(
  input: AISendMessageInput
): Promise<AISendMessageResponse> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    throw new Error('Unauthorized: You must be signed in as a student to access CampusConnect AI.');
  }

  const rawText = (input.message || '').trim();
  if (!rawText) {
    throw new Error('Message content cannot be empty.');
  }

  if (rawText.length > 2000) {
    throw new Error('Message is too long. Please limit your query to 2000 characters.');
  }

  const supabase: any = await createClient();
  let conversationId = input.conversationId;

  // 1. Verify or create conversation
  if (conversationId && !conversationId.startsWith('session-')) {
    try {
      const { data: existingConv } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingConv) {
        conversationId = undefined;
      }
    } catch {
      // Table may not exist or offline session
      conversationId = undefined;
    }
  }

  if (!conversationId) {
    // Generate clean concise title from user's first query
    const autoTitle = rawText.length > 35 ? rawText.slice(0, 32) + '...' : rawText;
    try {
      const { data: newConv, error: newConvErr } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: autoTitle,
        })
        .select()
        .single();

      if (newConvErr || !newConv) {
        conversationId = 'session-' + Date.now();
      } else {
        conversationId = newConv.id;
      }
    } catch {
      conversationId = 'session-' + Date.now();
    }
  }

  // 2. Fetch recent conversation history
  let conversationHistory: AIMessage[] = [];
  if (conversationId && !conversationId.startsWith('session-')) {
    try {
      const { data: historyData } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (historyData) {
        conversationHistory = historyData.map((m: any) => ({
          id: m.id,
          conversationId: m.conversation_id,
          role: m.role,
          content: m.content,
          createdAt: m.created_at,
        }));
      }
    } catch {
      conversationHistory = [];
    }
  }

  // 3. Retrieve student context securely
  const studentContext = await getStudentAIContext(user.id);

  // 4. Generate AI response
  const aiResult = await generateAIResponse({
    userMessage: rawText,
    conversationHistory,
    studentContext,
  });

  const now = new Date().toISOString();
  const userMsgId = 'usr-' + Date.now();
  const assistantMsgId = 'ast-' + (Date.now() + 1);

  const userMessage: AIMessage = {
    id: userMsgId,
    conversationId: conversationId!,
    role: 'user',
    content: rawText,
    createdAt: now,
  };

  const assistantMessage: AIMessage = {
    id: assistantMsgId,
    conversationId: conversationId!,
    role: 'assistant',
    content: aiResult.content,
    createdAt: new Date().toISOString(),
  };

  // 5. Persist messages if live table is available
  if (conversationId && !conversationId.startsWith('session-')) {
    try {
      await supabase.from('ai_messages').insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: rawText,
        },
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResult.content,
        },
      ]);

      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (saveErr) {
      console.warn('Could not persist messages to ai_messages:', saveErr);
    }
  }

  return {
    conversationId: conversationId!,
    userMessage,
    assistantMessage,
  };
}

/**
 * Delete a conversation
 */
export async function deleteConversationAction(conversationId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return false;
    }

    const supabase: any = await createClient();
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);

    return !error;
  } catch {
    return false;
  }
}
