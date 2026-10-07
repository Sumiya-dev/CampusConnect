import { AIMessage, StudentAIContext } from '../types/ai.types';
import { CampusConnectAIService } from './service';

export interface AIProviderRequest {
  userMessage: string;
  conversationHistory: AIMessage[];
  studentContext?: StudentAIContext | null;
}

export interface AIProviderResponse {
  content: string;
  provider: 'openai';
}

/**
 * Server-side OpenAI provider integration for CampusConnect AI.
 * Directly routes queries to the configured OpenAI model.
 */
export async function generateAIResponse(
  request: AIProviderRequest
): Promise<AIProviderResponse> {
  const content = await CampusConnectAIService.generateCompletion({
    prompt: request.userMessage,
    conversationHistory: request.conversationHistory,
  });

  return {
    content,
    provider: 'openai',
  };
}
