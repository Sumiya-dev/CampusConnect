import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LegacyPreparationRoute({ params }: PageProps) {
  const { id } = await params;
  redirect(`/student/preparation/material/${id}`);
}
