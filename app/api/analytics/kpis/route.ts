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

    // Get current and previous month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Revenue metrics
    const currentMonthRevenue = await db.invoice.aggregate({
      where: {
        client: { organizationId },
        issueDate: { gte: currentMonthStart },
        status: 'PAID',
      },
      _sum: { total: true },
    });

    const previousMonthRevenue = await db.invoice.aggregate({
      where: {
        client: { organizationId },
        issueDate: { 
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
        status: 'PAID',
      },
      _sum: { total: true },
    });

    const currentRevenue = currentMonthRevenue._sum.total || 0;
    const previousRevenue = previousMonthRevenue._sum.total || 0;
    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Productivity metrics
    const casesCompleted = await db.case.count({
      where: {
        client: { organizationId },
        status: 'CLOSED',
        updatedAt: { gte: currentMonthStart },
      },
    });

    const allCases = await db.case.findMany({
      where: {
        client: { organizationId },
        status: 'CLOSED',
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
      take: 1000, // Limit to prevent timeout
    });

    const averageResolutionTime = allCases.length > 0 
      ? allCases.reduce((sum, case_) => {
          const resolutionTime = case_.updatedAt.getTime() - case_.createdAt.getTime();
          return sum + (resolutionTime / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / allCases.length
      : 0;

    const billableHours = await db.timeEntry.aggregate({
      where: {
        case: { client: { organizationId } },
        isBillable: true,
        date: { gte: currentMonthStart },
      },
      _sum: { duration: true },
    });

    const totalBillableHours = (billableHours._sum.duration || 0) / 60; // Convert minutes to hours

    // Client satisfaction (mock data for now)
    const clientSatisfaction = {
      rating: 4.2,
      totalResponses: 15,
      trend: 5.2,
    };

    // Case success rate
    const totalCases = await db.case.count({
      where: {
        client: { organizationId },
      },
    });

    const successfulCases = await db.case.count({
      where: {
        client: { organizationId },
        status: 'CLOSED',
      },
    });

    const successRate = totalCases > 0 ? (successfulCases / totalCases) * 100 : 0;
    const caseSuccessTrend = 2.1; // Mock trend data

    const kpis = {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        trend: revenueTrend,
        forecast: currentRevenue * 1.1, // Simple forecast
      },
      productivity: {
        casesCompleted,
        averageResolutionTime: Math.round(averageResolutionTime),
        billableHours: Math.round(totalBillableHours),
        efficiency: 85, // Mock efficiency metric
      },
      clientSatisfaction,
      caseSuccess: {
        successRate,
        totalCases,
        trend: caseSuccessTrend,
      },
    };

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
