import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Plus, 
  Clock, 
  Receipt,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Calendar,
  DollarSign,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  clients: number;
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
    return activities.map((activity: any) => {
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

async function getRevenueChartData(organizationId: string): Promise<RevenueData[]> {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    
    const data = []
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const monthStart = new Date(new Date().getFullYear(), monthIndex, 1)
      const monthEnd = new Date(new Date().getFullYear(), monthIndex + 1, 0)
      
      const [revenue, clients] = await Promise.all([
        db.invoice.aggregate({
          where: {
            organizationId,
            status: 'PAID',
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          _sum: { total: true }
        }),
        db.client.count({
          where: {
            organizationId,
            status: 'ACTIVE',
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        })
      ])
      
      data.push({
        month: months[monthIndex],
        revenue: revenue._sum.total || 0,
        clients: clients
      })
    }
    
    return data
  } catch (error) {
    console.error('Revenue chart data error:', error)
    return []
  }
}

async function getCaseStatusData(organizationId: string): Promise<ChartData[]> {
  try {
    const [open, closed, pending, inProgress] = await Promise.all([
      db.case.count({ where: { organizationId, status: 'OPEN' } }),
      db.case.count({ where: { organizationId, status: 'CLOSED' } }),
      db.case.count({ where: { organizationId, status: 'PENDING' } }),
      db.case.count({ where: { organizationId, status: 'IN_PROGRESS' } })
    ])
    
    return [
      { name: 'Open', value: open, color: '#3b82f6' },
      { name: 'In Progress', value: inProgress, color: '#f59e0b' },
      { name: 'Pending', value: pending, color: '#8b5cf6' },
      { name: 'Closed', value: closed, color: '#10b981' }
    ]
  } catch (error) {
    console.error('Case status data error:', error)
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
  const [stats, activities, revenueData, caseStatusData] = await Promise.all([
    getDashboardStats(organizationId),
    getDashboardActivities(organizationId),
    getRevenueChartData(organizationId),
    getCaseStatusData(organizationId)
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
      name: 'Dodaj klijenta',
      href: '/dashboard/clients',
      icon: Users,
      description: 'Novi klijent'
    },
    {
      name: 'Novi predmet',
      href: '/dashboard/cases',
      icon: Briefcase,
      description: 'Otvori predmet'
    },
    {
      name: 'Upload dokument',
      href: '/dashboard/documents',
      icon: FileText,
      description: 'Dodaj dokument'
    },
    {
      name: 'Pratnja vremena',
      href: '/dashboard/time-tracking',
      icon: Clock,
      description: 'Započni rad'
    }
  ]


  return (
    <div className="space-y-6 w-full">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, {session.user.name?.split(' ')[0] || 'User'}!
          </h1>
        </div>
        <p className="text-muted-foreground">
          Here's what's happening with your practice today
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Frequently used features to boost your productivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.name}
                  variant="outline"
                  asChild
                  className="h-auto p-4 flex flex-col items-center gap-3 hover:shadow-md transition-all duration-200 group"
                >
                  <Link href={action.href}>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
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

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            name: 'Active Clients',
            value: stats.activeClients.current.toString(),
            icon: Users,
            description: 'Currently active',
            trend: stats.activeClients.trend,
            percentage: stats.activeClients.percentage,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20'
          },
          {
            name: 'Open Cases',
            value: stats.openCases.current.toString(),
            icon: Briefcase,
            description: 'In progress',
            trend: stats.openCases.trend,
            percentage: stats.openCases.percentage,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/20'
          },
          {
            name: 'Documents',
            value: stats.documentsUploaded.current.toString(),
            icon: FileText,
            description: 'Total uploaded',
            trend: stats.documentsUploaded.trend,
            percentage: stats.documentsUploaded.percentage,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950/20'
          },
          {
            name: 'This Month',
            value: `€${stats.monthlyRevenue.current.toFixed(2)}`,
            icon: TrendingUp,
            description: 'Revenue generated',
            trend: stats.monthlyRevenue.trend,
            percentage: stats.monthlyRevenue.percentage,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20'
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", stat.bgColor)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(stat.trend)}
                    <span className={cn("text-sm font-medium", getTrendColor(stat.trend))}>
                      {stat.percentage}%
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{stat.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className="mt-4">
                  <Progress 
                    value={Math.min(stat.percentage, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Revenue Trend
            </CardTitle>
            <CardDescription>
              Monthly revenue and client growth over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `€${value}` : value,
                      name === 'revenue' ? 'Revenue' : 'New Clients'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Case Status Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Case Status Distribution
            </CardTitle>
            <CardDescription>
              Overview of your case portfolio by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {caseStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [value, 'Cases']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {caseStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <span className="text-sm font-medium ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest activities in your practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <Alert>
              <Briefcase className="h-4 w-4" />
              <AlertDescription>
                <div className="text-center py-8">
                  <p className="text-sm font-medium">No activities yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start by adding clients and cases to see activity here
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          by {activity.user}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    {activity.relatedEntity && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 px-3 text-xs"
                        >
                          <Link href={`/dashboard/${activity.relatedEntity.type}s/${activity.relatedEntity.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
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


