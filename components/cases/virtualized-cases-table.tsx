'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { hr } from 'date-fns/locale'

interface Case {
  id: string
  caseNumber: string
  title: string
  description?: string
  caseType: string
  status: string
  priority: string
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
  _count?: {
    documents: number
    tasks: number
  }
}

interface VirtualizedCasesTableProps {
  cases: Case[]
  onEdit: (caseData: Case) => void
  onDelete: (id: string) => void
  getClientName: (client: Case['client']) => string
  getStatusLabel: (status: string) => string
  getPriorityLabel: (priority: string) => string
  getStatusColor: (status: string) => string
  getPriorityColor: (priority: string) => string
}

export function VirtualizedCasesTable({
  cases,
  onEdit,
  onDelete,
  getClientName,
  getStatusLabel,
  getPriorityLabel,
  getStatusColor,
  getPriorityColor,
}: VirtualizedCasesTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: cases.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 5, // Number of items to render outside of the visible area
  })

  if (cases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nema predmeta</p>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto border rounded-lg"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[120px]">Broj predmeta</TableHead>
              <TableHead>Naziv</TableHead>
              <TableHead>Klijent</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioritet</TableHead>
              <TableHead>Sljedeće ročište</TableHead>
              <TableHead className="text-right w-[120px]">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const caseData = cases[virtualItem.index]
              return (
                <TableRow
                  key={caseData.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <TableCell className="font-medium">
                    {caseData.caseNumber}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{caseData.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {caseData.caseType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/clients/${caseData.client.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {getClientName(caseData.client)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{caseData.caseType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(caseData.status)}>
                      {getStatusLabel(caseData.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(caseData.priority)}>
                      {getPriorityLabel(caseData.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {caseData.nextHearingDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(caseData.nextHearingDate), 'dd.MM.yyyy', { locale: hr })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/dashboard/cases/${caseData.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(caseData)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(caseData.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
