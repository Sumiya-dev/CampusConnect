import { redirect } from 'next/navigation';

export default async function FacultyTrainingGroupRedirect() {
  redirect('/faculty/classes');
}
