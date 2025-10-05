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

    // Get revenue data for the last 6 months (reduced from 12 to prevent timeout)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const monthlyRevenue = await db.invoice.groupBy({
      by: ['issueDate'],
      where: {
        client: { organizationId },
        status: 'PAID',
        issueDate: { gte: sixMonthsAgo },
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { issueDate: 'asc' },
    }).catch((error) => {
      console.error('Error fetching monthly revenue:', error);
      return [];
    });

    // Generate data for all 6 months, filling in missing months with 0
    const revenueData = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthName = monthDate.toLocaleDateString('hr-HR', { 
        month: 'short', 
        year: 'numeric' 
      });
      
      const monthData = monthlyRevenue.find(month => {
        try {
          const monthStart = new Date(month.issueDate.getFullYear(), month.issueDate.getMonth(), 1);
          return monthStart.getTime() === monthDate.getTime();
        } catch (error) {
          console.error('Error processing month data:', error);
          return false;
        }
      });

      revenueData.push({
        month: monthName,
        revenue: monthData?._sum.total || 0,
        invoices: monthData?._count.id || 0,
      });
    }

    return NextResponse.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
