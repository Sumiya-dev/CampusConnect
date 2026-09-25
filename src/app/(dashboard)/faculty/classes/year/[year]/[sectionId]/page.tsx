import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    year: string;
    sectionId: string;
  }>;
}

export default async function FacultySectionRedirectPage({ params }: PageProps) {
  const { year, sectionId } = await params;
  redirect(`/faculty/classes/year/${year}?section=${sectionId}`);
}
