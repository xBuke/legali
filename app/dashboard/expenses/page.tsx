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
import { Plus, Edit, Trash2, Eye, Receipt, Euro } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  receiptUrl: string | null;
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
  invoice: {
    id: string;
    invoiceNumber: string;
  } | null;
}

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  };
}

const EXPENSE_CATEGORIES = [
  'Sudski troškovi',
  'Putni troškovi',
  'Registracija',
  'Poštanski troškovi',
  'Fotokopiranje',
  'Notar',
  'Vještačenje',
  'Ostalo',
];

export default function ExpensesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    caseId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    category: '',
    amount: '',
    receiptUrl: '',
    isBillable: true,
  });

  // Filters
  const [filters, setFilters] = useState({
    category: '',
    isBillable: '',
    isBilled: '',
  });

  // Load data
  useEffect(() => {
    loadExpenses();
    loadCases();
  }, [filters]);

  const loadExpenses = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.isBillable) params.append('isBillable', filters.isBillable);
      if (filters.isBilled) params.append('isBilled', filters.isBilled);

      const response = await fetch(`/api/expenses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else {
        toast({
          title: 'Greška',
          description: 'Greška pri učitavanju troškova',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju troškova',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      const response = await fetch('/api/cases');
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const getCaseName = (caseItem: any) => {
    if (!caseItem) return 'Bez predmeta';
    const clientName = caseItem.client.companyName || 
      `${caseItem.client.firstName || ''} ${caseItem.client.lastName || ''}`.trim();
    return `${caseItem.caseNumber} - ${clientName}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: hr });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.category || !formData.amount) {
      toast({
        title: 'Greška',
        description: 'Opis, kategorija i iznos su obavezni',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: 'Greška',
        description: 'Iznos mora biti veći od 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount,
          caseId: formData.caseId === 'none' ? null : formData.caseId || null,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: editingExpense ? 'Trošak je ažuriran' : 'Trošak je stvoren',
        });
        loadExpenses();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri spremanju troška',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri spremanju troška',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj trošak?')) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Trošak je obrisan',
        });
        loadExpenses();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri brisanju troška',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri brisanju troška',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      caseId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      category: '',
      amount: '',
      receiptUrl: '',
      isBillable: true,
    });
    setEditingExpense(null);
  };

  const openCreateDialog = () => {
    setEditingExpense(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      caseId: expense.case?.id || '',
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      description: expense.description,
      category: expense.category,
      amount: expense.amount.toString(),
      receiptUrl: expense.receiptUrl || '',
      isBillable: expense.isBillable,
    });
    setIsDialogOpen(true);
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const billableAmount = expenses
    .filter(expense => expense.isBillable)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const billedAmount = expenses
    .filter(expense => expense.isBilled)
    .reduce((sum, expense) => sum + expense.amount, 0);

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
          <h1 className="text-3xl font-bold">Troškovi</h1>
          <p className="text-muted-foreground">
            Upravljajte troškovima i naplatom
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.EXPENSES_CREATE}>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novi trošak
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Uredi trošak' : 'Novi trošak'}
                </DialogTitle>
                <DialogDescription>
                  {editingExpense ? 'Uredite podatke o trošku' : 'Dodajte novi trošak'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="caseId">Predmet</Label>
                    <Select value={formData.caseId || 'none'} onValueChange={(value) => setFormData({ ...formData, caseId: value === 'none' ? '' : value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite predmet (opcionalno)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Bez predmeta</SelectItem>
                        {cases.map((caseItem) => (
                          <SelectItem key={caseItem.id} value={caseItem.id}>
                            {getCaseName(caseItem)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Opis</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Opis troška..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Kategorija</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite kategoriju" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Iznos (EUR)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="receiptUrl">URL računa (opcionalno)</Label>
                  <Input
                    id="receiptUrl"
                    value={formData.receiptUrl}
                    onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isBillable"
                    checked={formData.isBillable}
                    onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isBillable">Naplativo klijentu</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Odustani
                  </Button>
                  <Button type="submit">
                    {editingExpense ? 'Ažuriraj' : 'Stvori'}
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
            <CardTitle className="text-sm font-medium">Ukupno troškova</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">Svi troškovi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupni iznos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Svi troškovi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Naplativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{billableAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Naplativo klijentima</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Naplaćeno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{billedAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Već naplaćeno</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filter-category">Kategorija</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sve kategorije" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sve kategorije</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-billable">Naplativo</Label>
              <Select value={filters.isBillable} onValueChange={(value) => setFilters({ ...filters, isBillable: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Svi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi</SelectItem>
                  <SelectItem value="true">Naplativo</SelectItem>
                  <SelectItem value="false">Nenaplativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-billed">Naplaćeno</Label>
              <Select value={filters.isBilled} onValueChange={(value) => setFilters({ ...filters, isBilled: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Svi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi</SelectItem>
                  <SelectItem value="true">Naplaćeno</SelectItem>
                  <SelectItem value="false">Nenaplaćeno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Troškovi</CardTitle>
          <CardDescription>
            Pregled svih troškova
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead>Kategorija</TableHead>
                <TableHead>Predmet</TableHead>
                <TableHead>Iznos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      {expense.receiptUrl && (
                        <a 
                          href={expense.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center mt-1"
                        >
                          <Receipt className="h-3 w-3 mr-1" />
                          Račun
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{getCaseName(expense.case)}</TableCell>
                  <TableCell className="font-medium">
                    {expense.amount.toFixed(2)} EUR
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {expense.isBillable ? (
                        <Badge variant="default">Naplativo</Badge>
                      ) : (
                        <Badge variant="secondary">Nenaplativo</Badge>
                      )}
                      {expense.isBilled && (
                        <Badge variant="outline">Naplaćeno</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <PermissionGuard permission={PERMISSIONS.EXPENSES_UPDATE}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(expense)}
                          disabled={expense.isBilled}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission={PERMISSIONS.EXPENSES_DELETE}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(expense.id)}
                          disabled={expense.isBilled}
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
          
          {expenses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nema troškova
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
