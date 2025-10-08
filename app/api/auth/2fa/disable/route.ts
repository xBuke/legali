import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for the authenticated user
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: '2FA functionality temporarily disabled' },
    { status: 501 }
  );
}