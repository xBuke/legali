import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

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

    // Get historical revenue data for forecasting
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    const monthlyRevenue = await db.invoice.groupBy({
      by: ['issueDate'],
      where: {
        client: { organizationId },
        status: 'PAID',
        issueDate: { gte: sixMonthsAgo },
      },
      _sum: { total: true },
      orderBy: { issueDate: 'desc' },
    });

    // Calculate average monthly revenue
    const totalRevenue = monthlyRevenue.reduce((sum, month) => sum + (month._sum.total || 0), 0);
    const averageMonthlyRevenue = monthlyRevenue.length > 0 ? totalRevenue / monthlyRevenue.length : 0;

    // Simple forecasting based on historical trends
    const growthRate = 0.05; // 5% monthly growth assumption
    
    const forecast = {
      revenue: {
        nextMonth: averageMonthlyRevenue * (1 + growthRate),
        nextQuarter: averageMonthlyRevenue * (1 + growthRate) * 3,
        nextYear: averageMonthlyRevenue * (1 + growthRate) * 12,
      },
      cases: {
        expected: Math.round(averageMonthlyRevenue / 2000), // Assuming 2000 EUR per case
        capacity: Math.round(averageMonthlyRevenue / 2000) * 1.2, // 20% capacity buffer
      },
      growth: {
        clientGrowth: 8.5, // Mock growth percentage
        revenueGrowth: growthRate * 100,
      },
    };

    return NextResponse.json(forecast);
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
