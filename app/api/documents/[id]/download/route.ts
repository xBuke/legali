import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { downloadDecryptedDocument } from '@/lib/document-storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/documents/[id]/download
 * Download and decrypt a document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Neautoriziran pristup' },
        { status: 401 }
      );
    }

    // Download and decrypt document
    const result = await downloadDecryptedDocument(
      params.id,
      session.user.id,
      session.user.organizationId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Greška pri preuzimanju dokumenta' },
        { status: 500 }
      );
    }

    // Return the decrypted file
    return new NextResponse(result.data as any, {
      headers: {
        'Content-Type': result.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': (result.data?.length || 0).toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { error: 'Greška pri preuzimanju dokumenta' },
      { status: 500 }
    );
  }
}

