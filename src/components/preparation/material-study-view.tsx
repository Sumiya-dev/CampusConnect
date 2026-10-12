'use client';

import { useState, useTransition } from 'react';
import { PreparationMaterial, PreparationProgressStatus } from '@/lib/types/preparation.types';
import { updatePreparationProgressAction } from '@/lib/preparation/actions';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Lightbulb,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface MaterialStudyViewProps {
  material: PreparationMaterial;
}

export function MaterialStudyView({ material }: MaterialStudyViewProps) {
  const initialStatus = material.progress?.status || 'not_started';
  const [hasStarted, setHasStarted] = useState(
    initialStatus === 'in_progress' || initialStatus === 'completed'
  );
  const [status, setStatus] = useState<PreparationProgressStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleStartGuide = () => {
    setHasStarted(true);
    if (status === 'not_started') {
      setStatus('in_progress');
      startTransition(async () => {
        await updatePreparationProgressAction(material.id, 'in_progress');
      });
    }
  };

  const handleToggleCompleted = () => {
    const nextStatus: PreparationProgressStatus =
      status === 'completed' ? 'in_progress' : 'completed';
    setStatus(nextStatus);
    startTransition(async () => {
      await updatePreparationProgressAction(material.id, nextStatus);
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {!hasStarted ? (
        /* ========================================================================= */
        /* BRIEFING SCREEN: Objectives & Instructions First + Start/Proceed Button   */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* 1. Learning Objectives */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold uppercase tracking-wider text-foreground">
              Learning Objectives
            </h2>
            <ul className="space-y-3 text-base text-foreground pl-1">
              {material.key_takeaways && material.key_takeaways.length > 0 ? (
                material.key_takeaways.map((obj, i) => (
                  <li key={i} className="flex items-start gap-3 leading-relaxed">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span>{obj}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-3 leading-relaxed">
                  <span className="text-accent font-bold mt-0.5">•</span>
                  <span>
                    Master the fundamental algorithms, data structures, and evaluation rubrics required for campus recruitment rounds.
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* 2. Instructions & Study Guidelines */}
          <div className="space-y-4 pt-8 border-t border-border">
            <h2 className="text-base font-semibold uppercase tracking-wider text-foreground">
              Instructions & Study Guidelines
            </h2>
            <div className="space-y-3 text-base text-muted leading-relaxed pl-1">
              <p>
                1. Review the foundational guide and study the trade-offs, invariants, and edge conditions.
              </p>
              <p>
                2. Examine implementation blueprints and verify you understand both time and space complexity.
              </p>
              <p>
                3. Walk through the attached interview questions: formulate your verbal answers before reading the model responses.
              </p>
              <p>
                4. When finished, mark this module as Completed to record your placement preparation progress.
              </p>
            </div>
          </div>

          {/* 3. Proceed / Start Button */}
          <div className="pt-8 border-t border-border flex items-center justify-between">
            <span className="text-base text-muted">
              Self-paced guide • {material.questions?.length || 0} questions attached
            </span>

            <Button
              onClick={handleStartGuide}
              disabled={isPending}
              className="bg-accent hover:bg-accent/90 text-white text-base px-8 py-2.5 h-auto gap-2"
            >
              <span>Start Guide</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* STUDY GUIDE VIEW: Content & Interview Scenarios (Clean, No Box Format)    */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Top Control Strip */}
          <div className="flex items-center justify-between pb-6 border-b border-border text-base">
            <button
              onClick={() => setHasStarted(false)}
              className="text-muted hover:text-foreground flex items-center gap-2 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Review Objectives & Instructions</span>
            </button>

            <div className="flex items-center gap-4">
              <span className="text-muted">
                Status:{' '}
                <strong
                  className={
                    status === 'completed' ? 'text-green-500' : 'text-accent'
                  }
                >
                  {status === 'completed' ? 'Completed' : 'In Progress'}
                </strong>
              </span>

              <Button
                size="sm"
                onClick={handleToggleCompleted}
                disabled={isPending}
                variant={status === 'completed' ? 'outline' : 'default'}
                className={`text-base gap-2 h-10 px-4 ${
                  status === 'completed'
                    ? 'border-green-500/40 text-green-500 hover:bg-green-500/10'
                    : 'bg-green-500 hover:bg-green-500/90 text-white'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {status === 'completed'
                    ? 'Completed ✓'
                    : 'Mark as Completed'}
                </span>
              </Button>
            </div>
          </div>

          {/* Study Guide Content */}
          <div className="py-6 border-b border-border">
            <h2 className="text-lg font-semibold uppercase tracking-wider text-foreground mb-4">
              Instructional Guide
            </h2>
            <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
              {material.content}
            </div>
          </div>

          {/* Curated Interview Questions Section */}
          {material.questions && material.questions.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h2 className="text-base font-semibold uppercase tracking-wider text-foreground">
                  Targeted Interview Questions & Model Answers
                </h2>
                <span className="text-base text-muted">
                  {material.questions.length}{' '}
                  {material.questions.length === 1 ? 'scenario' : 'scenarios'}
                </span>
              </div>

              <div className="divide-y divide-border">
                {material.questions.map((q, idx) => (
                  <div key={q.id} className="py-6 space-y-4 first:pt-4">
                    <div className="flex items-center justify-between text-base">
                      <span className="font-semibold text-foreground">
                        Question {idx + 1} • {q.interview_type}
                      </span>
                      <span className="text-muted">{q.difficulty}</span>
                    </div>

                    <p className="text-base font-medium text-accent leading-relaxed">
                      {q.question}
                    </p>

                    <div className="space-y-2">
                      <span className="text-sm uppercase font-bold text-green-500 tracking-wider block">
                        Model Answer & Reasoning
                      </span>
                      <p className="text-base text-muted leading-relaxed whitespace-pre-wrap">
                        {q.answer_guide}
                      </p>
                    </div>

                    {q.sample_code && (
                      <details className="group border border-border rounded-md overflow-hidden bg-surface">
                        <summary className="cursor-pointer bg-elevated px-4 py-3 text-sm font-semibold uppercase tracking-wider text-muted hover:text-foreground hover:bg-[#1A1A1A] transition-colors select-none list-none flex items-center justify-between">
                          <span>View Code & Implementation</span>
                          <span className="transition-transform duration-200 group-open:-rotate-180">▼</span>
                        </summary>
                        <div className="p-4 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm uppercase font-bold text-muted tracking-wider">
                              <Code2 className="h-4 w-4 text-accent" />
                              <span>Implementation Blueprint</span>
                            </div>
                            <pre className="bg-elevated p-4 rounded-md text-foreground font-mono text-sm overflow-x-auto leading-relaxed border border-border">
                              <code>{q.sample_code}</code>
                            </pre>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Completion Action */}
          <div className="pt-8 border-t border-border flex items-center justify-between">
            <span className="text-base text-muted">
              {status === 'completed'
                ? 'Module completed. Ready for review or next topic.'
                : 'Mark completed once you have practiced the concepts and questions.'}
            </span>

            <Button
              onClick={handleToggleCompleted}
              disabled={isPending}
              variant={status === 'completed' ? 'outline' : 'default'}
              className={`text-base gap-2 h-10 px-6 ${
                status === 'completed'
                  ? 'border-green-500/40 text-green-500 hover:bg-green-500/10'
                  : 'bg-green-500 hover:bg-green-500/90 text-white'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {status === 'completed' ? 'Completed ✓' : 'Mark as Completed'}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
