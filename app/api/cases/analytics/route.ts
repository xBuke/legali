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

    // Get basic case statistics
    const totalCases = await db.case.count({
      where: { client: { organizationId } },
    });

    const activeCases = await db.case.count({
      where: { 
        client: { organizationId },
        status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] },
      },
    });

    const closedCases = await db.case.count({
      where: { 
        client: { organizationId },
        status: { in: ['CLOSED_WON', 'CLOSED_LOST', 'CLOSED_SETTLED'] },
      },
    });

    // Calculate average case duration
    const closedCasesWithDates = await db.case.findMany({
      where: { 
        client: { organizationId },
        status: { in: ['CLOSED_WON', 'CLOSED_LOST', 'CLOSED_SETTLED'] },
        closedAt: { not: null },
      },
      select: {
        createdAt: true,
        closedAt: true,
      },
      take: 1000, // Limit to prevent timeout
    });

    const averageCaseDuration = closedCasesWithDates.length > 0
      ? closedCasesWithDates.reduce((sum, case_) => {
          const duration = case_.closedAt!.getTime() - case_.createdAt.getTime();
          return sum + (duration / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / closedCasesWithDates.length
      : 0;

    // Calculate success rate
    const successfulCases = await db.case.count({
      where: { 
        client: { organizationId },
        status: 'CLOSED_WON',
      },
    });

    const successRate = closedCases > 0 ? (successfulCases / closedCases) * 100 : 0;

    // Calculate revenue per case
    const totalRevenue = await db.invoice.aggregate({
      where: {
        client: { organizationId },
        status: 'PAID',
      },
      _sum: { total: true },
    }).catch((error) => {
      console.error('Error fetching total revenue:', error);
      return { _sum: { total: 0 } };
    });

    const revenuePerCase = totalCases > 0 ? (totalRevenue._sum.total || 0) / totalCases : 0;

    // Get cases by type
    const casesByType = await db.case.groupBy({
      by: ['caseType'],
      where: { client: { organizationId } },
      _count: { id: true },
    });

    const casesByTypeMap = casesByType.reduce((acc, item) => {
      acc[item.caseType] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get cases by status
    const casesByStatus = await db.case.groupBy({
      by: ['status'],
      where: { client: { organizationId } },
      _count: { id: true },
    });

    const casesByStatusMap = casesByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get cases by priority
    const casesByPriority = await db.case.groupBy({
      by: ['priority'],
      where: { client: { organizationId } },
      _count: { id: true },
    });

    const casesByPriorityMap = casesByPriority.reduce((acc, item) => {
      acc[item.priority] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get monthly trends for the last 12 months (simplified to prevent timeout)
    const now = new Date();
    const monthlyTrends = [];
    
    // Limit to last 6 months to reduce query load
    for (let i = 5; i >= 0; i--) {
      try {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthStart.toLocaleDateString('hr-HR', { 
          month: 'short', 
          year: 'numeric' 
        });

        const opened = await db.case.count({
          where: {
            client: { organizationId },
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        });

        const closed = await db.case.count({
          where: {
            client: { organizationId },
            status: { in: ['CLOSED_WON', 'CLOSED_LOST', 'CLOSED_SETTLED'] },
            closedAt: { gte: monthStart, lte: monthEnd },
          },
        });

        const revenue = await db.invoice.aggregate({
          where: {
            client: { organizationId },
            status: 'PAID',
            issueDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { total: true },
        });

        monthlyTrends.push({
          month: monthName,
          opened,
          closed,
          revenue: revenue._sum.total || 0,
        });
      } catch (error) {
        console.error(`Error fetching data for month ${i}:`, error);
        // Continue with next month
      }
    }

    // Get top clients
    const topClients = await db.case.groupBy({
      by: ['clientId'],
      where: { client: { organizationId } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topClientsWithDetails = await Promise.all(
      topClients.map(async (client) => {
        try {
          const clientDetails = await db.client.findUnique({
            where: { id: client.clientId },
            select: { firstName: true, lastName: true, companyName: true },
          });

          const clientRevenue = await db.invoice.aggregate({
            where: {
              clientId: client.clientId,
              status: 'PAID',
            },
            _sum: { total: true },
          });

          const clientName = clientDetails?.companyName || 
            `${clientDetails?.firstName || ''} ${clientDetails?.lastName || ''}`.trim() || 
            'Nepoznat klijent';

          return {
            clientId: client.clientId,
            clientName,
            caseCount: client._count.id,
            totalRevenue: clientRevenue._sum.total || 0,
          };
        } catch (error) {
          console.error(`Error fetching client details for ${client.clientId}:`, error);
          return {
            clientId: client.clientId,
            clientName: 'Nepoznat klijent',
            caseCount: client._count.id,
            totalRevenue: 0,
          };
        }
      })
    );

    // Get team performance
    const teamMembers = await db.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const teamPerformance = await Promise.all(
      teamMembers.map(async (member) => {
        try {
          const casesAssigned = await db.case.count({
            where: {
              client: { organizationId },
              assignedToId: member.id,
            },
          });

          const casesCompleted = await db.case.count({
            where: {
              client: { organizationId },
              assignedToId: member.id,
              status: { in: ['CLOSED_WON', 'CLOSED_LOST', 'CLOSED_SETTLED'] },
            },
          });

          // Calculate average resolution time for completed cases (limited)
          const completedCases = await db.case.findMany({
            where: {
              client: { organizationId },
              assignedToId: member.id,
              status: { in: ['CLOSED_WON', 'CLOSED_LOST', 'CLOSED_SETTLED'] },
              closedAt: { not: null },
            },
            select: {
              createdAt: true,
              closedAt: true,
            },
            take: 100, // Limit to prevent timeout
          });

          const averageResolutionTime = completedCases.length > 0
            ? completedCases.reduce((sum, case_) => {
                const duration = case_.closedAt!.getTime() - case_.createdAt.getTime();
                return sum + (duration / (1000 * 60 * 60 * 24)); // Convert to days
              }, 0) / completedCases.length
            : 0;

          const userName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;

          return {
            userId: member.id,
            userName,
            casesAssigned,
            casesCompleted,
            averageResolutionTime,
          };
        } catch (error) {
          console.error(`Error fetching team performance for ${member.id}:`, error);
          return {
            userId: member.id,
            userName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
            casesAssigned: 0,
            casesCompleted: 0,
            averageResolutionTime: 0,
          };
        }
      })
    );

    const analytics = {
      totalCases,
      activeCases,
      closedCases,
      averageCaseDuration,
      successRate,
      revenuePerCase,
      casesByType: casesByTypeMap,
      casesByStatus: casesByStatusMap,
      casesByPriority: casesByPriorityMap,
      monthlyTrends,
      topClients: topClientsWithDetails,
      teamPerformance: teamPerformance.filter(member => member.casesAssigned > 0),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching case analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
