'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Workflow, 
  BarChart3, 
  Search, 
  Users, 
  FileText, 
  Settings,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

// Import all Phase 2 components
import { CaseWorkflow } from './case-workflow'
import { CaseAnalytics } from './case-analytics'
import { AdvancedCaseSearch } from './advanced-case-search'
import { CaseCollaboration } from './case-collaboration'
import { CaseDocumentManagement } from './case-document-management'
import { LazyCaseDetails, LazySection } from './lazy-case-details'
import { caseCache, cacheInvalidation } from '@/lib/case-cache'

interface CaseManagementSuiteProps {
  caseId: string
  caseNumber: string
  currentUser: {
    id: string
    name: string
    email: string
    avatar?: string
    role: 'owner' | 'admin' | 'member' | 'viewer'
  }
}

interface Phase2Features {
  workflow: boolean
  analytics: boolean
  advancedSearch: boolean
  collaboration: boolean
  documentManagement: boolean
  caching: boolean
  lazyLoading: boolean
}

export function CaseManagementSuite({ 
  caseId, 
  caseNumber, 
  currentUser 
}: CaseManagementSuiteProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [features, setFeatures] = useState<Phase2Features>({
    workflow: true,
    analytics: true,
    advancedSearch: true,
    collaboration: true,
    documentManagement: true,
    caching: true,
    lazyLoading: true
  })
  const [cacheStats, setCacheStats] = useState(caseCache.getStats())
  const [isLoading, setIsLoading] = useState(false)

  // Update cache stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(caseCache.getStats())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleSearch = (filters: any, sortBy: string, sortOrder: 'asc' | 'desc') => {
    console.log('Advanced search:', { filters, sortBy, sortOrder })
    // Implement search logic with caching
  }

  const handleSaveSearch = (search: any) => {
    console.log('Saved search:', search)
    // Implement save search logic
  }

  const handleWorkflowChange = (workflow: any) => {
    console.log('Workflow changed:', workflow)
    // Invalidate related cache
    cacheInvalidation.invalidateCase(caseId)
  }

  const getFeatureStatus = (feature: keyof Phase2Features) => {
    return features[feature] ? 'active' : 'inactive'
  }

  const getFeatureIcon = (feature: keyof Phase2Features) => {
    const isActive = features[feature]
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <Clock className="h-4 w-4 text-gray-400" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Phase 2 Features Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Phase 2 - Napredni upravljački sustav
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="flex items-center gap-2">
              {getFeatureIcon('workflow')}
              <span className="text-sm">Workflow</span>
            </div>
            <div className="flex items-center gap-2">
              {getFeatureIcon('analytics')}
              <span className="text-sm">Analitika</span>
            </div>
            <div className="flex items-center gap-2">
              {getFeatureIcon('advancedSearch')}
              <span className="text-sm">Napredna pretraga</span>
            </div>
            <div className="flex items-center gap-2">
              {getFeatureIcon('collaboration')}
              <span className="text-sm">Suradnja</span>
            </div>
            <div className="flex items-center gap-2">
              {getFeatureIcon('documentManagement')}
              <span className="text-sm">Dokumenti</span>
            </div>
            <div className="flex items-center gap-2">
              {getFeatureIcon('caching')}
              <span className="text-sm">Cache</span>
            </div>
            <div className="flex items-center gap-2">
              {getFeatureIcon('lazyLoading')}
              <span className="text-sm">Lazy loading</span>
            </div>
          </div>
          
          {/* Cache Statistics */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cache statistike:</span>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Ukupno: {cacheStats.totalItems}</span>
                <span>Valjani: {cacheStats.validItems}</span>
                <span>Hit rate: {cacheStats.hitRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Pregled
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analitika
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Pretraga
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Suradnja
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumenti
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Brza statistika</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status predmeta</span>
                    <Badge variant="outline">U tijeku</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Aktivni workflow</span>
                    <Badge variant="secondary">Građanski spor</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Članovi tima</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dokumenti</span>
                    <Badge variant="secondary">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Komentari</span>
                    <Badge variant="secondary">8</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Nedavna aktivnost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Dodan novi komentar</p>
                      <p className="text-xs text-muted-foreground">Prije 2 sata</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Dokument odobren</p>
                      <p className="text-xs text-muted-foreground">Prije 4 sata</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Status promijenjen</p>
                      <p className="text-xs text-muted-foreground">Jučer</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow">
          <LazyCaseDetails caseId={caseId}>
            <CaseWorkflow 
              caseId={caseId}
              onWorkflowChange={handleWorkflowChange}
            />
          </LazyCaseDetails>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <LazyCaseDetails caseId={caseId}>
            <CaseAnalytics caseId={caseId} />
          </LazyCaseDetails>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search">
          <LazyCaseDetails caseId={caseId}>
            <AdvancedCaseSearch 
              onSearch={handleSearch}
              onSaveSearch={handleSaveSearch}
            />
          </LazyCaseDetails>
        </TabsContent>

        {/* Collaboration Tab */}
        <TabsContent value="collaboration">
          <LazyCaseDetails caseId={caseId}>
            <CaseCollaboration 
              caseId={caseId}
              currentUser={{
                ...currentUser,
                permissions: currentUser.role === 'owner' ? ['read', 'write', 'delete', 'admin'] : 
                           currentUser.role === 'admin' ? ['read', 'write'] : 
                           currentUser.role === 'member' ? ['read', 'write'] : ['read'],
                joinedAt: new Date()
              }}
            />
          </LazyCaseDetails>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <LazyCaseDetails caseId={caseId}>
            <CaseDocumentManagement 
              caseId={caseId}
              caseNumber={caseNumber}
            />
          </LazyCaseDetails>
        </TabsContent>
      </Tabs>

      {/* Performance Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Performanse i optimizacija
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {cacheStats.hitRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Cache hit rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cacheStats.validItems}
              </div>
              <div className="text-sm text-muted-foreground">Valjani cache elementi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {features.workflow && features.analytics && features.collaboration ? '100%' : '75%'}
              </div>
              <div className="text-sm text-muted-foreground">Phase 2 implementacija</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
