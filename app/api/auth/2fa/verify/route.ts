import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA code (TOTP or backup code) - supports both session-based and login flow
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: '2FA functionality temporarily disabled' },
    { status: 501 }
  );
}