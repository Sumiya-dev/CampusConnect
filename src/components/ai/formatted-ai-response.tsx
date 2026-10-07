'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';

interface FormattedAIResponseProps {
  content: string;
}

export function FormattedAIResponse({ content }: FormattedAIResponseProps) {
  // Split content by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          return <CodeBlock key={index} rawBlock={part} />;
        }
        return <TextSection key={index} text={part} />;
      })}
    </div>
  );
}

function CodeBlock({ rawBlock }: { rawBlock: string }) {
  const [copied, setCopied] = useState(false);

  // Extract language and code content
  const firstLineBreak = rawBlock.indexOf('\n');
  let lang = 'code';
  let code = '';

  if (firstLineBreak !== -1) {
    lang = rawBlock.slice(3, firstLineBreak).trim() || 'code';
    code = rawBlock.slice(firstLineBreak + 1, -3);
  } else {
    code = rawBlock.slice(3, -3);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-850 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
        <span className="font-mono text-[11px] uppercase tracking-wider">{lang}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs text-zinc-200 leading-normal">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TextSection({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header level 3 / 4
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-xs font-semibold uppercase tracking-wider text-zinc-200 pt-2">
              {renderInline(trimmed.replace('#### ', ''))}
            </h4>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-sm font-semibold text-zinc-100 pt-2 border-b border-zinc-800/80 pb-1">
              {renderInline(trimmed.replace('### ', ''))}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.slice(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-zinc-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-500 shrink-0" />
              <div className="flex-1 text-zinc-300">{renderInline(bulletContent)}</div>
            </div>
          );
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-mono text-xs text-zinc-400 shrink-0 mt-0.5">{numMatch[1]}.</span>
              <div className="flex-1 text-zinc-300">{renderInline(numMatch[2])}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-zinc-300 leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses bold, inline code, and links safely
 */
function renderInline(text: string): React.ReactNode {
  // Regex to match markdown links [text](url), bold **text**, and code `code`
  const tokenRegex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`)/g;
  const segments = text.split(tokenRegex);

  return segments.map((seg, i) => {
    if (seg.startsWith('[') && seg.includes('](') && seg.endsWith(')')) {
      const match = seg.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const linkText = match[1];
        const linkUrl = match[2];
        const isInternal = linkUrl.startsWith('/');
        if (isInternal) {
          return (
            <Link
              key={i}
              href={linkUrl}
              className="text-orange-400 underline underline-offset-2 hover:text-orange-300 transition-colors"
            >
              {linkText}
            </Link>
          );
        }
        return (
          <a
            key={i}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 underline underline-offset-2 hover:text-orange-300 transition-colors"
          >
            {linkText}
          </a>
        );
      }
    }

    if (seg.startsWith('**') && seg.endsWith('**') && seg.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-zinc-100">
          {seg.slice(2, -2)}
        </strong>
      );
    }

    if (seg.startsWith('`') && seg.endsWith('`') && seg.length >= 2) {
      return (
        <code
          key={i}
          className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-xs text-orange-200/90 border border-zinc-750"
        >
          {seg.slice(1, -1)}
        </code>
      );
    }

    return seg;
  });
}
