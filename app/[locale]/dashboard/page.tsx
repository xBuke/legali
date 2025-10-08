import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CustomLineChart, CustomPieChart } from '@/components/charts'
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Clock, 
  Receipt,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  activeClients: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  openCases: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  documentsUploaded: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  monthlyRevenue: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'client_created' | 'case_opened' | 'document_uploaded' | 'invoice_sent' | 'payment_received';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  relatedEntity?: {
    type: 'client' | 'case' | 'document' | 'invoice';
    id: string;
    name: string;
  } | null;
}

// Server-side data fetching functions
async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  try {
    // Get current counts
    const [
      activeClients,
      openCases,
      totalDocuments,
      monthlyRevenue
    ] = await Promise.all([
      // Active clients count
      db.client.count({
        where: {
          organizationId,
          status: 'ACTIVE',
          deletedAt: null
        }
      }),
      
      // Open cases count
      db.case.count({
        where: {
          organizationId,
          status: 'OPEN',
          deletedAt: null
        }
      }),
      
      // Total documents count
      db.document.count({
        where: {
          organizationId,
          deletedAt: null
        }
      }),
      
      // Monthly revenue (current month)
      db.invoice.aggregate({
        where: {
          organizationId,
          status: 'PAID',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: {
          total: true
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
      db.client.count({
        where: {
          organizationId,
          status: 'ACTIVE',
          deletedAt: null,
          createdAt: {
            lte: previousMonthEnd
          }
        }
      }),
      
      db.case.count({
        where: {
          organizationId,
          status: 'OPEN',
          deletedAt: null,
          createdAt: {
            lte: previousMonthEnd
          }
        }
      }),
      
      db.document.count({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: {
            lte: previousMonthEnd
          }
        }
      }),
      
      db.invoice.aggregate({
        where: {
          organizationId,
          status: 'PAID',
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          }
        },
        _sum: {
          total: true
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
      monthlyRevenue._sum.total || 0, 
      previousMonthlyRevenue._sum.total || 0
    )

    return {
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
        current: monthlyRevenue._sum.total || 0,
        previous: previousMonthlyRevenue._sum.total || 0,
        ...revenueTrend
      }
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    
    // Return default stats if there's an error
    return {
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
  }
}

async function getDashboardActivities(organizationId: string): Promise<ActivityItem[]> {
  try {
    // Get recent activities from audit logs
    const activities = await db.auditLog.findMany({
      where: {
        organizationId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Transform activities to match the interface
    return activities.map((activity: Record<string, unknown>) => {
      let type: 'client_created' | 'case_opened' | 'document_uploaded' | 'invoice_sent' | 'payment_received' = 'client_created'
      let title = activity.description
      let relatedEntity = null

      // Determine activity type and create related entity info
      if (activity.entityType === 'Client') {
        type = 'client_created'
        title = `Novi klijent: ${activity.entityName}`
        relatedEntity = {
          type: 'client' as const,
          id: activity.entityId,
          name: activity.entityName
        }
      } else if (activity.entityType === 'Case') {
        type = 'case_opened'
        title = `Novi predmet: ${activity.entityName}`
        relatedEntity = {
          type: 'case' as const,
          id: activity.entityId,
          name: activity.entityName
        }
      } else if (activity.entityType === 'Document') {
        type = 'document_uploaded'
        title = `Dokument uploadan: ${activity.entityName}`
        relatedEntity = {
          type: 'document' as const,
          id: activity.entityId,
          name: activity.entityName
        }
      } else if (activity.entityType === 'Invoice') {
        type = 'invoice_sent'
        title = `Račun poslan: ${activity.entityName}`
        relatedEntity = {
          type: 'invoice' as const,
          id: activity.entityId,
          name: activity.entityName
        }
      }

      return {
        id: activity.id,
        type,
        title,
        description: activity.description,
        timestamp: activity.createdAt,
        user: `${activity.user.firstName} ${activity.user.lastName}`.trim() || activity.user.email,
        relatedEntity
      }
    })
  } catch (error) {
    console.error('Dashboard activities error:', error)
    return []
  }
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/sign-in')
  }

  // Get user's organization ID from session
  const organizationId = session.user.organizationId
  
  if (!organizationId) {
    redirect('/sign-in')
  }

  // Fetch dashboard data server-side
  const [stats, activities] = await Promise.all([
    getDashboardStats(organizationId),
    getDashboardActivities(organizationId)
  ])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <ArrowDown className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client_created':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'case_opened':
        return <Briefcase className="h-4 w-4 text-green-500" />
      case 'document_uploaded':
        return <FileText className="h-4 w-4 text-purple-500" />
      case 'invoice_sent':
        return <Receipt className="h-4 w-4 text-orange-500" />
      case 'payment_received':
        return <DollarSign className="h-4 w-4 text-green-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }

  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Prije manje od sat vremena'
    if (diffInHours < 24) return `Prije ${diffInHours}h`
    if (diffInHours < 48) return 'Jučer'
    return date.toLocaleDateString('hr-HR')
  }

  const quickActions = [
    {
      name: 'Add Client',
      href: '/dashboard/clients',
      icon: Users,
      description: 'New client'
    },
    {
      name: 'New Case',
      href: '/dashboard/cases',
      icon: Briefcase,
      description: 'Open case'
    },
    {
      name: 'Upload Document',
      href: '/dashboard/documents',
      icon: FileText,
      description: 'Add document'
    },
    {
      name: 'Time Tracking',
      href: '/dashboard/time-tracking',
      icon: Clock,
      description: 'Start work'
    }
  ]


  // Sample chart data
  const revenueData = [
    { name: 'Jan', revenue: 4000, expenses: 2400 },
    { name: 'Feb', revenue: 3000, expenses: 1398 },
    { name: 'Mar', revenue: 2000, expenses: 9800 },
    { name: 'Apr', revenue: 2780, expenses: 3908 },
    { name: 'May', revenue: 1890, expenses: 4800 },
    { name: 'Jun', revenue: 2390, expenses: 3800 },
  ]

  const caseStatusData = [
    { name: 'Open', value: 12, color: 'hsl(var(--primary))' },
    { name: 'In Progress', value: 8, color: 'hsl(var(--warning))' },
    { name: 'Completed', value: 15, color: 'hsl(var(--success))' },
    { name: 'On Hold', value: 3, color: 'hsl(var(--muted-foreground))' },
  ]

  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--primary))',
    },
    expenses: {
      label: 'Expenses', 
      color: 'hsl(var(--destructive))',
    },
  }

  return (
    <div className="space-y-6 w-full">
      <div className="w-full">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {session.user.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s an overview of your practice
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="card-hover">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used functionalities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.name}
                  variant="outline"
                  asChild
                  className="h-auto p-4 flex flex-col items-center gap-3 card-interactive"
                >
                  <Link href={action.href}>
                    <Icon className="h-6 w-6 text-primary" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{action.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            name: 'Active Clients',
            value: stats.activeClients.current.toString(),
            icon: Users,
            description: 'Currently active',
            trend: stats.activeClients.trend,
            percentage: stats.activeClients.percentage,
            status: 'active' as const
          },
          {
            name: 'Open Cases',
            value: stats.openCases.current.toString(),
            icon: Briefcase,
            description: 'In progress',
            trend: stats.openCases.trend,
            percentage: stats.openCases.percentage,
            status: 'pending' as const
          },
          {
            name: 'Documents',
            value: stats.documentsUploaded.current.toString(),
            icon: FileText,
            description: 'Total uploaded',
            trend: stats.documentsUploaded.trend,
            percentage: stats.documentsUploaded.percentage,
            status: 'completed' as const
          },
          {
            name: 'This Month',
            value: `€${stats.monthlyRevenue.current.toFixed(2)}`,
            icon: TrendingUp,
            description: 'Invoiced',
            trend: stats.monthlyRevenue.trend,
            percentage: stats.monthlyRevenue.percentage,
            status: 'active' as const
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name} className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 mt-2">
                  {getTrendIcon(stat.trend)}
                  <span className={`text-xs ${getTrendColor(stat.trend)}`}>
                    {stat.percentage}%
                  </span>
                  <StatusBadge status={stat.status} showDot />
                </div>
                <div className="mt-3">
                  <Progress 
                    value={Math.min(stat.percentage, 100)} 
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Overview
            </CardTitle>
            <CardDescription>
              Monthly revenue and expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomLineChart 
              data={revenueData} 
              config={chartConfig}
              height={300}
            />
          </CardContent>
        </Card>

        {/* Case Status Chart */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Case Status
            </CardTitle>
            <CardDescription>
              Distribution of case statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomPieChart 
              data={caseStatusData} 
              config={{
                value: { label: 'Cases' }
              }}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest activities in your practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activities yet"
              description="Start by adding clients and cases to see activity here"
            />
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.user}
                    </p>
                    {activity.relatedEntity && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 px-2 text-xs"
                        >
                          <Link href={`/dashboard/${activity.relatedEntity.type}s/${activity.relatedEntity.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


