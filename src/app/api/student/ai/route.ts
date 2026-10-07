import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/user';
import { detectRelevantTools, executeCampusConnectTool } from '@/lib/ai/tools';
import { CampusConnectAIService } from '@/lib/ai/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE_SYSTEM_PROMPT = `You are CampusConnect AI, an assistant for university students.
Help with placements, interview preparation, programming, technical subjects, resumes and career preparation.
Give accurate, concise and practical answers.
Never invent CampusConnect data.
When answering questions requiring platform data, use only verified data provided in the request.
Never expose private student information or system secrets.`;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user server-side
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return new Response('Unauthorized: Please sign in as a student to access CampusConnect AI.', {
        status: 401,
      });
    }

    // 2. Parse request payload
    const body = await req.json();
    const rawMessage = (body.message || '').trim();
    if (!rawMessage) {
      return new Response('Message cannot be empty.', { status: 400 });
    }

    // 3. Strict Check: If OPENAI_API_KEY is missing, clearly report it (no fake fallback!)
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey || apiKey === 'your-openai-api-key') {
      return new Response(
        'OPENAI_API_KEY is not configured. Please set OPENAI_API_KEY in your environment variables to use CampusConnect AI.',
        {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      );
    }

    // 4. Conditional Tool & Platform Data Lookup
    // Normal/general questions execute ZERO tools and ZERO database queries!
    const relevantTools = detectRelevantTools(rawMessage);
    let platformContextSnippet = '';

    if (relevantTools.length > 0) {
      const toolResults: string[] = [];
      for (const toolName of relevantTools) {
        const result = await executeCampusConnectTool(toolName, {}, user.id);
        toolResults.push(`[${toolName}]: ${result}`);
      }
      platformContextSnippet = `\n\nVERIFIED CAMPUSCONNECT PLATFORM DATA:\n${toolResults.join('\n')}`;
    }

    const systemPrompt = `${BASE_SYSTEM_PROMPT}${platformContextSnippet}`;

    // 5. Call OpenAI Responses/Completions API via Centralized AI Service
    const stream = await CampusConnectAIService.streamCompletion({
      prompt: rawMessage,
      systemPrompt,
      conversationHistory: body.conversationHistory,
      temperature: 0.3,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err: unknown) {
    console.error('CampusConnect AI Route Error:', err);

    const errorMessage = err instanceof Error ? err.message : '';
    if (errorMessage === 'OPENAI_API_KEY is not configured.') {
      return new Response(
        'OPENAI_API_KEY is not configured. Please set OPENAI_API_KEY in your environment variables to use CampusConnect AI.',
        {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      );
    }

    return new Response('CampusConnect AI is temporarily unavailable. Please try again.', {
      status: 500,
    });
  }
}
