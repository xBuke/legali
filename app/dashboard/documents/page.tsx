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
import { Plus, FileText, Pencil, Trash2, Eye, Download, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { DocumentViewer } from '@/components/document-viewer'

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
}

type Client = {
  id: string
  firstName?: string
  lastName?: string
  companyName?: string
  clientType: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
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

  async function fetchDocuments() {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
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
        setCases(data)
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
    }
  }

  async function fetchClients() {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // For now, we'll create a mock document entry
      // In a real implementation, you'd upload the file to Vercel Blob or S3
      const mockDocument = {
        fileName: formData.file?.name || 'mock-file.pdf',
        originalName: formData.file?.name || 'mock-file.pdf',
        fileSize: formData.file?.size || 1024,
        mimeType: formData.file?.type || 'application/pdf',
        fileUrl: 'https://example.com/mock-file.pdf',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        caseId: formData.caseId === 'none' ? null : formData.caseId || null,
        clientId: formData.clientId === 'none' ? null : formData.clientId || null,
      }

      const url = editingDocument ? `/api/documents/${editingDocument.id}` : '/api/documents'
      const method = editingDocument ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDocument),
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
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće spremiti dokument',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dokumenti</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Upravljajte svojim dokumentima
          </p>
        </div>
        <Button 
          onClick={() => { resetForm(); setDialogOpen(true) }}
          className="w-full sm:w-auto min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj dokument
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Svi dokumenti</CardTitle>
          <CardDescription>
            Pregled svih vaših dokumenata
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
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-3">
                {documents.map((document) => (
                  <Card key={document.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {document.title || document.originalName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {document.mimeType}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {document.category && (
                            <Badge variant="outline" className="text-xs">
                              {document.category}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(document.fileSize)}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {document.case && (
                            <div className="text-sm text-muted-foreground">
                              Predmet: <Link href={`/dashboard/cases/${document.case.id}`} className="text-primary hover:underline">{document.case.caseNumber}</Link>
                            </div>
                          )}
                          {document.client && (
                            <div className="text-sm text-muted-foreground">
                              Klijent: <Link href={`/dashboard/clients/${document.client.id}`} className="text-primary hover:underline">{getClientName(document.client)}</Link>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>{format(new Date(document.createdAt), 'dd.MM.yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingDocument(document)}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(document.fileUrl, '_blank')}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(document)}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(document.id)}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout */}
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
                    {documents.map((document) => (
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
                              onClick={() => window.open(document.fileUrl, '_blank')}
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
              <Label htmlFor="file">Datoteka</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              <p className="text-sm text-muted-foreground">
                Podržani formati: PDF, DOC, DOCX, TXT, JPG, PNG
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
                    {categories.map((category) => (
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
                    {cases.map((caseData) => (
                      <SelectItem key={caseData.id} value={caseData.id}>
                        {caseData.caseNumber} - {caseData.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Klijent</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite klijenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bez klijenta</SelectItem>
                  {clients.map((client) => (
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
