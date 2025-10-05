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

    // Get overdue invoices
    const overdueInvoices = await db.invoice.count({
      where: {
        client: { organizationId },
        status: 'SENT',
        dueDate: { lt: new Date() },
      },
    }).catch((error) => {
      console.error('Error fetching overdue invoices:', error);
      return 0;
    });

    // Get cases approaching deadlines
    const upcomingDeadlines = await db.caseDeadline.count({
      where: {
        organizationId,
        status: 'pending',
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
        case: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      },
    }).catch((error) => {
      console.error('Error fetching upcoming deadlines:', error);
      return 0;
    });

    // Get low client satisfaction cases
    const lowSatisfactionCases = await db.case.count({
      where: {
        client: { organizationId },
        status: 'CLOSED',
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        // Add satisfaction rating filter when available
      },
      take: 1000, // Limit to prevent timeout
    }).catch((error) => {
      console.error('Error fetching low satisfaction cases:', error);
      return 0;
    });

    const alerts = [];

    // Overdue invoices alert
    if (overdueInvoices > 0) {
      alerts.push({
        id: 'overdue-invoices',
        type: 'warning',
        title: 'Dospjeli računi',
        message: `${overdueInvoices} računa je dospjelo za naplatu`,
        timestamp: new Date().toISOString(),
        action: 'Pregled računa',
      });
    }

    // Upcoming deadlines alert
    if (upcomingDeadlines > 0) {
      alerts.push({
        id: 'upcoming-deadlines',
        type: 'info',
        title: 'Predstojeći rokovi',
        message: `${upcomingDeadlines} predmeta ima rokovi u sljedećih 7 dana`,
        timestamp: new Date().toISOString(),
        action: 'Pregled predmeta',
      });
    }

    // Revenue trend alert
    const currentMonthRevenue = await db.invoice.aggregate({
      where: {
        client: { organizationId },
        issueDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        status: 'PAID',
      },
      _sum: { total: true },
    }).catch((error) => {
      console.error('Error fetching current month revenue:', error);
      return { _sum: { total: 0 } };
    });

    const previousMonthRevenue = await db.invoice.aggregate({
      where: {
        client: { organizationId },
        issueDate: { 
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
        },
        status: 'PAID',
      },
      _sum: { total: true },
    }).catch((error) => {
      console.error('Error fetching previous month revenue:', error);
      return { _sum: { total: 0 } };
    });

    const currentRevenue = currentMonthRevenue._sum.total || 0;
    const previousRevenue = previousMonthRevenue._sum.total || 0;
    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    if (revenueTrend < -10) {
      alerts.push({
        id: 'revenue-decline',
        type: 'error',
        title: 'Pad prihoda',
        message: `Prihod je pao za ${Math.abs(revenueTrend).toFixed(1)}% u odnosu na prošli mjesec`,
        timestamp: new Date().toISOString(),
        action: 'Analiza prihoda',
      });
    } else if (revenueTrend > 20) {
      alerts.push({
        id: 'revenue-growth',
        type: 'success',
        title: 'Rast prihoda',
        message: `Prihod je porastao za ${revenueTrend.toFixed(1)}% u odnosu na prošli mjesec`,
        timestamp: new Date().toISOString(),
        action: 'Pregled analitike',
      });
    }

    // System performance alert (mock)
    alerts.push({
      id: 'system-performance',
      type: 'info',
      title: 'Sistemska performansa',
      message: 'Sve sistemske komponente rade optimalno',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
