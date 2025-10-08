'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Trash2, Download, Calendar, Link as LinkIcon, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { hr } from 'date-fns/locale'

type Document = {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  fileUrl: string
  title?: string
  description?: string
  category?: string
  createdAt: string
  case?: {
    id: string
    caseNumber: string
    title: string
  }
  client?: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    clientType: string
  }
}

interface DocumentCardProps {
  document: Document
  viewMode: 'compact' | 'detailed'
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  onDownload?: () => void
}

export function DocumentCard({ document, viewMode, onEdit, onDelete, onView, onDownload }: DocumentCardProps) {
  const getClientName = (client?: Document['client']) => {
    if (!client) return null
    if (client.clientType === 'COMPANY') {
      return client.companyName || 'Bez naziva'
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Bez imena'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('text')) return '📃'
    return '📁'
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getFileTypeIcon(document.mimeType)}</span>
            <h3 className="font-semibold text-lg truncate">
              {document.title || document.originalName}
            </h3>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            {document.category && (
              <Badge variant="outline" className="text-xs">
                {document.category}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {document.mimeType.split('/')[1]?.toUpperCase() || document.mimeType.split('/')[0]?.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(document.fileSize)}
            </span>
          </div>

          {viewMode === 'detailed' && (
            <div className="mt-3 space-y-2">
              {document.case && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                  <span>Predmet: </span>
                  <Link 
                    href={`/dashboard/cases/${document.case.id}`} 
                    className="text-primary hover:underline"
                  >
                    {document.case.caseNumber}
                  </Link>
                </div>
              )}
              {document.client && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Klijent: </span>
                  <Link 
                    href={`/dashboard/clients/${document.client.id}`} 
                    className="text-primary hover:underline"
                  >
                    {getClientName(document.client)}
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Kreiran: {format(new Date(document.createdAt), 'dd.MM.yyyy', { locale: hr })}</span>
              </div>
              {document.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {document.description}
                </p>
              )}
            </div>
          )}

          {viewMode === 'compact' && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {document.case && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  <Link 
                    href={`/dashboard/cases/${document.case.id}`} 
                    className="text-primary hover:underline"
                  >
                    {document.case.caseNumber}
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(document.createdAt), 'dd.MM.yyyy')}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 ml-3">
          <Button size="sm" variant="outline" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDownload || (() => {})}>
            <Download className="h-4 w-4" />
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
