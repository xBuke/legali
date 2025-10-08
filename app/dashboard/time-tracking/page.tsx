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
import { Plus, Clock, Edit, Trash2, Filter, Play, Pause, Square } from 'lucide-react';
import { TimeEntrySearchFilters } from '@/components/time-tracking/time-entry-search-filters';

interface TimeEntry {
  id: string;
  date: string;
  duration: number;
  description: string;
  hourlyRate: number;
  amount: number;
  isBillable: boolean;
  isBilled: boolean;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
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
    status: string;
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

export default function TimeTrackingPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    case: [] as string[],
    user: [] as string[],
    billable: null as boolean | null,
    status: [] as string[],
    dateRange: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined,
    },
    durationRange: {
      min: undefined as number | undefined,
      max: undefined as number | undefined,
    },
  });
  
  // Timer state
  const [timer, setTimer] = useState({
    isRunning: false,
    startTime: null as Date | null,
    elapsedTime: 0,
    caseId: 'none',
    description: '',
  });
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: '',
    description: '',
    hourlyRate: '',
    isBillable: true,
    caseId: 'none',
  });

  // Load data
  useEffect(() => {
    loadTimeEntries();
    loadCases();
    loadUsers();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && timer.startTime) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          elapsedTime: Date.now() - prev.startTime!.getTime(),
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime]);

  const loadTimeEntries = async () => {
    try {
      const response = await fetch('/api/time-entries');
      if (response.ok) {
        const data = await response.json();
        setTimeEntries(Array.isArray(data.timeEntries) ? data.timeEntries : []);
      } else {
        toast({
          title: 'Greška',
          description: 'Greška pri učitavanju unosa vremena',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju unosa vremena',
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
        setCases(Array.isArray(data.cases) ? data.cases : []);
      } else {
        console.error('Failed to load cases:', response.status);
        setCases([]);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
      setCases([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        const usersArray = Array.isArray(data) ? data : [];
        setUsers(usersArray.map((user: any) => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
        })));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hr-HR');
  };

  const getClientName = (client: { firstName: string | null; lastName: string | null; companyName: string | null }) => {
    if (client.companyName) {
      return client.companyName;
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim();
  };

  // Timer functions
  const startTimer = () => {
    if (!timer.caseId || timer.caseId === 'none') {
      toast({
        title: 'Greška',
        description: 'Odaberite predmet prije pokretanja timera',
        variant: 'destructive',
      });
      return;
    }
    
    setTimer(prev => ({
      ...prev,
      isRunning: true,
      startTime: new Date(),
    }));
  };

  const stopTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false,
      startTime: null,
    }));
  };

  const saveTimerEntry = async () => {
    if (!timer.description.trim()) {
      toast({
        title: 'Greška',
        description: 'Unesite opis rada',
        variant: 'destructive',
      });
      return;
    }

    const duration = Math.floor(timer.elapsedTime / 60000); // Convert to minutes
    if (duration < 1) {
      toast({
        title: 'Greška',
        description: 'Vrijeme mora biti najmanje 1 minuta',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          duration,
          description: timer.description,
          hourlyRate: 100, // Default rate, should be configurable
          isBillable: true,
          caseId: timer.caseId === 'none' ? '' : timer.caseId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Unos vremena je spremljen',
        });
        loadTimeEntries();
        setTimer({
          isRunning: false,
          startTime: null,
          elapsedTime: 0,
          caseId: 'none',
          description: '',
        });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Greška pri spremanju unosa vremena',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.duration || !formData.hourlyRate) {
      toast({
        title: 'Greška',
        description: 'Opis, trajanje i satnica su obavezni',
        variant: 'destructive',
      });
      return;
    }

    const duration = parseInt(formData.duration);
    const hourlyRate = parseFloat(formData.hourlyRate);

    if (duration <= 0) {
      toast({
        title: 'Greška',
        description: 'Trajanje mora biti veće od 0',
        variant: 'destructive',
      });
      return;
    }

    if (hourlyRate <= 0) {
      toast({
        title: 'Greška',
        description: 'Satnica mora biti veća od 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingEntry ? `/api/time-entries/${editingEntry.id}` : '/api/time-entries';
      const method = editingEntry ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          caseId: formData.caseId === 'none' ? '' : formData.caseId,
          duration,
          hourlyRate,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: editingEntry ? 'Unos vremena je ažuriran' : 'Unos vremena je stvoren',
        });
        loadTimeEntries();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri spremanju unosa vremena',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri spremanju unosa vremena',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: new Date(entry.date).toISOString().split('T')[0],
      duration: entry.duration.toString(),
      description: entry.description,
      hourlyRate: entry.hourlyRate.toString(),
      isBillable: entry.isBillable,
      caseId: entry.case?.id || 'none',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj unos vremena?')) {
      return;
    }

    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Unos vremena je obrisan',
        });
        loadTimeEntries();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri brisanju unosa vremena',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri brisanju unosa vremena',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      duration: '',
      description: '',
      hourlyRate: '',
      isBillable: true,
      caseId: 'none',
    });
    setEditingEntry(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Filter time entries based on current filters
  const filteredTimeEntries = timeEntries.filter(entry => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        entry.description.toLowerCase().includes(searchLower) ||
        entry.user.firstName?.toLowerCase().includes(searchLower) ||
        entry.user.lastName?.toLowerCase().includes(searchLower) ||
        entry.user.email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Case filter
    if (filters.case.length > 0) {
      const hasMatchingCase = entry.case && filters.case.includes(entry.case.id);
      if (!hasMatchingCase) return false;
    }

    // User filter
    if (filters.user.length > 0 && !filters.user.includes(entry.user.id)) {
      return false;
    }

    // Billable filter
    if (filters.billable !== null && entry.isBillable !== filters.billable) {
      return false;
    }

    // Status filter (based on billing status)
    if (filters.status.length > 0) {
      let entryStatus = 'DRAFT';
      if (entry.isBilled) {
        entryStatus = 'BILLED';
      } else if (entry.isBillable) {
        entryStatus = 'APPROVED';
      } else {
        entryStatus = 'SUBMITTED';
      }
      if (!filters.status.includes(entryStatus)) return false;
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const entryDate = new Date(entry.date);
      if (filters.dateRange.from && entryDate < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to && entryDate > filters.dateRange.to) {
        return false;
      }
    }

    // Duration range filter (convert minutes to hours)
    const durationHours = entry.duration / 60;
    if (filters.durationRange.min !== undefined && durationHours < filters.durationRange.min) {
      return false;
    }
    if (filters.durationRange.max !== undefined && durationHours > filters.durationRange.max) {
      return false;
    }

    return true;
  });

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalAmount = timeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const billableAmount = timeEntries
    .filter(entry => entry.isBillable)
    .reduce((sum, entry) => sum + entry.amount, 0);

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
          <h1 className="text-2xl md:text-3xl font-bold">Pratnja vremena</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Upravljajte unosima vremena i satnicom
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.TIME_ENTRIES_CREATE}>
          <Button 
            onClick={openCreateDialog}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novi unos vremena
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupno sati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalHours)}</div>
            <p className="text-xs text-muted-foreground">Svi unosi vremena</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupni iznos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Svi unosi vremena</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Naplativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billableAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Naplativo klijentima</p>
          </CardContent>
        </Card>
      </div>

      {/* Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timer
          </CardTitle>
          <CardDescription>
            Pokrenite timer za praćenje vremena rada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-mono font-bold">
                {formatTime(timer.elapsedTime)}
              </div>
              <div className="flex gap-2">
                {!timer.isRunning ? (
                  <Button onClick={startTimer} size="lg" className="min-h-[44px]">
                    <Play className="h-4 w-4 mr-2" />
                    Pokreni
                  </Button>
                ) : (
                  <Button onClick={stopTimer} variant="destructive" size="lg" className="min-h-[44px]">
                    <Pause className="h-4 w-4 mr-2" />
                    Zaustavi
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timer-case">Predmet</Label>
                <Select 
                  value={timer.caseId} 
                  onValueChange={(value) => setTimer(prev => ({ ...prev, caseId: value }))}
                  disabled={timer.isRunning}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite predmet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bez predmeta</SelectItem>
                    {cases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.caseNumber} - {getClientName(caseItem.client)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="timer-description">Opis rada</Label>
                <Input
                  id="timer-description"
                  value={timer.description}
                  onChange={(e) => setTimer(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Opisite što radite..."
                  disabled={timer.isRunning}
                />
              </div>
            </div>
            
            {timer.elapsedTime > 0 && !timer.isRunning && (
              <div className="flex justify-end">
                <Button onClick={saveTimerEntry} className="min-h-[44px]">
                  <Square className="h-4 w-4 mr-2" />
                  Spremi unos
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Pretraži i filtriraj unose vremena</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEntrySearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            cases={cases}
            users={users}
          />
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Unosi vremena</CardTitle>
          <CardDescription>Pregled svih unosa vremena</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTimeEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {timeEntries.length === 0 ? 'Nema unosa vremena' : 'Nema unosa vremena koji odgovaraju filtirima'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-3">
                {filteredTimeEntries.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {entry.description}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.user.firstName} {entry.user.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={entry.isBillable ? 'default' : 'secondary'} className="text-xs">
                            {entry.isBillable ? 'Naplativo' : 'Nenaplativo'}
                          </Badge>
                          {entry.isBilled && (
                            <Badge variant="outline" className="text-xs">
                              Naplaćeno
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Datum: {formatDate(entry.date)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Trajanje: {formatDuration(entry.duration)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Satnica: {entry.hourlyRate.toFixed(2)} EUR/h
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Iznos: {entry.amount.toFixed(2)} EUR
                          </div>
                          {entry.case && (
                            <div className="text-sm text-muted-foreground">
                              Predmet: {entry.case.caseNumber} - {getClientName(entry.case.client)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <PermissionGuard permission={PERMISSIONS.TIME_ENTRIES_UPDATE}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                            disabled={entry.isBilled}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission={PERMISSIONS.TIME_ENTRIES_DELETE}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
                            disabled={entry.isBilled}
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
                      <TableHead>Datum</TableHead>
                      <TableHead>Opis</TableHead>
                      <TableHead>Predmet</TableHead>
                      <TableHead>Trajanje</TableHead>
                      <TableHead>Satnica</TableHead>
                      <TableHead>Iznos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTimeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{entry.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.user.firstName} {entry.user.lastName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.case ? (
                            <div>
                              <div className="font-medium">{entry.case.caseNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {getClientName(entry.case.client)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Bez predmeta</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDuration(entry.duration)}</TableCell>
                        <TableCell>{entry.hourlyRate.toFixed(2)} EUR/h</TableCell>
                        <TableCell>{entry.amount.toFixed(2)} EUR</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={entry.isBillable ? 'default' : 'secondary'}>
                              {entry.isBillable ? 'Naplativo' : 'Nenaplativo'}
                            </Badge>
                            {entry.isBilled && (
                              <Badge variant="outline">
                                Naplaćeno
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PermissionGuard permission={PERMISSIONS.TIME_ENTRIES_UPDATE}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(entry)}
                                disabled={entry.isBilled}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.TIME_ENTRIES_DELETE}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry.id)}
                                disabled={entry.isBilled}
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

      {/* Create/Edit Dialog */}
      <PermissionGuard permission={PERMISSIONS.TIME_ENTRIES_CREATE}>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Uredi unos vremena' : 'Novi unos vremena'}
              </DialogTitle>
              <DialogDescription>
                {editingEntry ? 'Ažurirajte podatke o unosu vremena' : 'Dodajte novi unos vremena'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="caseId">Predmet</Label>
                  <Select value={formData.caseId} onValueChange={(value) => setFormData({ ...formData, caseId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite predmet (opcionalno)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Bez predmeta</SelectItem>
                      {cases.map((caseItem) => (
                        <SelectItem key={caseItem.id} value={caseItem.id}>
                          {caseItem.caseNumber} - {getClientName(caseItem.client)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Opis rada</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opisite što ste radili..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Trajanje (minute)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="60"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Satnica (EUR/h)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="100.00"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">
                  {editingEntry ? 'Ažuriraj' : 'Stvori'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PermissionGuard>
    </div>
  );
}
