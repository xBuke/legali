import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = user.organization.id;

    // Get case distribution by status
    const caseDistribution = await db.case.groupBy({
      by: ['status'],
      where: {
        client: { organizationId },
      },
      _count: { id: true },
    });

    const totalCases = caseDistribution.reduce((sum, item) => sum + item._count.id, 0);

    const distributionData = caseDistribution.map(item => ({
      status: item.status,
      count: item._count.id,
      percentage: totalCases > 0 ? (item._count.id / totalCases) * 100 : 0,
    }));

    // Sort by count descending
    distributionData.sort((a, b) => b.count - a.count);

    return NextResponse.json(distributionData);
  } catch (error) {
    console.error('Error fetching case distribution data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
