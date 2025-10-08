'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  FileText, 
  User, 
  CheckSquare, 
  Clock, 
  Plus,
  MessageSquare,
  AlertCircle,
  UserPlus,
  UserMinus,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { hr } from 'date-fns/locale'

interface CaseTimelineEvent {
  id: string
  type: 'CREATED' | 'STATUS_CHANGED' | 'DOCUMENT_ADDED' | 'HEARING_SCHEDULED' | 'NOTE_ADDED' | 'TASK_CREATED' | 'TASK_COMPLETED' | 'ASSIGNED' | 'UNASSIGNED'
  title: string
  description?: string
  metadata?: string
  createdAt: string
  createdBy: {
    id: string
    firstName?: string
    lastName?: string
  }
}

interface CaseTimelineProps {
  caseId: string
}

export function CaseTimeline({ caseId }: CaseTimelineProps) {
  const [timeline, setTimeline] = useState<CaseTimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    fetchTimeline()
  }, [caseId, fetchTimeline])

  async function fetchTimeline() {
    try {
      const response = await fetch(`/api/cases/${caseId}/timeline`)
      if (response.ok) {
        const data = await response.json()
        setTimeline(data)
      }
    } catch (error) {
      console.error('Error fetching timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  function getEventIcon(type: CaseTimelineEvent['type']) {
    switch (type) {
      case 'CREATED':
        return <Plus className="h-4 w-4" />
      case 'STATUS_CHANGED':
        return <AlertCircle className="h-4 w-4" />
      case 'DOCUMENT_ADDED':
        return <FileText className="h-4 w-4" />
      case 'HEARING_SCHEDULED':
        return <Calendar className="h-4 w-4" />
      case 'NOTE_ADDED':
        return <MessageSquare className="h-4 w-4" />
      case 'TASK_CREATED':
        return <CheckSquare className="h-4 w-4" />
      case 'TASK_COMPLETED':
        return <CheckSquare className="h-4 w-4" />
      case 'ASSIGNED':
        return <UserPlus className="h-4 w-4" />
      case 'UNASSIGNED':
        return <UserMinus className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  function getEventColor(type: CaseTimelineEvent['type']) {
    switch (type) {
      case 'CREATED':
        return 'bg-green-500'
      case 'STATUS_CHANGED':
        return 'bg-blue-500'
      case 'DOCUMENT_ADDED':
        return 'bg-purple-500'
      case 'HEARING_SCHEDULED':
        return 'bg-orange-500'
      case 'NOTE_ADDED':
        return 'bg-gray-500'
      case 'TASK_CREATED':
        return 'bg-yellow-500'
      case 'TASK_COMPLETED':
        return 'bg-green-500'
      case 'ASSIGNED':
        return 'bg-indigo-500'
      case 'UNASSIGNED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  function getEventLabel(type: CaseTimelineEvent['type']) {
    switch (type) {
      case 'CREATED':
        return 'Kreiran'
      case 'STATUS_CHANGED':
        return 'Status promijenjen'
      case 'DOCUMENT_ADDED':
        return 'Dokument dodan'
      case 'HEARING_SCHEDULED':
        return 'Ročište zakazano'
      case 'NOTE_ADDED':
        return 'Bilješka dodana'
      case 'TASK_CREATED':
        return 'Zadatak kreiran'
      case 'TASK_COMPLETED':
        return 'Zadatak završen'
      case 'ASSIGNED':
        return 'Dodijeljen'
      case 'UNASSIGNED':
        return 'Uklonjen'
      default:
        return 'Aktivnost'
    }
  }

  function getUserName(user: CaseTimelineEvent['createdBy']) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nepoznat korisnik'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Povijest predmeta
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Učitavanje...</p>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Povijest predmeta
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Još nema aktivnosti</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aktivnosti će se prikazati kada se dogode promjene u predmetu
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Povijest predmeta
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {timeline.map((event, index) => (
            <div key={event.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-white`}>
                  {getEventIcon(event.type)}
                </div>
                {index < timeline.length - 1 && (
                  <div className="w-px h-8 bg-border ml-4 mt-2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getEventLabel(event.type)}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{getUserName(event.createdBy)}</span>
                      <span>•</span>
                      <span>{format(new Date(event.createdAt), 'dd.MM.yyyy HH:mm')}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: hr })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
