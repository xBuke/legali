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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGuard } from '@/components/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { Plus, FileText, Download, Edit, Trash2, Eye, Calendar, Euro } from 'lucide-react';

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
  timeEntries: Array<{
    id: string;
    date: string;
    duration: number;
    description: string;
    hourlyRate: number;
    amount: number;
    user: {
      firstName: string | null;
      lastName: string | null;
    };
  }>;
  expenses: Array<{
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
  }>;
}

interface Client {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}

interface TimeEntry {
  id: string;
  date: string;
  duration: number;
  description: string;
  hourlyRate: number;
  amount: number;
  isBillable: boolean;
  isBilled: boolean;
  case: {
    id: string;
    caseNumber: string;
    title: string;
    client: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      companyName: string | null;
    };
  } | null;
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: '',
    notes: '',
    terms: '',
    selectedTimeEntries: [] as string[],
  });

  // Load data
  useEffect(() => {
    loadInvoices();
    loadClients();
    loadUnbilledTimeEntries();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        toast({
          title: 'Greška',
          description: 'Greška pri učitavanju računa',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
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
        setClients(data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadUnbilledTimeEntries = async () => {
    try {
      const response = await fetch('/api/time-entries');
      if (response.ok) {
        const data = await response.json();
        const unbilled = data.filter((entry: TimeEntry) => entry.isBillable && !entry.isBilled);
        setTimeEntries(unbilled);
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
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

    if (formData.selectedTimeEntries.length === 0) {
      toast({
        title: 'Greška',
        description: 'Odaberite barem jedan unos vremena',
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
          timeEntryIds: formData.selectedTimeEntries,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Račun je uspješno stvoren',
        });
        loadInvoices();
        loadUnbilledTimeEntries();
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
        loadUnbilledTimeEntries();
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

  const resetForm = () => {
    setFormData({
      clientId: '',
      dueDate: '',
      notes: '',
      terms: '',
      selectedTimeEntries: [],
    });
  };

  const openCreateDialog = () => {
    setEditingInvoice(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const toggleTimeEntry = (entryId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTimeEntries: prev.selectedTimeEntries.includes(entryId)
        ? prev.selectedTimeEntries.filter(id => id !== entryId)
        : [...prev.selectedTimeEntries, entryId]
    }));
  };

  const getSelectedTimeEntriesTotal = () => {
    return formData.selectedTimeEntries.reduce((total, entryId) => {
      const entry = timeEntries.find(e => e.id === entryId);
      return total + (entry?.amount || 0);
    }, 0);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Računi</h1>
          <p className="text-muted-foreground">
            Upravljajte računima i naplatom
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.INVOICES_CREATE}>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novi račun
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novi račun</DialogTitle>
              <DialogDescription>
                Stvorite novi račun odabiranjem klijenta i unosa vremena
              </DialogDescription>
            </DialogHeader>
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

              <div>
                <Label>Unosi vremena</Label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {timeEntries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nema dostupnih unosa vremena za naplatu
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {timeEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center space-x-2 p-2 border rounded">
                          <Checkbox
                            id={entry.id}
                            checked={formData.selectedTimeEntries.includes(entry.id)}
                            onCheckedChange={() => toggleTimeEntry(entry.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{entry.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.case ? `${entry.case.caseNumber} - ${getClientName(entry.case.client)}` : 'Bez predmeta'} • 
                              {formatDate(entry.date)} • 
                              {entry.duration} min • 
                              {entry.amount.toFixed(2)} EUR
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.selectedTimeEntries.length > 0 && (
                  <div className="mt-2 text-sm font-medium">
                    Ukupno: {getSelectedTimeEntriesTotal().toFixed(2)} EUR
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit" disabled={formData.selectedTimeEntries.length === 0}>
                  Stvori račun
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </PermissionGuard>
      </div>

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
              {invoices.map((invoice) => (
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
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
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
          
          {invoices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nema računa
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
