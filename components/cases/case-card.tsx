'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Trash2, Calendar, User, FileText, Clock, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type Case = {
  id: string
  caseNumber: string
  title: string
  caseType: string
  status: string
  priority: string
  openedAt: string
  nextHearingDate?: string
  client: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    clientType: string
  }
  assignedTo?: {
    id: string
    firstName?: string
    lastName?: string
  }
  _count: {
    documents: number
    timeEntries: number
    tasks: number
  }
}

interface CaseCardProps {
  case: Case
  viewMode: 'compact' | 'detailed'
  onEdit: () => void
  onView: () => void
  onDelete: () => void
}

export function CaseCard({ case: caseData, viewMode, onEdit, onView, onDelete }: CaseCardProps) {
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

  function getClientName(client: Case['client']) {
    if (client.clientType === 'COMPANY') {
      return client.companyName || 'Bez naziva'
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Bez imena'
  }

  function getStatusLabel(status: string) {
    const statusLabels = {
      OPEN: 'Otvoren',
      IN_PROGRESS: 'U obradi',
      ON_HOLD: 'Na čekanju',
      CLOSED_WON: 'Zatvoren - Dobijen',
      CLOSED_LOST: 'Zatvoren - Izgubljen',
      CLOSED_SETTLED: 'Zatvoren - Nagodba',
      ARCHIVED: 'Arhiviran',
    }
    return statusLabels[status as keyof typeof statusLabels] || status
  }

  function getPriorityLabel(priority: string) {
    const priorityLabels = {
      LOW: 'Nizak',
      MEDIUM: 'Srednji',
      HIGH: 'Visok',
      URGENT: 'Hitan',
    }
    return priorityLabels[priority as keyof typeof priorityLabels] || priority
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{caseData.caseNumber}</h3>
            <Badge variant="outline" className={statusColors[caseData.status as keyof typeof statusColors]}>
              {getStatusLabel(caseData.status)}
            </Badge>
            <Badge variant="outline" className={priorityColors[caseData.priority as keyof typeof priorityColors]}>
              {getPriorityLabel(caseData.priority)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{caseData.title}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Klijent: <Link href={`/dashboard/clients/${caseData.client.id}`} className="text-primary hover:underline">{getClientName(caseData.client)}</Link></span>
            <span>Tip: {caseData.caseType}</span>
            {caseData.nextHearingDate && (
              <span>Sljedeće ročište: {format(new Date(caseData.nextHearingDate), 'dd.MM.yyyy')}</span>
            )}
          </div>
          {viewMode === 'detailed' && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Kreiran: {format(new Date(caseData.openedAt), 'dd.MM.yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">Dodijeljen: {caseData.assignedTo?.firstName && caseData.assignedTo?.lastName ? `${caseData.assignedTo.firstName} ${caseData.assignedTo.lastName}` : 'Nije dodijeljen'}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{caseData._count.documents} dokumenata</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{caseData._count.timeEntries} vremenskih unosa</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-4 w-4" />
                  <span>{caseData._count.tasks} zadataka</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
