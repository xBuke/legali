import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/activity-logs - List activity logs for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    const where: any = {
      organizationId: user.organizationId,
    };

    if (caseId) {
      where.entity = 'Case'; // Filter for case-related activities
      where.entityId = caseId;
    }

    const activityLogs = await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50, // Limit to recent activities
    });

    return NextResponse.json(activityLogs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju aktivnosti' },
      { status: 500 }
    );
  }
}
