'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Trash2, Mail, Phone, Building2, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { hr } from 'date-fns/locale'

type Client = {
  id: string
  clientType: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  status: string
  createdAt: string
  _count: {
    cases: number
    documents: number
  }
}

interface ClientCardProps {
  client: Client
  viewMode: 'compact' | 'detailed'
  onEdit: () => void
  onDelete: () => void
}

export function ClientCard({ client, viewMode, onEdit, onDelete }: ClientCardProps) {
  const getClientName = (client: Client) => {
    if (client.clientType === 'COMPANY') {
      return client.companyName || 'Bez naziva'
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Bez imena'
  }

  const statusColors = {
    ACTIVE: 'bg-green-500/10 text-green-500',
    INACTIVE: 'bg-gray-500/10 text-gray-500',
    POTENTIAL: 'bg-blue-500/10 text-blue-500',
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg truncate">{getClientName(client)}</h3>
            <Badge className={statusColors[client.status as keyof typeof statusColors]}>
              {client.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            {client.clientType === 'COMPANY' ? (
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                Tvrtka
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Pojedinac
              </Badge>
            )}
          </div>

          {viewMode === 'detailed' && (
            <div className="mt-3 space-y-2">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Registriran: {format(new Date(client.createdAt), 'dd.MM.yyyy', { locale: hr })}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{client._count.cases} predmeta</span>
                <span>{client._count.documents} dokumenata</span>
              </div>
            </div>
          )}

          {viewMode === 'compact' && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {client.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              <span>{client._count.cases} predmeta</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 ml-3">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/dashboard/clients/${client.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
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
