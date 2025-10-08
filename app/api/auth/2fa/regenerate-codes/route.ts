import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/2fa/regenerate-codes
 * Regenerate backup codes for 2FA
 */
export async function POST() {
  return NextResponse.json(
    { error: '2FA functionality temporarily disabled' },
    { status: 501 }
  );
}