'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus,
  FileText, 
  Pencil, 
  Trash2, 
  Eye, 
  Download, 
  Calendar,
  Search,
  Upload,
  Archive
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { DocumentViewer } from '@/components/document-viewer'
import { DocumentSearchFilters, DocumentFilters } from '@/components/documents/document-search-filters'
import { DocumentViewSelector, DocumentViewMode } from '@/components/documents/document-view-selector'
import { DocumentCard } from '@/components/documents/document-card'
import { DocumentTemplates } from '@/components/documents/document-templates'

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

type Case = {
  id: string
  caseNumber: string
  title: string
  clientId: string
}

type Client = {
  id: string
  firstName?: string
  lastName?: string
  companyName?: string
  clientType: string
}

export default function DocumentsPage() {
  const t = useTranslations()
  const [documents, setDocuments] = useState<Document[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [viewMode, setViewMode] = useState<DocumentViewMode>('table')
  const [showTemplates, setShowTemplates] = useState(false)
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    category: [],
    fileType: [],
    case: [],
    client: [],
    dateRange: { from: null, to: null },
    fileSize: { min: 0, max: 0 },
  })
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    caseId: '',
    clientId: '',
    file: null as File | null,
  })

  useEffect(() => {
    fetchDocuments()
    fetchCases()
    fetchClients()
  }, [])

  // Auto-populate client when case is selected
  useEffect(() => {
    if (formData.caseId && formData.caseId !== 'none') {
      const selectedCase = cases.find(c => c.id === formData.caseId)
      if (selectedCase?.clientId) {
        setFormData(prev => ({ ...prev, clientId: selectedCase.clientId }))
      }
    }
  }, [formData.caseId, cases])

  async function fetchDocuments() {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(Array.isArray(data.documents) ? data.documents : [])
      } else {
        console.error('Failed to fetch documents:', response.status)
        setDocuments([])
        toast({
          title: 'Greška',
          description: 'Nije moguće dohvatiti dokumente',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
      toast({
        title: 'Greška',
        description: 'Nije moguće dohvatiti dokumente',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchCases() {
    try {
      const response = await fetch('/api/cases')
      if (response.ok) {
        const data = await response.json()
        setCases(Array.isArray(data.cases) ? data.cases : [])
      } else {
        console.error('Failed to fetch cases:', response.status)
        setCases([])
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
      setCases([])
    }
  }

  async function fetchClients() {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.file && !editingDocument) {
        toast({
          title: 'Greška',
          description: 'Molimo odaberite datoteku',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // Create FormData for file upload
      const uploadData = new FormData()

      // Append file if present
      if (formData.file) {
        uploadData.append('file', formData.file)
      }

      // Append other form fields
      uploadData.append('title', formData.title)

      if (formData.description) {
        uploadData.append('description', formData.description)
      }

      if (formData.category) {
        uploadData.append('category', formData.category)
      }

      if (formData.caseId && formData.caseId !== 'none') {
        uploadData.append('caseId', formData.caseId)
      }

      if (formData.clientId && formData.clientId !== 'none') {
        uploadData.append('clientId', formData.clientId)
      }

      const url = editingDocument ? `/api/documents/${editingDocument.id}` : '/api/documents'
      const method = editingDocument ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        body: uploadData,
      })

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: editingDocument
            ? 'Dokument uspješno ažuriran'
            : 'Dokument uspješno kreiran',
        })
        setDialogOpen(false)
        resetForm()
        fetchDocuments()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Greška pri spremanju dokumenta')
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: error instanceof Error ? error.message : 'Nije moguće spremiti dokument',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(document: Document) {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`)

      if (!response.ok) {
        throw new Error('Preuzimanje nije uspjelo')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.originalName
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće preuzeti dokument',
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj dokument?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Dokument uspješno obrisan',
        })
        fetchDocuments()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće obrisati dokument',
        variant: 'destructive',
      })
    }
  }

  function openEditDialog(document: Document) {
    setEditingDocument(document)
    setFormData({
      title: document.title || '',
      description: document.description || '',
      category: document.category || '',
      caseId: document.case?.id || '',
      clientId: document.client?.id || '',
      file: null,
    })
    setDialogOpen(true)
  }

  function resetForm() {
    setEditingDocument(null)
    setFormData({
      title: '',
      description: '',
      category: '',
      caseId: '',
      clientId: '',
      file: null,
    })
  }

  function getClientName(client?: Document['client']) {
    if (!client) return '-'
    if (client.clientType === 'COMPANY') {
      return client.companyName || 'Bez naziva'
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Bez imena'
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Filter documents based on current filters
  const filteredDocuments = Array.isArray(documents) ? documents.filter(document => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        (document.title || document.originalName).toLowerCase().includes(searchLower) ||
        document.category?.toLowerCase().includes(searchLower) ||
        document.case?.caseNumber.toLowerCase().includes(searchLower) ||
        document.case?.title.toLowerCase().includes(searchLower) ||
        getClientName(document.client)?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Category filter
    if (filters.category.length > 0 && (!document.category || !filters.category.includes(document.category))) {
      return false
    }

    // File type filter
    if (filters.fileType.length > 0) {
      const documentFileType = document.mimeType.split('/')[1] || document.mimeType.split('/')[0]
      if (!filters.fileType.includes(documentFileType)) {
        return false
      }
    }

    // Case filter
    if (filters.case.length > 0 && (!document.case || !filters.case.includes(document.case.id))) {
      return false
    }

    // Client filter
    if (filters.client.length > 0 && (!document.client || !filters.client.includes(document.client.id))) {
      return false
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const documentDate = new Date(document.createdAt)
      if (filters.dateRange.from && documentDate < filters.dateRange.from) {
        return false
      }
      if (filters.dateRange.to && documentDate > filters.dateRange.to) {
        return false
      }
    }

    // File size filter
    if (filters.fileSize.min > 0 || filters.fileSize.max > 0) {
      const documentSizeMB = document.fileSize / (1024 * 1024)
      if (filters.fileSize.min > 0 && documentSizeMB < filters.fileSize.min) {
        return false
      }
      if (filters.fileSize.max > 0 && documentSizeMB > filters.fileSize.max) {
        return false
      }
    }

    return true
  }) : []

  const categories = [
    'Ugovor',
    'Tužba',
    'Odluka',
    'Presuda',
    'Dokaz',
    'Korespondencija',
    'Račun',
    'Ostalo',
  ]

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            {t('navigation.documents')}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your documents and files
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <Archive className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true) }}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Document Templates */}
      {showTemplates && (
        <DocumentTemplates className="mb-6" />
      )}

      {/* Search and Filters */}
      <Card className="card-hover">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter Documents
              </CardTitle>
              <CardDescription>
                Find documents using various criteria and filters
              </CardDescription>
            </div>
            <DocumentViewSelector 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <DocumentSearchFilters 
            filters={filters}
            onFiltersChange={setFilters}
            documents={documents}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Dokumenti ({filteredDocuments.length})
            {filteredDocuments.length !== documents.length && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                od {documents.length} ukupno
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Pregled vaših dokumenata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Još nema dokumenata</p>
              <Button
                onClick={() => { resetForm(); setDialogOpen(true) }}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj prvi dokument
              </Button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nema dokumenata koji odgovaraju filtirima</p>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDocuments.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      viewMode="detailed"
                      onEdit={() => openEditDialog(document)}
                      onDelete={() => handleDelete(document.id)}
                      onView={() => setViewingDocument(document)}
                      onDownload={() => handleDownload(document)}
                    />
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {filteredDocuments.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      viewMode="compact"
                      onEdit={() => openEditDialog(document)}
                      onDelete={() => handleDelete(document.id)}
                      onView={() => setViewingDocument(document)}
                      onDownload={() => handleDownload(document)}
                    />
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naziv</TableHead>
                        <TableHead>Kategorija</TableHead>
                        <TableHead>Predmet</TableHead>
                        <TableHead>Klijent</TableHead>
                        <TableHead>Veličina</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead className="text-right">Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{document.title || document.originalName}</div>
                              <div className="text-sm text-muted-foreground">
                                {document.mimeType}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {document.category && (
                              <Badge variant="outline">
                                {document.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {document.case ? (
                              <Link 
                                href={`/dashboard/cases/${document.case.id}`}
                                className="text-primary hover:underline"
                              >
                                {document.case.caseNumber}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {document.client ? (
                              <Link 
                                href={`/dashboard/clients/${document.client.id}`}
                                className="text-primary hover:underline"
                              >
                                {getClientName(document.client)}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatFileSize(document.fileSize)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(document.createdAt), 'dd.MM.yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewingDocument(document)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(document)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(document)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(document.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Mobile fallback for table view */}
              {viewMode === 'table' && (
                <div className="block md:hidden space-y-3">
                  {filteredDocuments.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      viewMode="detailed"
                      onEdit={() => openEditDialog(document)}
                      onDelete={() => handleDelete(document.id)}
                      onView={() => setViewingDocument(document)}
                      onDownload={() => handleDownload(document)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Uredi dokument' : 'Dodaj novi dokument'}
            </DialogTitle>
            <DialogDescription>
              Unesite podatke o dokumentu
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Naziv dokumenta *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="npr. Ugovor o radu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Datoteka {!editingDocument && '*'}</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                required={!editingDocument}
              />
              <p className="text-sm text-muted-foreground">
                Podržani formati: PDF, DOC, DOCX, TXT, JPG, PNG (max 50MB)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorija</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite kategoriju" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caseId">Predmet</Label>
                <Select
                  value={formData.caseId}
                  onValueChange={(value) => setFormData({ ...formData, caseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite predmet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bez predmeta</SelectItem>
                    {Array.isArray(cases) && cases.map((caseData) => (
                      <SelectItem key={caseData.id} value={caseData.id}>
                        {caseData.caseNumber} - {caseData.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">
                Klijent
                {formData.caseId && formData.caseId !== 'none' && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (automatski iz predmeta)
                  </span>
                )}
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                disabled={formData.caseId !== '' && formData.caseId !== 'none'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite klijenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bez klijenta</SelectItem>
                  {Array.isArray(clients) && clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.clientType === 'COMPANY'
                        ? client.companyName
                        : `${client.firstName} ${client.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detaljan opis dokumenta..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {setDialogOpen(false); resetForm()}}
              >
                Odustani
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Spremanje...' : editingDocument ? 'Spremi' : 'Dodaj dokument'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  )
}
