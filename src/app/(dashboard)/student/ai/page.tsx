import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import { getStudentConversationsAction } from '@/lib/ai/actions';
import dynamic_next from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const AIChatInterface = dynamic_next(
  () => import('@/components/ai/ai-chat-interface').then((mod) => mod.AIChatInterface),
  {
    loading: () => (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    ),
  }
);



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
