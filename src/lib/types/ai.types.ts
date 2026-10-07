export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: AIMessage[];
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface StudentAIContext {
  studentId: string;
  name: string;
  department: string;
  program?: string;
  year: number;
  section?: string;
  cgpa: number;
  graduationYear?: number;
  skills: string[];
  placementStatus: string;
  resumeUploaded: boolean;
  resumeName?: string;
  applications: Array<{
    company: string;
    role: string;
    status: string;
    appliedAt: string;
    interviewDate?: string | null;
  }>;
  openDrives: Array<{
    id: string;
    company: string;
    role: string;
    packageDetails: string;
    location?: string | null;
    deadline: string;
    minCgpa: number;
    isEligible: boolean;
    reasons: string[];
  }>;
  preparationModules?: Array<{
    title: string;
    category: string;
    difficulty: string;
    progressPercentage?: number;
  }>;
  recentBulletins?: Array<{
    title: string;
    category: string;
    createdAt: string;
  }>;
}

export interface AISendMessageInput {
  conversationId?: string;
  message: string;
}

export interface AISendMessageResponse {
  conversationId: string;
  userMessage: AIMessage;
  assistantMessage: AIMessage;
  error?: string;
}
