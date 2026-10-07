import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { getStudentConversationsAction } from '@/lib/ai/actions';
import { AIChatInterface } from '@/components/ai/ai-chat-interface';

export const dynamic = 'force-dynamic';

export default async function StudentAIPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    redirect('/login?unauthorized=true');
  }

  const initialConversations = await getStudentConversationsAction();

  return (
    <div className="w-full py-1">
      <AIChatInterface
        initialConversations={initialConversations}
        studentName={user.name}
      />
    </div>
  );
}
