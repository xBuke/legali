'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  Filter,
  Tag,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  File,
  Image,
  FileSpreadsheet,
  FilePdf
} from 'lucide-react'

interface CaseDocument {
  id: string
  caseId: string
  name: string
  originalName: string
  type: 'contract' | 'evidence' | 'correspondence' | 'filing' | 'other'
  category: string
  uploadedBy: string
  uploadedAt: Date
  version: number
  isLatest: boolean
  tags: string[]
  fileSize: number
  mimeType: string
  fileUrl: string
  description?: string
  isApproved: boolean
  approvedBy?: string
  approvedAt?: Date
}

interface DocumentTemplate {
  id: string
  name: string
  type: string
  category: string
  description: string
  fileUrl: string
  isPublic: boolean
  createdAt: Date
}

interface CaseDocumentManagementProps {
  caseId: string
  caseNumber: string
}

const mockDocuments: CaseDocument[] = [
  {
    id: '1',
    caseId: 'case-1',
    name: 'Tužba - Građanski spor',
    originalName: 'tuzba_gradjanski_spor.pdf',
    type: 'filing',
    category: 'Tužbe',
    uploadedBy: 'Marko Kovač',
    uploadedAt: new Date('2024-01-20'),
    version: 1,
    isLatest: true,
    tags: ['tužba', 'građanski', 'spor'],
    fileSize: 245760,
    mimeType: 'application/pdf',
    fileUrl: '/documents/tuzba_gradjanski_spor.pdf',
    description: 'Tužba za građanski spor',
    isApproved: true,
    approvedBy: 'Ana Novak',
    approvedAt: new Date('2024-01-21')
  },
  {
    id: '2',
    caseId: 'case-1',
    name: 'Dokazi - Ugovor',
    originalName: 'ugovor_dokaz.pdf',
    type: 'evidence',
    category: 'Dokazi',
    uploadedBy: 'Petra Horvat',
    uploadedAt: new Date('2024-01-18'),
    version: 1,
    isLatest: true,
    tags: ['ugovor', 'dokaz', 'spor'],
    fileSize: 512000,
    mimeType: 'application/pdf',
    fileUrl: '/documents/ugovor_dokaz.pdf',
    description: 'Ugovor kao dokaz u sporu',
    isApproved: false
  },
  {
    id: '3',
    caseId: 'case-1',
    name: 'Korespondencija - Sud',
    originalName: 'korespondencija_sud.docx',
    type: 'correspondence',
    category: 'Korespondencija',
    uploadedBy: 'Marko Kovač',
    uploadedAt: new Date('2024-01-15'),
    version: 2,
    isLatest: true,
    tags: ['sud', 'korespondencija', 'spor'],
    fileSize: 128000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileUrl: '/documents/korespondencija_sud.docx',
    description: 'Korespondencija s sudom',
    isApproved: true,
    approvedBy: 'Ana Novak',
    approvedAt: new Date('2024-01-16')
  }
]

const mockTemplates: DocumentTemplate[] = [
  {
    id: '1',
    name: 'Tužba - Građanski spor',
    type: 'filing',
    category: 'Tužbe',
    description: 'Standardni template za tužbu u građanskom sporu',
    fileUrl: '/templates/tuzba_gradjanski_spor.docx',
    isPublic: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Ugovor o zastupanju',
    type: 'contract',
    category: 'Ugovori',
    description: 'Standardni ugovor o zastupanju',
    fileUrl: '/templates/ugovor_zastupanje.docx',
    isPublic: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Zahtjev za izvršenje',
    type: 'filing',
    category: 'Zahtjevi',
    description: 'Template za zahtjev za izvršenje',
    fileUrl: '/templates/zahtjev_izvrsenje.docx',
    isPublic: false,
    createdAt: new Date('2024-01-15')
  }
]

const documentTypes = [
  { value: 'contract', label: 'Ugovor' },
  { value: 'evidence', label: 'Dokaz' },
  { value: 'correspondence', label: 'Korespondencija' },
  { value: 'filing', label: 'Podnošenje' },
  { value: 'other', label: 'Ostalo' }
]

const categories = [
  'Tužbe', 'Dokazi', 'Korespondencija', 'Ugovori', 'Zahtjevi', 'Odluke', 'Presude', 'Ostalo'
]

export function CaseDocumentManagement({ caseId, caseNumber }: CaseDocumentManagementProps) {
  const [documents, setDocuments] = useState<CaseDocument[]>(mockDocuments)
  const [templates, setTemplates] = useState<DocumentTemplate[]>(mockTemplates)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FilePdf className="h-5 w-5 text-red-500" />
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />
    if (mimeType.includes('image')) return <Image className="h-5 w-5 text-green-500" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800'
      case 'evidence': return 'bg-green-100 text-green-800'
      case 'correspondence': return 'bg-yellow-100 text-yellow-800'
      case 'filing': return 'bg-purple-100 text-purple-800'
      case 'other': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === 'all' || doc.type === selectedType
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    return matchesSearch && matchesType && matchesCategory
  })

  const handleApproveDocument = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { 
            ...doc, 
            isApproved: true, 
            approvedBy: 'Marko Kovač', 
            approvedAt: new Date() 
          }
        : doc
    ))
  }

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dokumenti predmeta</h2>
          <p className="text-muted-foreground">
            Upravljanje dokumentima za predmet {caseNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Iz predloška
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Stvori dokument iz predloška</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <Card key={template.id} className="cursor-pointer hover:bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{template.category}</Badge>
                              {template.isPublic && (
                                <Badge variant="secondary">Javni</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Učitaj dokument
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Učitaj novi dokument</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Odaberite datoteku</Label>
                  <Input id="file-upload" type="file" />
                </div>
                <div>
                  <Label htmlFor="document-type">Tip dokumenta</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite tip" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="document-category">Kategorija</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite kategoriju" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Odustani
                  </Button>
                  <Button onClick={() => setIsUploadOpen(false)}>
                    Učitaj
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pretraži dokumente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi tipovi</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve kategorije</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.map((document) => (
          <Card key={document.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(document.mimeType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{document.name}</h3>
                      <Badge className={getTypeColor(document.type)}>
                        {documentTypes.find(t => t.value === document.type)?.label}
                      </Badge>
                      {document.isApproved ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Odobren
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Na čekanju
                        </Badge>
                      )}
                      {!document.isLatest && (
                        <Badge variant="outline">v{document.version}</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {document.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{document.uploadedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{document.uploadedAt.toLocaleDateString()}</span>
                      </div>
                      <span>{formatFileSize(document.fileSize)}</span>
                    </div>
                    
                    {document.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {document.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {document.isApproved && document.approvedBy && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Odobrio: {document.approvedBy} ({document.approvedAt?.toLocaleDateString()})
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!document.isApproved && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleApproveDocument(document.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteDocument(document.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nema dokumenata</h3>
            <p className="text-muted-foreground mb-4">
              Nema dokumenata koji odgovaraju vašim kriterijima pretrage.
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Učitaj prvi dokument
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
