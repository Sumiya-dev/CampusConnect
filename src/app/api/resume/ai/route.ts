import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CampusConnectAIService } from '@/lib/ai/service';

export async function POST(req: NextRequest) {
  try {
    // @ts-ignore
    const pdfParse = require('pdf-parse');
    const { action, resumePath, prompt } = await req.json();

    if (!action || !resumePath || !prompt) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('resumes')
      .download(resumePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download resume file' }, { status: 404 });
    }

    // 3. Extract text from PDF
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let resumeText = '';
    try {
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text.trim();
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      return NextResponse.json({ error: 'Failed to extract text from PDF. The file might be corrupted or image-based.' }, { status: 422 });
    }

    if (!resumeText) {
      return NextResponse.json({ error: 'No text could be extracted from the resume.' }, { status: 422 });
    }

    // 4. Construct System Prompt based on Action
    let systemPrompt = '';
    if (action === 'ask') {
      systemPrompt = `You are CampusConnect Resume AI. 
The user is asking a question about their uploaded resume.
Only use the provided resume content to answer. 
Be concise, practical, and helpful. 
Do NOT invent skills, experience, or projects that are not in the resume.

RESUME CONTENT:
${resumeText}`;
    } else if (action === 'modify') {
      systemPrompt = `You are CampusConnect Resume AI. 
The user wants to modify a section or aspect of their resume based on their instruction.
You must use the ACTUAL uploaded resume content. 
Generate the revised version or content based ONLY on the resume information.
NEVER invent skills, projects, experience, metrics, or education.
Output only the revised content clearly formatted in Markdown.

RESUME CONTENT:
${resumeText}`;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 5. Stream OpenAI Response
    const stream = await CampusConnectAIService.streamCompletion({
      systemPrompt,
      prompt: prompt,
      temperature: 0.2, // Low temperature to prevent hallucination
      maxTokens: 2000,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Resume AI route error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred processing your resume.' },
      { status: 500 }
    );
  }
}
