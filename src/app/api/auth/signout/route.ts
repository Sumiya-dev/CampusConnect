import { NextResponse } from 'next/server';
import { signOutAction } from '@/lib/auth/actions';

export async function POST() {
  await signOutAction();
  return NextResponse.json({ success: true });
}
