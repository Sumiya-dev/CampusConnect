'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { AIConversation, AIMessage } from '@/lib/types/ai.types';
import { FormattedAIResponse } from './formatted-ai-response';
import { deleteConversationAction } from '@/lib/ai/actions';

interface ChatMessage extends AIMessage {
  isStreaming?: boolean;
}

interface AIChatInterfaceProps {
  initialConversations: AIConversation[];
  studentName?: string;
}

const SUGGESTED_QUESTIONS = [
  'Which drives am I eligible for?',
  'How should I prepare for software interviews?',
  'Explain binary search and its complexity',
  'What are the core OOP concepts?',
  'Explain polymorphism in Java',
  'What is DBMS normalization?',
];

export function AIChatInterface({
  initialConversations,
  studentName,
}: AIChatInterfaceProps) {
  const [conversations, setConversations] = useState<AIConversation[]>(initialConversations);

  // Sync fallback cached conversations strictly after hydration mount if initial was empty
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem('campusconnect_ai_conversations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConversations((prev) => (prev.length === 0 ? parsed : prev));
          }
        }
      } catch {}
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages change or streaming updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading]);

  // Persist conversations list to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && conversations.length > 0) {
      try {
        localStorage.setItem('campusconnect_ai_conversations', JSON.stringify(conversations));
      } catch {}
    }
  }, [conversations]);

  // User manually selects a past conversation from sidebar
  const handleSelectConversation = (convId: string) => {
    if (convId === activeConversationId) return;

    setActiveConversationId(convId);
    setErrorMessage(null);

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`campusconnect_ai_messages_${convId}`);
        if (stored) {
          setMessages(JSON.parse(stored));
          return;
        }
      } catch {}
    }
    setMessages([]);
  };

  const handleStartNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setErrorMessage(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = React.useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputValue).trim();
      if (!text || isLoading) return;

      setErrorMessage(null);
      setInputValue('');

      const now = Date.now();
      const targetConvId = activeConversationId || `conv-${now}`;
      const userMsgId = `usr-${now}`;
      const assistantMsgId = `ast-${now + 1}`;

      const userMsg: ChatMessage = {
        id: userMsgId,
        conversationId: targetConvId,
        role: 'user',
        content: text,
        createdAt: new Date(now).toISOString(),
      };

      const assistantMsgPlaceholder: ChatMessage = {
        id: assistantMsgId,
        conversationId: targetConvId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        createdAt: new Date(now + 1).toISOString(),
      };

      // 1. Immediately render user message & assistant streaming placeholder
      setMessages((prev) => [...prev, userMsg, assistantMsgPlaceholder]);
      setIsLoading(true);

      // If new conversation, update sidebar immediately
      if (!activeConversationId) {
        setActiveConversationId(targetConvId);
        const title = text.length > 30 ? text.slice(0, 28) + '...' : text;
        const newConv: AIConversation = {
          id: targetConvId,
          userId: '',
          title,
          createdAt: new Date(now).toISOString(),
          updatedAt: new Date(now).toISOString(),
        };
        setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== targetConvId)]);
      }

      try {
        // 2. Fast Streaming Request Pipeline
        // Send only recent window (last 6 messages)
        const recentHistory = messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/student/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationHistory: recentHistory,
          }),
        });

        if (!res.ok) {
          throw new Error('CampusConnect AI is temporarily unavailable. Please try again.');
        }

        if (!res.body) {
          throw new Error('No response received.');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const chunks: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          chunks.push(chunk);
          const currentText = chunks.join('');

          // Progressively update ONLY the streaming message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: currentText, isStreaming: true }
                : m
            )
          );
        }

        const finalText = chunks.join('');

        // 3. Mark streaming complete (enables full markdown formatting)
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: finalText, isStreaming: false }
              : m
          );

          // Persist to localStorage
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(
                `campusconnect_ai_messages_${targetConvId}`,
                JSON.stringify(updated)
              );
            } catch {}
          }

          return updated;
        });
      } catch (err: unknown) {
        console.error('Streaming error:', err);
        const errMessage =
          err instanceof Error
            ? err.message
            : 'CampusConnect AI is temporarily unavailable. Please try again.';
        setErrorMessage(errMessage);
        // Remove empty placeholder on error
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, inputValue, isLoading, messages]
  );

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await deleteConversationAction(convId);
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem(`campusconnect_ai_messages_${convId}`);
    }
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversationId === convId) {
      handleStartNewConversation();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
      {/* ─── SIDEBAR ─── */}
      <div
        className={`${
          isSidebarOpen ? 'w-64 border-r border-zinc-800' : 'w-0'
        } flex flex-col transition-all duration-200 bg-zinc-900/60 shrink-0 overflow-hidden`}
      >
        <div className="flex items-center justify-between p-3 border-b border-zinc-800">
          <button
            onClick={handleStartNewConversation}
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700/60"
          >
            <Plus className="h-3.5 w-3.5 text-orange-400" />
            <span>New Conversation</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Recent Conversations
          </div>

          {conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-zinc-500">
              No previous conversations.
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeConversationId;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-500 shrink-0 group-hover:text-zinc-400" />
                    <span className="truncate">{c.title || 'Conversation'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    type="button"
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1 rounded transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-orange-400 shrink-0" />
          <span>Real-time fast assistant</span>
        </div>
      </div>

      {/* ─── MAIN CHAT AREA ─── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-zinc-950">
        {/* Top Minimal Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              type="button"
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              title={isSidebarOpen ? 'Hide History' : 'Show History'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <span>CampusConnect AI</span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500">
            {studentName ? `Connected: ${studentName}` : 'Student Assistant'}
          </div>
        </div>

        {/* Message Viewport */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="mx-auto max-w-2xl pt-6 md:pt-10 text-center">
              <div className="mb-2 inline-flex items-center justify-center h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 text-orange-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">
                CampusConnect AI
              </h1>
              <p className="mt-1.5 text-xs md:text-sm text-zinc-400">
                Your AI assistant for placements, preparation and career guidance.
              </p>

              <div className="my-6 h-px w-full bg-zinc-800" />

              <div className="text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-3">
                  Suggested inquiries
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left text-xs text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850 hover:text-zinc-100 transition-colors"
                    >
                      <span className="truncate pr-2">{q}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Conversation Feed */
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {errorMessage && (
                <div className="flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <p>{errorMessage}</p>
                  </div>
                  <button
                    onClick={() => handleSendMessage(messages[messages.length - 1]?.content)}
                    type="button"
                    className="text-xs text-orange-400 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-zinc-800/80 bg-zinc-900/40 p-3 md:p-4">
          <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end rounded-lg border border-zinc-800 bg-zinc-950 focus-within:border-zinc-700 transition-colors">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about placements, preparation or your career..."
                rows={1}
                className="w-full resize-none bg-transparent px-3.5 py-3 text-xs md:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none min-h-[44px] max-h-36"
              />

              <div className="flex items-center p-2">
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 transition-colors"
                  title="Send query"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 px-1">
              <span>Press Enter to send, Shift+Enter for a new line</span>
              <span>Fast streaming response</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized MessageBubble: Prevents previous messages from re-rendering
 * when tokens are streaming into the current message.
 */
const MessageBubble = memo(
  function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';

    return (
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-[11px] font-medium text-zinc-400">
            {isUser ? 'You' : 'CampusConnect AI'}
          </span>
        </div>

        <div
          className={`w-full max-w-2xl rounded-lg px-4 py-3 text-sm ${
            isUser
              ? 'border border-zinc-800 bg-zinc-900 text-zinc-100'
              : 'border border-zinc-850 bg-zinc-900/40 text-zinc-200'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed text-zinc-200">
              {message.content}
            </p>
          ) : message.isStreaming && !message.content ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span>CampusConnect AI is thinking...</span>
            </div>
          ) : message.isStreaming ? (
            // Lightweight text rendering while streaming (NO heavy AST/syntax highlighting overhead!)
            <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 font-sans">
              {message.content}
            </div>
          ) : (
            // Full markdown and syntax highlighting only once streaming finishes
            <FormattedAIResponse content={message.content} />
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.message.id === next.message.id &&
      prev.message.content === next.message.content &&
      prev.message.isStreaming === next.message.isStreaming
    );
  }
);
