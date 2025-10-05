'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Users, 
  FileText,
  Target
} from 'lucide-react'

interface CaseAnalytics {
  totalCases: number
  activeCases: number
  closedCases: number
  averageCaseDuration: number
  successRate: number
  revenuePerCase: number
  casesByType: Record<string, number>
  casesByStatus: Record<string, number>
  casesByPriority: Record<string, number>
}

interface CaseAnalyticsProps {
  caseId?: string
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
}

const mockAnalytics: CaseAnalytics = {
  totalCases: 156,
  activeCases: 89,
  closedCases: 67,
  averageCaseDuration: 45,
  successRate: 78.5,
  revenuePerCase: 2500,
  casesByType: {
    'Građansko pravo': 45,
    'Kazneno pravo': 32,
    'Radno pravo': 28,
    'Obiteljsko pravo': 25,
    'Trgovačko pravo': 18,
    'Upravno pravo': 8
  },
  casesByStatus: {
    'Otvoren': 45,
    'U tijeku': 32,
    'Na čekanju': 12,
    'Zatvoren': 67
  },
  casesByPriority: {
    'Nizak': 23,
    'Srednji': 89,
    'Visok': 32,
    'Hitan': 12
  },
}

export function CaseAnalytics({ caseId, timeRange = 'month' }: CaseAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const analytics = mockAnalytics

  const getTrendIcon = (value: number, previousValue: number) => {
    if (value > previousValue) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (value < previousValue) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <TrendingUp className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (value: number, previousValue: number) => {
    if (value > previousValue) return 'text-green-600'
    if (value < previousValue) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analitika predmeta</h2>
          <p className="text-muted-foreground">
            Pregled performansi i trendova vaših predmeta
          </p>
        </div>
        <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as 'week' | 'month' | 'quarter' | 'year')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Zadnji tjedan</SelectItem>
            <SelectItem value="month">Zadnji mjesec</SelectItem>
            <SelectItem value="quarter">Zadnji kvartal</SelectItem>
            <SelectItem value="year">Zadnja godina</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ukupno predmeta</p>
                <p className="text-2xl font-bold">{analytics.totalCases}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(analytics.totalCases, 150)}
              <span className={`text-sm ${getTrendColor(analytics.totalCases, 150)}`}>
                +4% od prošlog mjeseca
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktivni predmeti</p>
                <p className="text-2xl font-bold">{analytics.activeCases}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(analytics.activeCases, 85)}
              <span className={`text-sm ${getTrendColor(analytics.activeCases, 85)}`}>
                +2% od prošlog mjeseca
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stopa uspjeha</p>
                <p className="text-2xl font-bold">{analytics.successRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(analytics.successRate, 76)}
              <span className={`text-sm ${getTrendColor(analytics.successRate, 76)}`}>
                +2.5% od prošlog mjeseca
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prihod po predmetu</p>
                <p className="text-2xl font-bold">{analytics.revenuePerCase.toLocaleString()} €</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon(analytics.revenuePerCase, 2400)}
              <span className={`text-sm ${getTrendColor(analytics.revenuePerCase, 2400)}`}>
                +4.2% od prošlog mjeseca
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Predmeti po tipovima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.casesByType).map(([type, count]) => {
                const percentage = (count / analytics.totalCases) * 100
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Cases by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Predmeti po statusima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.casesByStatus).map(([status, count]) => {
                const percentage = (count / analytics.totalCases) * 100
                const statusColor = {
                  'Otvoren': 'bg-blue-500',
                  'U tijeku': 'bg-yellow-500',
                  'Na čekanju': 'bg-orange-500',
                  'Zatvoren': 'bg-green-500'
                }[status] || 'bg-gray-500'
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{status}</span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${statusColor} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}