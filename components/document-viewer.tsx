'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2,
  X,
  Calendar,
  User,
  Briefcase,
  Tag
} from 'lucide-react';

interface DocumentViewerProps {
  document: {
    id: string;
    fileName?: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
    title?: string | null;
    description?: string | null;
    category?: string | null;
    createdAt: string;
    case?: {
      id: string;
      caseNumber: string;
      title: string;
    };
    client?: {
      id: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      clientType: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document: doc, isOpen, onClose }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const isPDF = doc.mimeType === 'application/pdf';
  const isImage = doc.mimeType.startsWith('image/');

  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setRotation(0);
      setLoading(true);
      setError(null);
      setDecryptedUrl(null);

      // Fetch decrypted file for preview if it's a PDF or image
      if (isPDF || isImage) {
        fetchDecryptedFile();
      } else {
        setLoading(false);
      }
    }

    // Cleanup blob URL on unmount
    return () => {
      if (decryptedUrl) {
        window.URL.revokeObjectURL(decryptedUrl);
      }
    };
  }, [isOpen, doc.id]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const fetchDecryptedFile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${doc.id}/download`);

      if (!response.ok) {
        throw new Error('Nije moguće dohvatiti dokument');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDecryptedUrl(url);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching decrypted document:', err);
      setError(err instanceof Error ? err.message : 'Greška pri učitavanju dokumenta');
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/documents/${doc.id}/download`);

      if (!response.ok) {
        throw new Error('Preuzimanje nije uspjelo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Greška pri preuzimanju dokumenta');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getClientName = (client?: DocumentViewerProps['document']['client']) => {
    if (!client) return '-';
    if (client.clientType === 'COMPANY') {
      return client.companyName || 'Bez naziva';
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Bez imena';
  };

  const renderDocumentContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Nije moguće prikazati dokument</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              onClick={handleDownload}
              className="mt-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Preuzmi datoteku
            </Button>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Učitavanje dokumenta...</p>
          </div>
        </div>
      );
    }

    if (isPDF && decryptedUrl) {
      return (
        <div className="w-full h-full">
          <iframe
            src={`${decryptedUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=${zoom}`}
            className="w-full h-full border-0 rounded-lg"
            onError={() => {
              setError('Nije moguće učitati PDF datoteku');
              setLoading(false);
            }}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease',
            }}
          />
        </div>
      );
    }

    if (isImage && decryptedUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-muted rounded-lg overflow-hidden">
          <img
            src={decryptedUrl}
            alt={doc.title || doc.originalName}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
              transition: 'transform 0.3s ease',
            }}
            onError={() => {
              setError('Nije moguće učitati sliku');
              setLoading(false);
            }}
          />
        </div>
      );
    }

    // For other file types, show download option
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">Pregled nije dostupan</p>
          <p className="text-sm text-muted-foreground mb-4">
            Datoteka tipa {doc.mimeType} se ne može prikazati u pregledniku
          </p>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Preuzmi datoteku
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-6xl max-h-[90vh]'} p-0`}>
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold truncate">
                {doc.title || doc.originalName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>•</span>
                <span>{doc.mimeType}</span>
                {doc.category && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {doc.category}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Document Content */}
          <div className="flex-1 p-6 pt-0">
            <div className="h-full border rounded-lg overflow-hidden">
              {renderDocumentContent()}
            </div>
          </div>

          {/* Document Info Sidebar */}
          <div className="w-80 border-l bg-muted/30 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Document Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Detalji dokumenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Naziv</label>
                    <p className="text-sm">{doc.title || doc.originalName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Veličina</label>
                    <p className="text-sm">{formatFileSize(doc.fileSize)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tip</label>
                    <p className="text-sm">{doc.mimeType}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Datum kreiranja</label>
                    <p className="text-sm flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(doc.createdAt).toLocaleDateString('hr-HR')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Case Information */}
              {doc.case && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Predmet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Broj predmeta</label>
                      <p className="text-sm font-medium">{doc.case.caseNumber}</p>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-medium text-muted-foreground">Naziv</label>
                      <p className="text-sm">{doc.case.title}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Client Information */}
              {doc.client && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Klijent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Naziv</label>
                      <p className="text-sm">{getClientName(doc.client)}</p>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-medium text-muted-foreground">Tip</label>
                      <p className="text-sm">
                        {doc.client.clientType === 'COMPANY' ? 'Tvrtka' : 'Fizička osoba'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {doc.description && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Opis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Akcije</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading ? 'Preuzimanje...' : 'Preuzmi'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Toolbar for PDF and Images */}
        {(isPDF || isImage) && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {isPDF ? 'PDF preglednik' : 'Pregled slike'}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
