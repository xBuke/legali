'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Download, 
  Calendar, 
  Eye,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentViewer } from '@/components/document-viewer';

interface Document {
  id: string;
  title: string | null;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  category: string | null;
  createdAt: string;
  case?: {
    id: string;
    caseNumber: string;
    title: string;
  };
}

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  const categories = [
    'Ugovor',
    'Tužba',
    'Odluka',
    'Presuda',
    'Dokaz',
    'Korespondencija',
    'Račun',
    'Ostalo',
  ];

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, selectedCategory]);

  const loadDocuments = async () => {
    try {
      // Mock data for demonstration
      setDocuments([
        {
          id: '1',
          title: 'Tužba',
          originalName: 'tuzba.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          fileUrl: 'https://example.com/tuzba.pdf',
          category: 'Tužba',
          createdAt: '2024-01-20',
          case: {
            id: '1',
            caseNumber: 'CASE-000001',
            title: 'Građanski spor - naknada štete',
          },
        },
        {
          id: '2',
          title: 'Dokazni materijal',
          originalName: 'dokazi.pdf',
          fileSize: 2048000,
          mimeType: 'application/pdf',
          fileUrl: 'https://example.com/dokazi.pdf',
          category: 'Dokaz',
          createdAt: '2024-01-25',
          case: {
            id: '1',
            caseNumber: 'CASE-000001',
            title: 'Građanski spor - naknada štete',
          },
        },
        {
          id: '3',
          title: 'Ugovor o radu',
          originalName: 'ugovor_rada.pdf',
          fileSize: 512000,
          mimeType: 'application/pdf',
          fileUrl: 'https://example.com/ugovor_rada.pdf',
          category: 'Ugovor',
          createdAt: '2024-02-10',
          case: {
            id: '2',
            caseNumber: 'CASE-000002',
            title: 'Ugovor o radu - spor',
          },
        },
        {
          id: '4',
          title: 'Presuda',
          originalName: 'presuda.pdf',
          fileSize: 1536000,
          mimeType: 'application/pdf',
          fileUrl: 'https://example.com/presuda.pdf',
          category: 'Presuda',
          createdAt: '2024-03-15',
          case: {
            id: '3',
            caseNumber: 'CASE-000003',
            title: 'Nasljedni postupak',
          },
        },
        {
          id: '5',
          title: 'Korespondencija s protivnom stranom',
          originalName: 'korespondencija.pdf',
          fileSize: 256000,
          mimeType: 'application/pdf',
          fileUrl: 'https://example.com/korespondencija.pdf',
          category: 'Korespondencija',
          createdAt: '2024-01-30',
          case: {
            id: '1',
            caseNumber: 'CASE-000001',
            title: 'Građanski spor - naknada štete',
          },
        },
      ]);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        (doc.title || doc.originalName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.case?.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    setFilteredDocuments(filtered);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hr-HR');
  };

  const handleDownload = (document: Document) => {
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.originalName;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dokumenti</h1>
        <p className="text-gray-600 mt-1">
          Pregled svih dokumenata vezanih za vaše predmete
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupno dokumenata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">Svi dokumenti</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">PDF dokumenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {documents.filter(d => d.mimeType === 'application/pdf').length}
            </div>
            <p className="text-xs text-muted-foreground">PDF formata</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupna veličina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(documents.reduce((sum, doc) => sum + doc.fileSize, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Ukupno prostora</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtriraj dokumente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pretraži dokumente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sve kategorije" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sve kategorije</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumenti</CardTitle>
          <CardDescription>
            {filteredDocuments.length} od {documents.length} dokumenata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedCategory ? 'Nema dokumenata koji odgovaraju filterima' : 'Nema dokumenata'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Kategorija</TableHead>
                  <TableHead>Predmet</TableHead>
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
                        <div>
                          <div className="font-medium text-sm">{document.case.caseNumber}</div>
                          <div className="text-xs text-muted-foreground">{document.case.title}</div>
                        </div>
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
                        {formatDate(document.createdAt)}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer */}
      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  );
}
