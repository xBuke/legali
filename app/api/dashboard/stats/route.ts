import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Get current counts
    const [
      activeClients,
      openCases,
      totalDocuments,
      monthlyRevenue
    ] = await Promise.all([
      // Active clients count
      prisma.client.count({
        where: {
          organizationId: user.organizationId,
          status: 'ACTIVE',
          deletedAt: null
        }
      }),
      
      // Open cases count
      prisma.case.count({
        where: {
          organizationId: user.organizationId,
          status: 'OPEN',
          deletedAt: null
        }
      }),
      
      // Total documents count
      prisma.document.count({
        where: {
          organizationId: user.organizationId,
          deletedAt: null
        }
      }),
      
      // Monthly revenue (current month)
      prisma.invoice.aggregate({
        where: {
          organizationId: user.organizationId,
          status: 'PAID',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: {
          totalAmount: true
        }
      })
    ])

    // Get previous month data for trends
    const previousMonth = new Date()
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    const previousMonthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1)
    const previousMonthEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0)

    const [
      previousActiveClients,
      previousOpenCases,
      previousTotalDocuments,
      previousMonthlyRevenue
    ] = await Promise.all([
      prisma.client.count({
        where: {
          organizationId: user.organizationId,
          status: 'ACTIVE',
          deletedAt: null,
          createdAt: {
            lte: previousMonthEnd
          }
        }
      }),
      
      prisma.case.count({
        where: {
          organizationId: user.organizationId,
          status: 'OPEN',
          deletedAt: null,
          createdAt: {
            lte: previousMonthEnd
          }
        }
      }),
      
      prisma.document.count({
        where: {
          organizationId: user.organizationId,
          deletedAt: null,
          createdAt: {
            lte: previousMonthEnd
          }
        }
      }),
      
      prisma.invoice.aggregate({
        where: {
          organizationId: user.organizationId,
          status: 'PAID',
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          }
        },
        _sum: {
          totalAmount: true
        }
      })
    ])

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { trend: 'up' as const, percentage: current > 0 ? 100 : 0 }
      const percentage = Math.round(((current - previous) / previous) * 100)
      return {
        trend: percentage > 0 ? 'up' as const : percentage < 0 ? 'down' as const : 'stable' as const,
        percentage: Math.abs(percentage)
      }
    }

    const activeClientsTrend = calculateTrend(activeClients, previousActiveClients)
    const openCasesTrend = calculateTrend(openCases, previousOpenCases)
    const documentsTrend = calculateTrend(totalDocuments, previousTotalDocuments)
    const revenueTrend = calculateTrend(
      monthlyRevenue._sum.totalAmount || 0, 
      previousMonthlyRevenue._sum.totalAmount || 0
    )

    const stats = {
      activeClients: {
        current: activeClients,
        previous: previousActiveClients,
        ...activeClientsTrend
      },
      openCases: {
        current: openCases,
        previous: previousOpenCases,
        ...openCasesTrend
      },
      documentsUploaded: {
        current: totalDocuments,
        previous: previousTotalDocuments,
        ...documentsTrend
      },
      monthlyRevenue: {
        current: monthlyRevenue._sum.totalAmount || 0,
        previous: previousMonthlyRevenue._sum.totalAmount || 0,
        ...revenueTrend
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    
    // Return default stats if there's an error
    const defaultStats = {
      activeClients: {
        current: 0,
        previous: 0,
        trend: 'stable' as const,
        percentage: 0
      },
      openCases: {
        current: 0,
        previous: 0,
        trend: 'stable' as const,
        percentage: 0
      },
      documentsUploaded: {
        current: 0,
        previous: 0,
        trend: 'stable' as const,
        percentage: 0
      },
      monthlyRevenue: {
        current: 0,
        previous: 0,
        trend: 'stable' as const,
        percentage: 0
      }
    }
    
    return NextResponse.json(defaultStats)
  }
}
