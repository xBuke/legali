'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Trash2, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

interface KanbanColumn {
  id: string
  title: string
  status: string
  cases: Case[]
  color: string
}

interface CaseKanbanBoardProps {
  cases: Case[]
  onEdit: (caseData: Case) => void
  onDelete: (id: string) => void
  onStatusChange: (caseId: string, newStatus: string) => void
}

export function CaseKanbanBoard({ cases, onEdit, onDelete, onStatusChange }: CaseKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const caseId = active.id as string
    const newStatus = over.id as string

    if (newStatus && ['open', 'in-progress', 'on-hold', 'closed'].includes(newStatus)) {
      const statusMap: { [key: string]: string } = {
        'open': 'OPEN',
        'in-progress': 'IN_PROGRESS',
        'on-hold': 'ON_HOLD',
        'closed': 'CLOSED_WON'
      }
      onStatusChange(caseId, statusMap[newStatus])
    }
  }
  // Sortable Case Card Component
  function SortableCaseCard({ caseData }: { caseData: Case }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: caseData.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <Card className="mb-3 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{caseData.title}</h4>
                  <p className="text-xs text-muted-foreground">{caseData.caseNumber}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    caseData.priority === 'HIGH' ? 'border-red-500 text-red-500' :
                    caseData.priority === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' :
                    'border-green-500 text-green-500'
                  }`}
                >
                  {caseData.priority}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate">
                    {caseData.client.firstName && caseData.client.lastName
                      ? `${caseData.client.firstName} ${caseData.client.lastName}`
                      : caseData.client.companyName || 'Nepoznat klijent'}
                  </span>
                </div>

                {caseData.nextHearingDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(caseData.nextHearingDate), 'dd.MM.yyyy')}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{caseData._count.documents} dok.</span>
                  <span>{caseData._count.tasks} zad.</span>
                </div>
              </div>

              <div className="flex gap-1 pt-2">
                <Button size="sm" variant="outline" className="h-7 px-2" asChild>
                  <Link href={`/dashboard/cases/${caseData.id}`}>
                    <Eye className="h-3 w-3" />
                  </Link>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-2"
                  onClick={() => onEdit(caseData)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-2"
                  onClick={() => onDelete(caseData.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const columns: KanbanColumn[] = [
    { 
      id: 'open', 
      title: 'Otvoreni', 
      status: 'OPEN', 
      cases: cases.filter(c => c.status === 'OPEN'), 
      color: 'bg-blue-500' 
    },
    { 
      id: 'in-progress', 
      title: 'U tijeku', 
      status: 'IN_PROGRESS', 
      cases: cases.filter(c => c.status === 'IN_PROGRESS'), 
      color: 'bg-yellow-500' 
    },
    { 
      id: 'on-hold', 
      title: 'Na čekanju', 
      status: 'ON_HOLD', 
      cases: cases.filter(c => c.status === 'ON_HOLD'), 
      color: 'bg-orange-500' 
    },
    { 
      id: 'closed', 
      title: 'Zatvoreni', 
      status: 'CLOSED', 
      cases: cases.filter(c => c.status.startsWith('CLOSED')), 
      color: 'bg-green-500' 
    },
  ]

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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className={`${column.color} p-3 rounded-t-lg text-white`}>
              <h3 className="font-semibold">{column.title}</h3>
              <span className="text-sm opacity-90">{column.cases.length} predmeta</span>
            </div>
            <div className="bg-white border border-t-0 rounded-b-lg p-2 min-h-96">
              <SortableContext
                items={column.cases.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {column.cases.map(caseData => (
                  <SortableCaseCard key={caseData.id} caseData={caseData} />
                ))}
                {column.cases.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nema predmeta
                  </div>
                )}
              </SortableContext>
            </div>
          </div>
        ))}
      </div>
      
      <DragOverlay>
        {activeId ? (
          <div className="opacity-50">
            <SortableCaseCard caseData={cases.find(c => c.id === activeId)!} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
