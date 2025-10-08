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
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGuard } from '@/components/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { useTranslations } from 'next-intl';
import { 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Euro, 
  CreditCard, 
  FileSearch, 
  Briefcase,
  Receipt,
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PaymentList } from '@/components/payments/payment-list';
import { InvoiceTemplates } from '@/components/invoices/invoice-templates';
import { InvoiceSearchFilters } from '@/components/invoices/invoice-search-filters';
import { CustomLineChart, CustomPieChart } from '@/components/charts';

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
  email: string | null;
  phone: string | null;
  clientType: string;
  status: string;
  _count: {
    cases: number;
    documents: number;
  };
}

interface TimeEntry {
  id: string;
  date: string;
  duration: number;
  description: string;
  hourlyRate: number;
  amount: number;
  case: {
    id: string;
    title: string;
    caseNumber: string | null;
  } | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface BillableTimeData {
  timeEntries: TimeEntry[];
  summary: {
    totalEntries: number;
    totalHours: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  };
}

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  clientId: string;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    clientType: string;
  };
}

interface CaseInvoicePreview {
  case: Case;
  timeEntries: TimeEntry[];
  summary: {
    totalEntries: number;
    totalHours: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  };
}


export default function InvoicesPage() {
  const t = useTranslations();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [billableTimeData, setBillableTimeData] = useState<BillableTimeData | null>(null);
  const [loadingBillableTime, setLoadingBillableTime] = useState(false);

  // Case-based invoice generation state
  const [isCaseInvoiceDialogOpen, setIsCaseInvoiceDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [caseInvoicePreview, setCaseInvoicePreview] = useState<CaseInvoicePreview | null>(null);
  const [loadingCasePreview, setLoadingCasePreview] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
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
    loadCases();
  }, [loadInvoices, loadClients, loadCases]);

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
    } catch {
      console.error('Error loading invoices');
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
        setClients(Array.isArray(data.clients) ? data.clients : []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadCases = async () => {
    try {
      const response = await fetch('/api/cases');
      if (response.ok) {
        const data = await response.json();
        setCases(Array.isArray(data.cases) ? data.cases : []);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadCaseInvoicePreview = async (caseId: string) => {
    if (!caseId) {
      setCaseInvoicePreview(null);
      return;
    }

    setLoadingCasePreview(true);
    try {
      const response = await fetch(`/api/invoices/from-case?caseId=${caseId}`);
      if (response.ok) {
        const data = await response.json();
        setCaseInvoicePreview(data);
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri učitavanju podataka',
          variant: 'destructive',
        });
        setCaseInvoicePreview(null);
      }
    } catch (error) {
      console.error('Error loading case preview:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju podataka',
        variant: 'destructive',
      });
      setCaseInvoicePreview(null);
    } finally {
      setLoadingCasePreview(false);
    }
  };

  const handleGenerateFromCase = async () => {
    if (!selectedCaseId) {
      toast({
        title: 'Greška',
        description: 'Molimo odaberite predmet',
        variant: 'destructive',
      });
      return;
    }

    if (!caseInvoicePreview || caseInvoicePreview.timeEntries.length === 0) {
      toast({
        title: 'Greška',
        description: 'Nema nenaplaćenih unosa vremena za ovaj predmet',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingInvoice(true);
    try {
      const response = await fetch('/api/invoices/from-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: selectedCaseId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Uspjeh',
          description: data.message || 'Račun je uspješno kreiran',
        });
        setIsCaseInvoiceDialogOpen(false);
        setSelectedCaseId('');
        setCaseInvoicePreview(null);
        loadInvoices();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri kreiranju računa',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating invoice from case:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri kreiranju računa',
        variant: 'destructive',
      });
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const loadBillableTimeData = async (clientId: string) => {
    if (!clientId) {
      setBillableTimeData(null);
      return;
    }

    setLoadingBillableTime(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/billable-time`);
      if (response.ok) {
        const data = await response.json();
        setBillableTimeData(data);
      } else {
        console.error('Failed to load billable time data:', response.status);
        setBillableTimeData(null);
        toast({
          title: 'Greška',
          description: 'Greška pri učitavanju naplativih sati',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading billable time data:', error);
      setBillableTimeData(null);
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju naplativih sati',
        variant: 'destructive',
      });
    } finally {
      setLoadingBillableTime(false);
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

  const getClientName = (client: { companyName?: string; firstName?: string; lastName?: string }) => {
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

  const handleDownloadPDF = async (invoiceId: string) => {
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

  const handlePreviewPDF = (invoiceId: string) => {
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
    setBillableTimeData(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleTemplateSelect = (template: Record<string, unknown>) => {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            {t('navigation.invoices')}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage invoices, payments, and billing
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(!showTemplates)}
            className="min-h-[44px]"
          >
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <PermissionGuard permission={PERMISSIONS.INVOICES_CREATE}>
            <Button
              variant="outline"
              onClick={() => setIsCaseInvoiceDialogOpen(true)}
              className="min-h-[44px]"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Generate from Case
            </Button>
          </PermissionGuard>
          <PermissionGuard permission={PERMISSIONS.INVOICES_CREATE}>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={openCreateDialog}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
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
                    onClick={() => handlePreviewPDF(editingInvoice.id)}
                  >
                    <FileSearch className="h-4 w-4 mr-2" />
                    Pregledaj PDF
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleDownloadPDF(editingInvoice.id)}
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
                  <Select value={formData.clientId} onValueChange={(value) => {
                    setFormData({ ...formData, clientId: value });
                    loadBillableTimeData(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite klijenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{getClientName(client)}</span>
                            <span className="text-xs text-muted-foreground">
                              {client.clientType === 'COMPANY' ? 'Tvrtka' : 'Osoba'} • {client._count.cases} slučajeva
                            </span>
                          </div>
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

              {/* Billable Time Preview */}
              {formData.clientId && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Pregled naplativih sati</h3>
                    {loadingBillableTime && (
                      <div className="text-sm text-muted-foreground">Učitavanje...</div>
                    )}
                  </div>
                  
                  {billableTimeData && billableTimeData.timeEntries.length > 0 ? (
                    <>
                      {/* Time Entries Table */}
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Datum</TableHead>
                              <TableHead>Slučaj</TableHead>
                              <TableHead>Opis</TableHead>
                              <TableHead>Trajanje</TableHead>
                              <TableHead>Stopa</TableHead>
                              <TableHead>Iznos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {billableTimeData.timeEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="text-sm">
                                  {new Date(entry.date).toLocaleDateString('hr-HR')}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {entry.case ? (
                                    <div>
                                      <div className="font-medium">{entry.case.title}</div>
                                      {entry.case.caseNumber && (
                                        <div className="text-xs text-muted-foreground">
                                          {entry.case.caseNumber}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Bez slučaja</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm max-w-xs truncate">
                                  {entry.description}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {(entry.duration / 60).toFixed(1)}h
                                </TableCell>
                                <TableCell className="text-sm">
                                  {entry.hourlyRate.toFixed(2)} EUR/h
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {entry.amount.toFixed(2)} EUR
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <div className="text-sm text-muted-foreground">Ukupno unosa</div>
                          <div className="text-lg font-semibold">{billableTimeData.summary.totalEntries}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Ukupno sati</div>
                          <div className="text-lg font-semibold">{billableTimeData.summary.totalHours.toFixed(1)}h</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Osnovica</div>
                          <div className="text-lg font-semibold">{billableTimeData.summary.subtotal.toFixed(2)} EUR</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Ukupno (PDV 25%)</div>
                          <div className="text-lg font-semibold text-primary">{billableTimeData.summary.total.toFixed(2)} EUR</div>
                        </div>
                      </div>
                    </>
                  ) : billableTimeData && billableTimeData.timeEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-lg font-medium">Nema naplativih sati</div>
                      <div className="text-sm">Ovaj klijent nema naplative sate za računiranje</div>
                    </div>
                  ) : null}
                </div>
              )}

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

      {/* Case Invoice Generation Dialog */}
      <Dialog open={isCaseInvoiceDialogOpen} onOpenChange={setIsCaseInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generiraj račun iz predmeta</DialogTitle>
            <DialogDescription>
              Odaberite predmet za generiranje računa iz nenaplaćenih unosa vremena
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Case Selector */}
            <div>
              <Label htmlFor="caseSelect">Predmet</Label>
              <Select
                value={selectedCaseId}
                onValueChange={(value) => {
                  setSelectedCaseId(value);
                  loadCaseInvoicePreview(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite predmet" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{caseItem.caseNumber} - {caseItem.title}</span>
                        <span className="text-xs text-muted-foreground">
                          Klijent: {caseItem.client.clientType === 'COMPANY'
                            ? caseItem.client.companyName
                            : `${caseItem.client.firstName || ''} ${caseItem.client.lastName || ''}`.trim()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {loadingCasePreview && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Učitavanje podataka...</p>
              </div>
            )}

            {/* Preview Section */}
            {caseInvoicePreview && !loadingCasePreview && (
              <div className="space-y-4">
                {/* Case Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Informacije o predmetu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Broj predmeta</label>
                      <p className="text-sm font-medium">{caseInvoicePreview.case.caseNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Naziv</label>
                      <p className="text-sm">{caseInvoicePreview.case.title}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Klijent</label>
                      <p className="text-sm">
                        {caseInvoicePreview.case.client.clientType === 'COMPANY'
                          ? caseInvoicePreview.case.client.companyName
                          : `${caseInvoicePreview.case.client.firstName || ''} ${caseInvoicePreview.case.client.lastName || ''}`.trim()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Entries Preview */}
                {caseInvoicePreview.timeEntries.length > 0 ? (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Nenaplaćeni unosi vremena ({caseInvoicePreview.summary.totalEntries})</h3>
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Datum</TableHead>
                              <TableHead>Opis</TableHead>
                              <TableHead>Korisnik</TableHead>
                              <TableHead>Trajanje</TableHead>
                              <TableHead>Iznos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {caseInvoicePreview.timeEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="text-sm">
                                  {new Date(entry.date).toLocaleDateString('hr-HR')}
                                </TableCell>
                                <TableCell className="text-sm max-w-xs truncate">
                                  {entry.description}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {entry.user.firstName && entry.user.lastName
                                    ? `${entry.user.firstName} ${entry.user.lastName}`
                                    : entry.user.email}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {(entry.duration / 60).toFixed(1)}h
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {entry.amount.toFixed(2)} EUR
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">Ukupno unosa</div>
                        <div className="text-lg font-semibold">{caseInvoicePreview.summary.totalEntries}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Ukupno sati</div>
                        <div className="text-lg font-semibold">{caseInvoicePreview.summary.totalHours.toFixed(1)}h</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Osnovica</div>
                        <div className="text-lg font-semibold">{caseInvoicePreview.summary.subtotal.toFixed(2)} EUR</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Ukupno (PDV {caseInvoicePreview.summary.taxRate}%)</div>
                        <div className="text-lg font-semibold text-primary">{caseInvoicePreview.summary.total.toFixed(2)} EUR</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-lg font-medium">Nema nenaplaćenih unosa vremena</div>
                    <div className="text-sm">Ovaj predmet nema nenaplaćenih unosa vremena</div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCaseInvoiceDialogOpen(false);
                  setSelectedCaseId('');
                  setCaseInvoicePreview(null);
                }}
              >
                Odustani
              </Button>
              <Button
                type="button"
                onClick={handleGenerateFromCase}
                disabled={!caseInvoicePreview || caseInvoicePreview.timeEntries.length === 0 || generatingInvoice}
              >
                {generatingInvoice ? 'Generiranje...' : 'Generiraj račun'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
            <Progress 
              value={100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
            <div className="flex items-center gap-1 mt-2">
              <StatusBadge status="active" showDot />
              <span className="text-xs text-muted-foreground">
                {((paidAmount / totalAmount) * 100).toFixed(0)}% paid
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{paidAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total paid</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€{outstandingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
            <CardDescription>
              Monthly revenue and payment trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomLineChart 
              data={[
                { name: 'Jan', revenue: 12000, paid: 10000 },
                { name: 'Feb', revenue: 15000, paid: 12000 },
                { name: 'Mar', revenue: 18000, paid: 15000 },
                { name: 'Apr', revenue: 16000, paid: 14000 },
                { name: 'May', revenue: 20000, paid: 18000 },
                { name: 'Jun', revenue: 22000, paid: 20000 },
              ]} 
              config={{
                revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
                paid: { label: 'Paid', color: 'hsl(var(--success))' }
              }}
              height={300}
            />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Status
            </CardTitle>
            <CardDescription>
              Invoice payment status distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomPieChart 
              data={[
                { name: 'Paid', value: 65, color: 'hsl(var(--success))' },
                { name: 'Pending', value: 25, color: 'hsl(var(--warning))' },
                { name: 'Overdue', value: 10, color: 'hsl(var(--destructive))' },
              ]} 
              config={{
                value: { label: 'Invoices' }
              }}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Overview of all invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={invoices.length === 0 ? "No invoices" : "No matching invoices"}
              description={invoices.length === 0 ? "Get started by creating your first invoice" : "Try adjusting your filters"}
            />
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
                          onClick={() => handlePreviewPDF(invoice.id)}
                          title="Pregledaj PDF račun"
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <FileSearch className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice.id)}
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
                              onClick={() => handlePreviewPDF(invoice.id)}
                              title="Pregledaj PDF račun"
                            >
                              <FileSearch className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadPDF(invoice.id)}
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
