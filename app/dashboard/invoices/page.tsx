'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGuard } from '@/components/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { Plus, FileText, Download, Edit, Trash2, Eye, Calendar, Euro, CreditCard, FileSearch } from 'lucide-react';
import { PaymentList } from '@/components/payments/payment-list';
import { InvoiceTemplates } from '@/components/invoices/invoice-templates';
import { InvoiceSearchFilters } from '@/components/invoices/invoice-search-filters';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  notes: string | null;
  terms: string | null;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string | null;
  };
}

interface Client {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}


export default function InvoicesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: [] as string[],
    client: [] as string[],
    dateRange: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined,
    },
    amountRange: {
      min: undefined as number | undefined,
      max: undefined as number | undefined,
    },
  });
  
  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: '',
    notes: '',
    terms: '',
  });

  // Load data
  useEffect(() => {
    loadInvoices();
    loadClients();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      } else {
        console.error('Failed to load invoices:', response.status);
        setInvoices([]);
        toast({
          title: 'Greška',
          description: 'Greška pri učitavanju računa',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju računa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary' as const, label: 'Nacrt' },
      SENT: { variant: 'default' as const, label: 'Poslan' },
      PAID: { variant: 'default' as const, label: 'Plaćen' },
      OVERDUE: { variant: 'destructive' as const, label: 'Dospio' },
      CANCELLED: { variant: 'outline' as const, label: 'Otkazan' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getClientName = (client: any) => {
    if (client.companyName) {
      return client.companyName;
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hr-HR');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.dueDate) {
      toast({
        title: 'Greška',
        description: 'Klijent i datum dospijeća su obavezni',
        variant: 'destructive',
      });
      return;
    }


    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Račun je uspješno stvoren',
        });
        loadInvoices();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri stvaranju računa',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri stvaranju računa',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj račun?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Račun je obrisan',
        });
        loadInvoices();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri brisanju računa',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri brisanju računa',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAID',
          paidDate: new Date().toISOString(),
          amountPaid: invoices.find(inv => inv.id === id)?.total || 0,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Račun je označen kao plaćen',
        });
        loadInvoices();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri ažuriranju računa',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri ažuriranju računa',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `racun-${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Uspjeh',
          description: 'PDF račun je preuzet',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri preuzimanju PDF-a',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri preuzimanju PDF-a',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewPDF = (invoiceId: string, invoiceNumber: string) => {
    try {
      // Open PDF in new tab for preview
      const previewUrl = `/api/invoices/${invoiceId}/preview`;
      window.open(previewUrl, '_blank');
      
      toast({
        title: 'Uspjeh',
        description: 'PDF račun je otvoren za pregled',
      });
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri otvaranju PDF pregleda',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      dueDate: '',
      notes: '',
      terms: '',
    });
  };

  // Filter invoices based on current filters
  const filteredInvoices = invoices.filter(invoice => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        getClientName(invoice.client).toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(invoice.status)) {
      return false;
    }

    // Client filter
    if (filters.client.length > 0 && !filters.client.includes(invoice.client.id)) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const issueDate = new Date(invoice.issueDate);
      if (filters.dateRange.from && issueDate < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to && issueDate > filters.dateRange.to) {
        return false;
      }
    }

    // Amount range filter
    if (filters.amountRange.min !== undefined && invoice.total < filters.amountRange.min) {
      return false;
    }
    if (filters.amountRange.max !== undefined && invoice.total > filters.amountRange.max) {
      return false;
    }

    return true;
  });

  const openCreateDialog = () => {
    setEditingInvoice(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleTemplateSelect = (template: any) => {
    // When a template is selected, open the create invoice dialog with template data
    setFormData({
      clientId: '',
      dueDate: '',
      notes: template.notes || '',
      terms: template.terms || '',
    });
    setIsDialogOpen(true);
    setShowTemplates(false); // Hide templates section after selection
    
    toast({
      title: 'Predložak odabran',
      description: `Predložak "${template.name}" je odabran. Možete dodati klijenta i stvoriti račun.`,
    });
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsDialogOpen(true);
  };


  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidAmount = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const outstandingAmount = totalAmount - paidAmount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Računi</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Upravljajte računima i naplatom
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowTemplates(!showTemplates)}
            className="min-h-[44px]"
          >
            <FileText className="h-4 w-4 mr-2" />
            Predlošci
          </Button>
          <PermissionGuard permission={PERMISSIONS.INVOICES_CREATE}>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={openCreateDialog}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novi račun
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? `Pregled računa ${editingInvoice.invoiceNumber}` : 'Novi račun'}
              </DialogTitle>
              <DialogDescription>
                {editingInvoice 
                  ? `Pregled računa za ${getClientName(editingInvoice.client)}`
                  : 'Stvorite novi račun odabiranjem klijenta'
                }
              </DialogDescription>
            </DialogHeader>
            {editingInvoice ? (
              <div className="space-y-6">
                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Broj računa</Label>
                    <Input value={editingInvoice.invoiceNumber} disabled />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-2">{getStatusBadge(editingInvoice.status)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Klijent</Label>
                    <Input value={getClientName(editingInvoice.client)} disabled />
                  </div>
                  <div>
                    <Label>Datum dospijeća</Label>
                    <Input value={formatDate(editingInvoice.dueDate)} disabled />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Ukupno</Label>
                    <Input value={`${editingInvoice.total.toFixed(2)} EUR`} disabled />
                  </div>
                  <div>
                    <Label>Plaćeno</Label>
                    <Input value={`${editingInvoice.amountPaid.toFixed(2)} EUR`} disabled />
                  </div>
                  <div>
                    <Label>Preostalo</Label>
                    <Input value={`${(editingInvoice.total - editingInvoice.amountPaid).toFixed(2)} EUR`} disabled />
                  </div>
                </div>

                {editingInvoice.notes && (
                  <div>
                    <Label>Napomene</Label>
                    <Textarea value={editingInvoice.notes} disabled rows={3} />
                  </div>
                )}

                {editingInvoice.terms && (
                  <div>
                    <Label>Uvjeti plaćanja</Label>
                    <Textarea value={editingInvoice.terms} disabled rows={3} />
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Zatvori
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handlePreviewPDF(editingInvoice.id, editingInvoice.invoiceNumber)}
                  >
                    <FileSearch className="h-4 w-4 mr-2" />
                    Pregledaj PDF
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleDownloadPDF(editingInvoice.id, editingInvoice.invoiceNumber)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Preuzmi PDF
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Klijent</Label>
                  <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite klijenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {getClientName(client)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Datum dospijeća</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Napomene</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Dodatne napomene za račun..."
                />
              </div>

              <div>
                <Label htmlFor="terms">Uvjeti plaćanja</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Uvjeti plaćanja..."
                />
              </div>


                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Odustani
                  </Button>
                  <Button type="submit">
                    Stvori račun
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
        </PermissionGuard>
        </div>
      </div>

      {/* Templates Section */}
      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle>Predlošci računa</CardTitle>
            <CardDescription>
              Upravljajte predlošcima računa za brže stvaranje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceTemplates onTemplateSelect={handleTemplateSelect} />
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Pretraži i filtriraj račune</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            clients={clients}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupno računa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">Svi računi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupni iznos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Svi računi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plaćeno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Ukupno plaćeno</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Neplaćeno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outstandingAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Na čekanju</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Računi</CardTitle>
          <CardDescription>
            Pregled svih računa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {invoices.length === 0 ? 'Nema računa' : 'Nema računa koji odgovaraju filtirima'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-3">
                {filteredInvoices.map((invoice) => (
                  <Card key={invoice.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {invoice.invoiceNumber}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {getClientName(invoice.client)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Datum izdavanja: {formatDate(invoice.issueDate)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Datum dospijeća: {formatDate(invoice.dueDate)}
                          </div>
                          <div className="text-sm font-medium">
                            Iznos: {invoice.total.toFixed(2)} EUR
                          </div>
                          {invoice.amountPaid > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Plaćeno: {invoice.amountPaid.toFixed(2)} EUR
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => handleViewInvoice(invoice)}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => handlePreviewPDF(invoice.id, invoice.invoiceNumber)}
                          title="Pregledaj PDF račun"
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <FileSearch className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                          title="Preuzmi PDF račun"
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <PermissionGuard permission={PERMISSIONS.INVOICES_UPDATE}>
                          {invoice.status !== 'PAID' && (
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <Euro className="h-4 w-4" />
                            </Button>
                          )}
                        </PermissionGuard>
                        <PermissionGuard permission={PERMISSIONS.INVOICES_DELETE}>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDelete(invoice.id)}
                            disabled={invoice.status === 'PAID'}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </PermissionGuard>
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
                      <TableHead>Broj računa</TableHead>
                      <TableHead>Klijent</TableHead>
                      <TableHead>Datum izdavanja</TableHead>
                      <TableHead>Datum dospijeća</TableHead>
                      <TableHead>Iznos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {getClientName(invoice.client)}
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.issueDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.total.toFixed(2)} EUR</div>
                            {invoice.amountPaid > 0 && (
                              <div className="text-sm text-muted-foreground">
                                Plaćeno: {invoice.amountPaid.toFixed(2)} EUR
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePreviewPDF(invoice.id, invoice.invoiceNumber)}
                              title="Pregledaj PDF račun"
                            >
                              <FileSearch className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                              title="Preuzmi PDF račun"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <PermissionGuard permission={PERMISSIONS.INVOICES_UPDATE}>
                              {invoice.status !== 'PAID' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsPaid(invoice.id)}
                                >
                                  <Euro className="h-4 w-4" />
                                </Button>
                              )}
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.INVOICES_DELETE}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(invoice.id)}
                                disabled={invoice.status === 'PAID'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
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

      {/* Payment Management Section */}
      {filteredInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Upravljanje plaćanjima
            </CardTitle>
            <CardDescription>
              Pregled i upravljanje plaćanjima za račune
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getClientName(invoice.client)} • {invoice.total.toFixed(2)} EUR
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Plaćeno</div>
                      <div className="font-medium">{invoice.amountPaid.toFixed(2)} EUR</div>
                    </div>
                  </div>
                  <PaymentList
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                    invoiceTotal={invoice.total}
                    onPaymentsUpdated={loadInvoices}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
