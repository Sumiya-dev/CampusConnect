import OpenAI from 'openai';

export interface AIServiceStreamOptions {
  prompt: string;
  systemPrompt?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

export interface AIServiceGenerateOptions {
  prompt: string;
  systemPrompt?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are CampusConnect AI, an assistant for university students.
Help with placements, interview preparation, programming, technical subjects, resumes and career preparation.
Give accurate, concise and practical answers.
Never invent CampusConnect data.
When answering questions requiring platform data, use only verified data provided in the prompt.
Never expose private student information or system secrets.`;

/**
 * Gets a configured OpenAI client instance server-side.
 * Never exposes the API key to client components or browser JavaScript.
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === 'your-openai-api-key') {
    throw new Error('OPENAI_API_KEY is not configured.');
  }
  return new OpenAI({ apiKey });
}

/**
 * Gets the configured OpenAI model name from environment or defaults to gpt-4o-mini.
 */
export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
}

/**
 * Central, reusable server-side OpenAI Service for CampusConnect.
 * Powers CampusConnect AI Chat and all future AI modules (Resume AI, Prep AI, Mock Tests, Interview Coach).
 */
export class CampusConnectAIService {
  /**
   * Primary streaming completion method using OpenAI.
   * Streams tokens directly via ReadableStream as they are generated for ultra-low latency.
   */
  static async streamCompletion(
    options: AIServiceStreamOptions
  ): Promise<ReadableStream<Uint8Array>> {
    const openai = getOpenAIClient();
    const model = getOpenAIModel();
    const systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const encoder = new TextEncoder();

    // Prepare conversation messages (last 6-8 messages for context efficiency)
    const recentHistory = Array.isArray(options.conversationHistory)
      ? options.conversationHistory.slice(-8)
      : [];

    return new ReadableStream({
      async start(controller) {
        try {
          const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...recentHistory.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user' as const, content: options.prompt.trim() },
          ];

          // Primary: OpenAI Chat Completions streaming (universal, fast TTFT for gpt-4o-mini)
          try {
            const chatStream = await openai.chat.completions.create({
              model,
              messages,
              stream: true,
              temperature: options.temperature ?? 0.3,
              max_tokens: options.maxTokens ?? 1500,
            });

            for await (const chunk of chatStream) {
              const delta = chunk.choices[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(delta));
              }
            }
            controller.close();
            return;
          } catch {
            // If model specifically requires responses endpoint, attempt responses API
            const inputItems = [
              ...recentHistory.map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
              })),
              {
                role: 'user' as const,
                content: options.prompt.trim(),
              },
            ];

            const responseStream = await openai.responses.create({
              model,
              instructions: systemPrompt,
              input: inputItems as Array<{ role: 'user' | 'assistant'; content: string }>,
              stream: true,
              temperature: options.temperature ?? 0.3,
              max_output_tokens: options.maxTokens ?? 1500,
            });

            for await (const event of responseStream) {
              if (event.type === 'response.output_text.delta' && event.delta) {
                controller.enqueue(encoder.encode(event.delta));
              }
            }
            controller.close();
          }
        } catch (err: unknown) {
          console.error('OpenAI stream generation error:', err);
          const errMsg = err instanceof Error ? err.message : '';
          const errorMsg =
            errMsg === 'OPENAI_API_KEY is not configured.'
              ? 'OPENAI_API_KEY is not configured. Please set OPENAI_API_KEY in your environment variables to use CampusConnect AI.'
              : 'CampusConnect AI is temporarily unavailable. Please try again.';
          controller.enqueue(encoder.encode(errorMsg));
          controller.close();
        }
      },
    });
  }

  /**
   * Non-streaming completion for background tasks and future analytical modules.
   */
  static async generateCompletion(options: AIServiceGenerateOptions): Promise<string> {
    const openai = getOpenAIClient();
    const model = getOpenAIModel();
    const systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;

    const recentHistory = Array.isArray(options.conversationHistory)
      ? options.conversationHistory.slice(-8)
      : [];

    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...recentHistory.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: options.prompt.trim() },
      ];

      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 1500,
      });

      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (err: unknown) {
      console.error('OpenAI generation error:', err);
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg === 'OPENAI_API_KEY is not configured.') {
        throw new Error('OPENAI_API_KEY is not configured.');
      }
      throw new Error('CampusConnect AI is temporarily unavailable. Please try again.');
    }
  }

  // ─── REUSABLE METHODS FOR FUTURE MODULES ───

  /**
   * Dedicated entry point for Resume AI
   */
  static async analyzeResume(resumeText: string, targetRole?: string): Promise<string> {
    return this.generateCompletion({
      systemPrompt:
        'You are CampusConnect Resume AI. Analyze the student resume for ATS compatibility, action verbs, quantified metrics, and suggest targeted improvements for campus placements.',
      prompt: `Analyze this resume${targetRole ? ` for the target role "${targetRole}"` : ''}:\n\n${resumeText}`,
    });
  }

  /**
   * Dedicated entry point for Preparation AI & Personalized Study Plans
   */
  static async generatePreparationPlan(
    studentDetails: { department: string; year: number; cgpa: number; skills: string[] },
    targetCompanyOrRole?: string
  ): Promise<string> {
    return this.generateCompletion({
      systemPrompt:
        'You are CampusConnect Preparation AI. Build a structured, actionable technical and aptitude preparation plan tailored to the student academic standing.',
      prompt: `Create a preparation plan for a Year ${studentDetails.year} student in ${studentDetails.department} with skills [${studentDetails.skills.join(', ')}] targeting ${targetCompanyOrRole || 'Software Engineering'}.`,
    });
  }

  /**
   * Dedicated entry point for Mock Test Analysis
   */
  static async analyzeMockTest(testResults: Record<string, unknown>): Promise<string> {
    return this.generateCompletion({
      systemPrompt:
        'You are CampusConnect Assessment AI. Analyze mock test results, identify strong areas and skill gaps, and provide focused recommendations.',
      prompt: `Evaluate these assessment results:\n\n${JSON.stringify(testResults, null, 2)}`,
    });
  }

  /**
   * Dedicated entry point for Interview Coach
   */
  static async generateInterviewQuestions(
    role: string,
    roundType: 'technical' | 'hr' | 'coding'
  ): Promise<string> {
    return this.generateCompletion({
      systemPrompt:
        'You are CampusConnect Interview Coach. Provide realistic, company-tested interview questions with tips on what interviewers look for.',
      prompt: `Generate top placement interview questions for a "${role}" position for a ${roundType} round.`,
    });
  }
}
