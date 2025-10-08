'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Eye, Pencil, Trash2, Mail, Phone, Building2, Users, Calendar, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { hr } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  _count?: {
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
      return client.companyName || 'Unnamed Company'
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unnamed Client'
  }

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              {client.clientType === 'COMPANY' ? (
                <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg truncate">{getClientName(client)}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {client.clientType === 'COMPANY' ? (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Building2 className="h-3 w-3" />
                      Company
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Users className="h-3 w-3" />
                      Individual
                    </Badge>
                  )}
                  <StatusBadge 
                    status={client.status.toLowerCase() as 'active' | 'inactive' | 'pending'} 
                    showDot 
                  />
                </div>
              </div>
            </div>

            {viewMode === 'detailed' && (
              <div className="space-y-3">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
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
                  <span>Registered: {format(new Date(client.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="secondary">
                    {client._count?.cases || 0} cases
                  </Badge>
                  <Badge variant="secondary">
                    {client._count?.documents || 0} documents
                  </Badge>
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
                <Badge variant="secondary" className="text-xs">
                  {client._count?.cases || 0} cases
                </Badge>
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit} className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit Client
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete} 
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
