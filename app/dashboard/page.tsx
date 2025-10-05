'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DollarSign
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
  };
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/activities')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 w-full container-overflow-fix">
        <div className="w-full">
          <h1 className="text-2xl md:text-3xl font-bold">
            Dobrodošli, {session?.user?.name?.split(' ')[0] || 'korisniče'}!
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Evo pregleda vaše kancelarije
          </p>
        </div>
        <div className="responsive-grid responsive-grid-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-3 md:p-6 w-full grid-overflow-fix">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full container-overflow-fix">
      <div className="w-full">
        <h1 className="text-2xl md:text-3xl font-bold">
          Dobrodošli, {session?.user?.name?.split(' ')[0] || 'korisniče'}!
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Evo pregleda vaše kancelarije
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl">Brze akcije</CardTitle>
          <CardDescription className="text-sm">
            Često korištene funkcionalnosti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="responsive-grid responsive-grid-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.name}
                  variant="outline"
                  asChild
                  className="h-auto p-3 md:p-4 flex flex-col items-center gap-2 min-h-[80px] w-full grid-overflow-fix"
                >
                  <Link href={action.href}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="text-center w-full">
                      <div className="font-medium text-xs md:text-sm leading-tight text-responsive-truncate">{action.name}</div>
                      <div className="text-xs text-muted-foreground leading-tight text-responsive-truncate">{action.description}</div>
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - Mobile Optimized */}
      <div className="responsive-grid responsive-grid-4">
        {stats && [
          {
            name: 'Aktivni klijenti',
            value: stats.activeClients.current.toString(),
            icon: Users,
            description: 'Trenutno aktivno',
            trend: stats.activeClients.trend,
            percentage: stats.activeClients.percentage
          },
          {
            name: 'Otvoreni predmeti',
            value: stats.openCases.current.toString(),
            icon: Briefcase,
            description: 'U obradi',
            trend: stats.openCases.trend,
            percentage: stats.openCases.percentage
          },
          {
            name: 'Dokumenti',
            value: stats.documentsUploaded.current.toString(),
            icon: FileText,
            description: 'Ukupno uploadano',
            trend: stats.documentsUploaded.trend,
            percentage: stats.documentsUploaded.percentage
          },
          {
            name: 'Ovaj mjesec',
            value: `€${stats.monthlyRevenue.current.toFixed(2)}`,
            icon: TrendingUp,
            description: 'Fakturirano',
            trend: stats.monthlyRevenue.trend,
            percentage: stats.monthlyRevenue.percentage
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name} className="p-3 md:p-6 w-full grid-overflow-fix">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                <CardTitle className="text-xs md:text-sm font-medium leading-tight text-responsive-truncate pr-2">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-0">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-responsive-truncate">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(stat.trend)}
                  <span className={`text-xs ${getTrendColor(stat.trend)}`}>
                    {stat.percentage}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-tight text-responsive-truncate">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity - Mobile Optimized */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl">Nedavne aktivnosti</CardTitle>
          <CardDescription className="text-sm">
            Posljednje aktivnosti u vašoj kancelariji
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-muted-foreground">
              <Briefcase className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
              <p className="text-sm md:text-base">Još nema aktivnosti</p>
              <p className="text-xs md:text-sm mt-2">
                Započnite dodavanjem klijenata i predmeta
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.user}
                    </p>
                    {activity.relatedEntity && (
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-6 px-2 text-xs"
                        >
                          <Link href={`/dashboard/${activity.relatedEntity.type}s/${activity.relatedEntity.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Pogledaj
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
