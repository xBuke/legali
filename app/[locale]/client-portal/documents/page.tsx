'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Download, 
  Calendar, 
  Eye,
  Search,
  Filter,
  FileText
} from 'lucide-react';
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
  const t = useTranslations('clientPortal');

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

  const filterDocuments = useCallback(() => {
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
  }, [documents, searchTerm, selectedCategory]);

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


  const handleDownload = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.originalName;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('documents.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('documents.subtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              {t('documents.stats.totalDocuments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">{t('documents.stats.allDocuments')}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              {t('documents.stats.pdfDocuments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {documents.filter(d => d.mimeType === 'application/pdf').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('documents.stats.pdfFormat')}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              {t('documents.stats.totalSize')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(documents.reduce((sum, doc) => sum + doc.fileSize, 0))}
            </div>
            <p className="text-xs text-muted-foreground">{t('documents.stats.totalSpace')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            {t('documents.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('documents.filters.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('documents.filters.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('documents.filters.allCategories')}</SelectItem>
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
          <CardTitle>{t('documents.list.title')}</CardTitle>
          <CardDescription>
            {filteredDocuments.length} {t('documents.list.of')} {documents.length} {t('documents.list.documents')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={searchTerm || selectedCategory ? t('emptyStates.noMatchingDocuments') : t('emptyStates.noDocuments')}
              description={searchTerm || selectedCategory ? t('emptyStates.noMatchingDocumentsDescription') : t('emptyStates.noDocumentsDescription')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.category')}</TableHead>
                  <TableHead>{t('table.case')}</TableHead>
                  <TableHead>{t('table.size')}</TableHead>
                  <TableHead>{t('table.date')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => {
                  return (
                    <TableRow key={document.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{document.title || document.originalName}</div>
                            <div className="text-sm text-muted-foreground">
                              {document.mimeType}
                            </div>
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
                            title={t('documents.actions.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(document)}
                            title={t('documents.actions.download')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
