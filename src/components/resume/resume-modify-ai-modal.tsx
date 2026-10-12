'use client';

import { useState } from 'react';
import { X, Wand2, Send, Bot, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

interface ResumeModifyAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumePath: string;
  onReplaceInitiate: () => void;
}

export function ResumeModifyAIModal({ isOpen, onClose, resumePath, onReplaceInitiate }: ResumeModifyAIModalProps) {
  const [instruction, setInstruction] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleModify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setIsLoading(true);
    setResponse('');
    setError(null);
    setIsCopied(false);

    try {
      const res = await fetch('/api/resume/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'modify', resumePath, prompt: instruction }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to modify resume');
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

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApplyChanges = () => {
    // The system requires PDF uploads. 
    // We instruct the user to use the generated text in their source doc.
    // Close modal and trigger the replace flow.
    onClose();
    onReplaceInitiate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-surface border border-border rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 text-foreground">
            <Wand2 className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Modify Resume with AI</h2>
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
              Tell CampusConnect AI how you want to improve your resume. The AI will strictly use your existing content and will not invent fake information.
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
              <li>"Improve my project descriptions using action verbs"</li>
              <li>"Make my summary more professional"</li>
              <li>"Rewrite my skills section to highlight web development"</li>
            </ul>
          </div>

          {error && (
            <Alert variant="destructive" title="Error">
              {error}
            </Alert>
          )}

          {response && (
            <div className="bg-elevated rounded-md p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-accent font-medium text-sm">
                  <Bot className="w-4 h-4" />
                  Proposed Revisions
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopy}
                  className="h-8 gap-2 text-muted hover:text-foreground"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono bg-background p-4 rounded border border-border max-h-[300px] overflow-y-auto">
                {response}
              </div>
              
              {!isLoading && (
                <div className="mt-4 p-3 bg-[#1A110B] border border-[#332211] rounded text-xs text-[#FF8844]">
                  <p className="font-semibold mb-1">How to apply these changes:</p>
                  <p>CampusConnect requires formal PDF resumes. Please copy the text above, update your original document (Word/Google Docs), export a new PDF, and click Apply Changes to upload the replacement.</p>
                </div>
              )}
            </div>
          )}
          
          {isLoading && !response && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="p-4 border-t border-border bg-elevated flex flex-col gap-3">
          <form onSubmit={handleModify} className="flex gap-3">
            <Input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Improve my project descriptions..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !instruction.trim()}
              className="gap-2 shrink-0"
            >
              <Send className="w-4 h-4" />
              Generate
            </Button>
          </form>

          {response && !isLoading && (
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleApplyChanges} className="bg-accent hover:bg-accent/90 text-white">
                Apply Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
