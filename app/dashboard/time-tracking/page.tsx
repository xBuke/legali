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
import { Plus, Clock, Play, Pause, Square, Edit, Trash2, Filter } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [timerDescription, setTimerDescription] = useState('');
  const [timerCaseId, setTimerCaseId] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: '',
    description: '',
    hourlyRate: '',
    isBillable: true,
    caseId: '',
  });

  // Load data
  useEffect(() => {
    loadTimeEntries();
    loadCases();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
        setTimerDuration(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  const loadTimeEntries = async () => {
    try {
      const response = await fetch('/api/time-entries');
      if (response.ok) {
        const data = await response.json();
        setTimeEntries(data);
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
        setCases(data);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimerDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setTimerStartTime(new Date());
    setTimerDuration(0);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const stopTimer = async () => {
    if (timerDuration === 0) return;
    
    const minutes = Math.floor(timerDuration / 60);
    if (minutes === 0) {
      toast({
        title: 'Greška',
        description: 'Vrijeme mora biti veće od 0 minuta',
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
          duration: minutes,
          description: timerDescription || 'Timer unos',
          caseId: timerCaseId || null,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Unos vremena je uspješno spremljen',
        });
        loadTimeEntries();
        setTimerDescription('');
        setTimerCaseId('');
        setTimerDuration(0);
        setIsTimerRunning(false);
        setTimerStartTime(null);
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri spremanju unosa vremena',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving timer entry:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri spremanju unosa vremena',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.duration || !formData.description) {
      toast({
        title: 'Greška',
        description: 'Trajanje i opis su obavezni',
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
          duration: parseInt(formData.duration),
          hourlyRate: parseFloat(formData.hourlyRate) || undefined,
          caseId: formData.caseId || null,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: editingEntry ? 'Unos vremena je ažuriran' : 'Unos vremena je stvoren',
        });
        loadTimeEntries();
        setIsDialogOpen(false);
        setEditingEntry(null);
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
      date: entry.date.split('T')[0],
      duration: entry.duration.toString(),
      description: entry.description,
      hourlyRate: entry.hourlyRate.toString(),
      isBillable: entry.isBillable,
      caseId: entry.case?.id || '',
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
      caseId: '',
    });
  };

  const openCreateDialog = () => {
    setEditingEntry(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const getClientName = (client: any) => {
    if (client.companyName) {
      return client.companyName;
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim();
  };

  const totalBillableTime = timeEntries
    .filter(entry => entry.isBillable)
    .reduce((sum, entry) => sum + entry.duration, 0);

  const totalAmount = timeEntries
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Praćenje vremena</h1>
          <p className="text-muted-foreground">
            Upravljajte unosima vremena i generirajte račune
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.TIME_CREATE}>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj unos
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
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
                  <Label htmlFor="duration">Trajanje (minute)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
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
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Satnica (EUR)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="caseId">Predmet</Label>
                  <Select value={formData.caseId} onValueChange={(value) => setFormData({ ...formData, caseId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite predmet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Bez predmeta</SelectItem>
                      {cases.map((case_) => (
                        <SelectItem key={case_.id} value={case_.id}>
                          {case_.caseNumber} - {case_.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isBillable"
                  checked={formData.isBillable}
                  onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isBillable">Naplativo</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">
                  {editingEntry ? 'Ažuriraj' : 'Spremi'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </PermissionGuard>
      </div>

      {/* Timer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Timer
          </CardTitle>
          <CardDescription>
            Pratite vrijeme u stvarnom vremenu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold">
                {formatTimerDuration(timerDuration)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timerDescription">Opis</Label>
              <Input
                id="timerDescription"
                value={timerDescription}
                onChange={(e) => setTimerDescription(e.target.value)}
                placeholder="Opis rada..."
              />
            </div>

            <div>
              <Label htmlFor="timerCase">Predmet</Label>
              <Select value={timerCaseId} onValueChange={setTimerCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite predmet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Bez predmeta</SelectItem>
                  {cases.map((case_) => (
                    <SelectItem key={case_.id} value={case_.id}>
                      {case_.caseNumber} - {case_.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center space-x-2">
              {!isTimerRunning ? (
                <Button onClick={startTimer} className="flex items-center">
                  <Play className="h-4 w-4 mr-2" />
                  Pokreni
                </Button>
              ) : (
                <>
                  <Button onClick={pauseTimer} variant="outline" className="flex items-center">
                    <Pause className="h-4 w-4 mr-2" />
                    Pauza
                  </Button>
                  <Button onClick={stopTimer} variant="destructive" className="flex items-center">
                    <Square className="h-4 w-4 mr-2" />
                    Zaustavi
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupno vremena</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalBillableTime)}</div>
            <p className="text-xs text-muted-foreground">Naplativo vrijeme</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupni iznos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">Naplativo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unosa vremena</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeEntries.length}</div>
            <p className="text-xs text-muted-foreground">Ukupno</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Unosi vremena</CardTitle>
          <CardDescription>
            Pregled svih unosa vremena
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {timeEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString('hr-HR')}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.description}
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
                  <TableCell>{entry.hourlyRate.toFixed(2)} EUR</TableCell>
                  <TableCell>{entry.amount.toFixed(2)} EUR</TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
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
                    <div className="flex space-x-2">
                      <PermissionGuard permission={PERMISSIONS.TIME_UPDATE}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(entry)}
                          disabled={entry.isBilled}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission={PERMISSIONS.TIME_DELETE}>
                        <Button
                          size="sm"
                          variant="outline"
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
          
          {timeEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nema unosa vremena
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
