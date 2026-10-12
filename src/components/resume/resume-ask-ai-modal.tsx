'use client';

import { useState } from 'react';
import { X, Sparkles, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

interface ResumeAskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumePath: string;
}

export function ResumeAskAIModal({ isOpen, onClose, resumePath }: ResumeAskAIModalProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setResponse('');
    setError(null);

    try {
      const res = await fetch('/api/resume/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ask', resumePath, prompt: question }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to analyze resume');
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setResponse((prev) => prev + text);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-surface border border-border rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Ask AI About Your Resume</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-elevated rounded-md p-4 text-sm text-muted border border-border">
            <p>
              Ask any question about your uploaded resume. CampusConnect AI will analyze your actual document and provide targeted advice.
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
              <li>"What are the strongest parts of my resume?"</li>
              <li>"What skills are missing for software developer roles?"</li>
              <li>"Is my resume ATS friendly?"</li>
            </ul>
          </div>

          {error && (
            <Alert variant="destructive" title="Error">
              {error}
            </Alert>
          )}

          {response && (
            <div className="bg-elevated rounded-md p-4 border border-border">
              <div className="flex items-center gap-2 mb-3 text-accent font-medium text-sm">
                <Bot className="w-4 h-4" />
                CampusConnect AI
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {response}
              </div>
            </div>
          )}
          
          {isLoading && !response && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-elevated">
          <form onSubmit={handleAsk} className="flex gap-3">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your resume..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !question.trim()}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Ask
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
