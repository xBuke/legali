import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/2fa/setup
 * Generate 2FA secret and QR code for user setup
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: '2FA functionality temporarily disabled' },
    { status: 501 }
  );
}
