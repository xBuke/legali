'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Briefcase, Calendar, User, FileText, Clock, CheckSquare, AlertCircle, Building2 } from 'lucide-react'
import { CaseTimeline } from '@/components/cases/case-timeline'
import { CaseDeadlines } from '@/components/cases/case-deadlines'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

type CaseDetail = {
  id: string
  caseNumber: string
  title: string
  description?: string
  caseType: string
  status: string
  priority: string
  courtName?: string
  courtCaseNumber?: string
  judge?: string
  opposingCounsel?: string
  openedAt: string
  closedAt?: string
  nextHearingDate?: string
  client: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    clientType: string
    email?: string
    phone?: string
  }
  assignedTo?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
  }
  documents?: any[]
  timeEntries?: any[]
  tasks?: any[]
  notes?: any[]
}

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [users, setUsers] = useState<Array<{ id: string; firstName?: string; lastName?: string }>>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchCase()
    fetchUsers()
  }, [params.id])

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  async function fetchCase() {
    try {
      const response = await fetch(`/api/cases/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCaseData(data)
      } else if (response.status === 404) {
        toast({
          title: 'Greška',
          description: 'Predmet nije pronađen',
          variant: 'destructive',
        })
        router.push('/dashboard/cases')
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće dohvatiti podatke o predmetu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  if (!caseData) {
    return null
  }

  const clientName = caseData.client.clientType === 'COMPANY'
    ? caseData.client.companyName || 'Bez naziva'
    : `${caseData.client.firstName || ''} ${caseData.client.lastName || ''}`.trim() || 'Bez imena'

  const statusColors = {
    OPEN: 'bg-blue-500/10 text-blue-500',
    IN_PROGRESS: 'bg-yellow-500/10 text-yellow-500',
    ON_HOLD: 'bg-orange-500/10 text-orange-500',
    CLOSED_WON: 'bg-green-500/10 text-green-500',
    CLOSED_LOST: 'bg-red-500/10 text-red-500',
    CLOSED_SETTLED: 'bg-purple-500/10 text-purple-500',
    ARCHIVED: 'bg-gray-500/10 text-gray-500',
  }

  const priorityColors = {
    LOW: 'bg-gray-500/10 text-gray-500',
    MEDIUM: 'bg-blue-500/10 text-blue-500',
    HIGH: 'bg-orange-500/10 text-orange-500',
    URGENT: 'bg-red-500/10 text-red-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/cases">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{caseData.title}</h1>
            <Badge className={statusColors[caseData.status as keyof typeof statusColors]}>
              {caseData.status.replace('_', ' ')}
            </Badge>
            <Badge className={priorityColors[caseData.priority as keyof typeof priorityColors]}>
              {caseData.priority}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{caseData.caseNumber}</span>
            <span>•</span>
            <span>{caseData.caseType}</span>
            <span>•</span>
            <span>Otvoren: {format(new Date(caseData.openedAt), 'dd.MM.yyyy')}</span>
          </div>
        </div>
      </div>

      {caseData.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Opis predmeta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{caseData.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Klijent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              {caseData.client.clientType === 'COMPANY' ? (
                <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  <Link 
                    href={`/dashboard/clients/${caseData.client.id}`}
                    className="text-primary hover:underline"
                  >
                    {clientName}
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  {caseData.client.clientType === 'COMPANY' ? 'Tvrtka' : 'Pojedinac'}
                </p>
              </div>
            </div>
            {caseData.client.email && (
              <div className="text-sm">
                <p className="text-muted-foreground">Email</p>
                <p>{caseData.client.email}</p>
              </div>
            )}
            {caseData.client.phone && (
              <div className="text-sm">
                <p className="text-muted-foreground">Telefon</p>
                <p>{caseData.client.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Court Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informacije o sudu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {caseData.courtName ? (
              <>
                <div className="text-sm">
                  <p className="text-muted-foreground">Naziv suda</p>
                  <p className="font-medium">{caseData.courtName}</p>
                </div>
                {caseData.courtCaseNumber && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Broj suda</p>
                    <p className="font-medium">{caseData.courtCaseNumber}</p>
                  </div>
                )}
                {caseData.judge && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Sudac</p>
                    <p>{caseData.judge}</p>
                  </div>
                )}
                {caseData.opposingCounsel && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Protivnički odvjetnik</p>
                    <p>{caseData.opposingCounsel}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nema podataka o sudu</p>
            )}
          </CardContent>
        </Card>

        {/* Next Hearing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sljedeće ročište</CardTitle>
          </CardHeader>
          <CardContent>
            {caseData.nextHearingDate ? (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {format(new Date(caseData.nextHearingDate), 'dd.MM.yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(caseData.nextHearingDate), 'EEEE')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nije zakazano</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Dokumenti</span>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold">{caseData.documents?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Ukupno dokumenata</p>
            </div>
          </CardContent>
        </Card>

        {/* Time Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Vrijeme</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold">{caseData.timeEntries?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Unosa vremena</p>
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Zadaci</span>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold">{caseData.tasks?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Aktivnih zadataka</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Deadlines */}
      <CaseDeadlines 
        caseId={caseData.id} 
        users={users}
      />

      {/* Case Timeline */}
      <CaseTimeline 
        caseId={caseData.id} 
        caseNumber={caseData.caseNumber} 
        caseTitle={caseData.title} 
      />
    </div>
  )
}
