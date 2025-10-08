'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Briefcase, Pencil, Trash2, Eye, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { CaseSearchFilters, CaseFilters } from '@/components/cases/case-search-filters'
import { CaseViewSelector, CaseViewMode } from '@/components/cases/case-view-selector'
import { CaseKanbanBoard } from '@/components/cases/case-kanban-board'
import { CaseCard } from '@/components/cases/case-card'
import { VirtualizedCasesTable } from '@/components/cases/virtualized-cases-table'
import { CaseAnalytics } from '@/components/cases/case-analytics'

type Case = {
  id: string
  caseNumber: string
  title: string
  caseType: string
  status: string
  priority: string
  openedAt: string
  nextHearingDate?: string
  client: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    clientType: string
  }
  assignedTo?: {
    id: string
    firstName?: string
    lastName?: string
  }
  _count: {
    documents: number
    timeEntries: number
    tasks: number
  }
}

type Client = {
  id: string
  firstName?: string
  lastName?: string
  companyName?: string
  clientType: string
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<Array<{ id: string; firstName?: string; lastName?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [viewMode, setViewMode] = useState<CaseViewMode>('table')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [filters, setFilters] = useState<CaseFilters>({
    search: '',
    status: [],
    priority: [],
    caseType: [],
    client: [],
    assignedTo: [],
    dateRange: { from: null, to: null },
  })
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    caseType: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    clientId: '',
    courtName: '',
    courtCaseNumber: '',
    judge: '',
    opposingCounsel: '',
    nextHearingDate: '',
  })

  useEffect(() => {
    fetchCases()
    fetchClients()
    fetchUsers()
  }, [])

  async function fetchCases() {
    try {
      const response = await fetch('/api/cases')
      if (response.ok) {
        const data = await response.json()
        setCases(data.cases || [])
      } else {
        console.error('Failed to fetch cases:', response.status)
        setCases([])
        toast({
          title: 'Greška',
          description: 'Nije moguće dohvatiti predmete',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
      setCases([])
      toast({
        title: 'Greška',
        description: 'Nije moguće dohvatiti predmete',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchClients() {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingCase ? `/api/cases/${editingCase.id}` : '/api/cases'
      const method = editingCase ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: editingCase
            ? 'Predmet uspješno ažuriran'
            : 'Predmet uspješno kreiran',
        })
        setDialogOpen(false)
        resetForm()
        fetchCases()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće spremiti predmet',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj predmet?')) {
      return
    }

    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Predmet uspješno obrisan',
        })
        fetchCases()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće obrisati predmet',
        variant: 'destructive',
      })
    }
  }

  async function handleStatusChange(caseId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Status predmeta uspješno ažuriran',
        })
        fetchCases()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće ažurirati status predmeta',
        variant: 'destructive',
      })
    }
  }

  function openEditDialog(caseData: Case) {
    setEditingCase(caseData)
    setFormData({
      title: caseData.title,
      description: '',
      caseType: caseData.caseType,
      status: caseData.status,
      priority: caseData.priority,
      clientId: caseData.client.id,
      courtName: '',
      courtCaseNumber: '',
      judge: '',
      opposingCounsel: '',
      nextHearingDate: caseData.nextHearingDate ? format(new Date(caseData.nextHearingDate), 'yyyy-MM-dd') : '',
    })
    setDialogOpen(true)
  }

  function resetForm() {
    setEditingCase(null)
    setFormData({
      title: '',
      description: '',
      caseType: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      clientId: '',
      courtName: '',
      courtCaseNumber: '',
      judge: '',
      opposingCounsel: '',
      nextHearingDate: '',
    })
  }

  function getClientName(client: Case['client']) {
    if (client.clientType === 'COMPANY') {
      return client.companyName || 'Bez naziva'
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Bez imena'
  }

  // Filter cases based on current filters
  const filteredCases = cases.filter(caseData => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        caseData.caseNumber.toLowerCase().includes(searchLower) ||
        caseData.title.toLowerCase().includes(searchLower) ||
        getClientName(caseData.client).toLowerCase().includes(searchLower) ||
        caseData.caseType.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(caseData.status)) {
      return false
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(caseData.priority)) {
      return false
    }

    // Case type filter
    if (filters.caseType.length > 0 && !filters.caseType.includes(caseData.caseType)) {
      return false
    }

    // Client filter
    if (filters.client.length > 0 && !filters.client.includes(caseData.client.id)) {
      return false
    }

    // Assigned to filter
    if (filters.assignedTo.length > 0 && (!caseData.assignedTo || !filters.assignedTo.includes(caseData.assignedTo.id))) {
      return false
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const caseDate = new Date(caseData.openedAt)
      if (filters.dateRange.from && caseDate < filters.dateRange.from) {
        return false
      }
      if (filters.dateRange.to && caseDate > filters.dateRange.to) {
        return false
      }
    }

    return true
  })

  const statusColors = {
    OPEN: 'bg-blue-500/10 text-blue-500',
    IN_PROGRESS: 'bg-yellow-500/10 text-yellow-500',
    ON_HOLD: 'bg-orange-500/10 text-orange-500',
    CLOSED_WON: 'bg-green-500/10 text-green-500',
    CLOSED_LOST: 'bg-red-500/10 text-red-500',
    CLOSED_SETTLED: 'bg-purple-500/10 text-purple-500',
    ARCHIVED: 'bg-gray-500/10 text-gray-500',
  }

  const priorityColors = {
    LOW: 'bg-gray-500/10 text-gray-500',
    MEDIUM: 'bg-blue-500/10 text-blue-500',
    HIGH: 'bg-orange-500/10 text-orange-500',
    URGENT: 'bg-red-500/10 text-red-500',
  }

  const caseTypes = [
    'Građansko pravo',
    'Kazneno pravo',
    'Radno pravo',
    'Obiteljsko pravo',
    'Trgovačko pravo',
    'Upravno pravo',
    'Nasljednopravni predmet',
    'Nekretnine',
    'Ugovori',
    'Naknada štete',
    'Ostalo',
  ]

  if (loading && cases.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold laptop-heading">Predmeti</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base laptop-text">
            Upravljajte svojim pravnim predmetima
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="min-h-[44px]"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Analitika
          </Button>
          <CaseViewSelector viewMode={viewMode} onViewModeChange={setViewMode} />
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true) }}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Dodaj predmet
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <CaseSearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        clients={clients}
        users={users}
      />

      {/* Case Analytics */}
      {showAnalytics && (
        <CaseAnalytics />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Svi predmeti</CardTitle>
          <CardDescription>
            Pregled svih vaših predmeta ({filteredCases.length} od {cases.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Još nema predmeta</p>
              <Button
                onClick={() => { resetForm(); setDialogOpen(true) }}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj prvi predmet
              </Button>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nema predmeta koji odgovaraju filtru</p>
            </div>
          ) : viewMode === 'kanban' ? (
            <CaseKanbanBoard
              cases={filteredCases}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ) : viewMode === 'cards' ? (
            <div className="space-y-4">
              {filteredCases.map((caseData) => (
                <CaseCard
                  key={caseData.id}
                  case={caseData}
                  viewMode="detailed"
                  onEdit={() => openEditDialog(caseData)}
                  onView={() => window.open(`/dashboard/cases/${caseData.id}`, '_blank')}
                  onDelete={() => handleDelete(caseData.id)}
                />
              ))}
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-3">
                {filteredCases.map((caseData) => (
                  <Card key={caseData.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">
                          {caseData.caseNumber}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {caseData.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {caseData.caseType}
                          </Badge>
                          <Badge className={`text-xs ${statusColors[caseData.status as keyof typeof statusColors]}`}>
                            {caseData.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={`text-xs ${priorityColors[caseData.priority as keyof typeof priorityColors]}`}>
                            {caseData.priority}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Klijent: <Link href={`/dashboard/clients/${caseData.client.id}`} className="text-primary hover:underline">{getClientName(caseData.client)}</Link>
                          </div>
                          {caseData.nextHearingDate && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>Sljedeće ročište: {format(new Date(caseData.nextHearingDate), 'dd.MM.yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Link href={`/dashboard/cases/${caseData.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(caseData)}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(caseData.id)}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                {filteredCases.length > 50 ? (
                  <VirtualizedCasesTable
                    cases={filteredCases}
                    onEdit={openEditDialog as any}
                    onDelete={handleDelete}
                    getClientName={getClientName}
                    getStatusLabel={(status) => status.replace('_', ' ')}
                    getPriorityLabel={(priority) => priority}
                    getStatusColor={(status) => statusColors[status as keyof typeof statusColors]}
                    getPriorityColor={(priority) => priorityColors[priority as keyof typeof priorityColors]}
                  />
                ) : (
                  <Table className="laptop-table table-laptop">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Broj predmeta</TableHead>
                        <TableHead>Naziv</TableHead>
                        <TableHead>Klijent</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioritet</TableHead>
                        <TableHead>Sljedeće ročište</TableHead>
                        <TableHead className="text-right">Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.map((caseData) => (
                        <TableRow key={caseData.id}>
                          <TableCell className="font-medium">
                            {caseData.caseNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{caseData.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {caseData.caseType}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link 
                              href={`/dashboard/clients/${caseData.client.id}`}
                              className="text-primary hover:underline"
                            >
                              {getClientName(caseData.client)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {caseData.caseType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[caseData.status as keyof typeof statusColors]}>
                              {caseData.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColors[caseData.priority as keyof typeof priorityColors]}>
                              {caseData.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {caseData.nextHearingDate ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(caseData.nextHearingDate), 'dd.MM.yyyy')}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/dashboard/cases/${caseData.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(caseData)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(caseData.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto laptop-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingCase ? 'Uredi predmet' : 'Dodaj novi predmet'}
            </DialogTitle>
            <DialogDescription>
              Unesite podatke o predmetu
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Naziv predmeta *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="npr. Radni spor - Pero Perić"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Klijent *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite klijenta" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.clientType === 'COMPANY'
                        ? client.companyName
                        : `${client.firstName} ${client.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseType">Tip predmeta *</Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(value) => setFormData({ ...formData, caseType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite tip" />
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioritet</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Nizak</SelectItem>
                    <SelectItem value="MEDIUM">Srednji</SelectItem>
                    <SelectItem value="HIGH">Visok</SelectItem>
                    <SelectItem value="URGENT">Hitan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Otvoren</SelectItem>
                  <SelectItem value="IN_PROGRESS">U obradi</SelectItem>
                  <SelectItem value="ON_HOLD">Na čekanju</SelectItem>
                  <SelectItem value="CLOSED_WON">Zatvoren - Dobijen</SelectItem>
                  <SelectItem value="CLOSED_LOST">Zatvoren - Izgubljen</SelectItem>
                  <SelectItem value="CLOSED_SETTLED">Zatvoren - Nagodba</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detaljan opis predmeta..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courtName">Naziv suda</Label>
                <Input
                  id="courtName"
                  value={formData.courtName}
                  onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                  placeholder="npr. Općinski sud u Zagrebu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="courtCaseNumber">Broj suda</Label>
                <Input
                  id="courtCaseNumber"
                  value={formData.courtCaseNumber}
                  onChange={(e) => setFormData({ ...formData, courtCaseNumber: e.target.value })}
                  placeholder="npr. P-1234/2024"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="judge">Sudac</Label>
                <Input
                  id="judge"
                  value={formData.judge}
                  onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
                  placeholder="Ime sudca"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextHearingDate">Sljedeće ročište</Label>
                <Input
                  id="nextHearingDate"
                  type="date"
                  value={formData.nextHearingDate}
                  onChange={(e) => setFormData({ ...formData, nextHearingDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opposingCounsel">Protivnički odvjetnik</Label>
              <Input
                id="opposingCounsel"
                value={formData.opposingCounsel}
                onChange={(e) => setFormData({ ...formData, opposingCounsel: e.target.value })}
                placeholder="Ime protivničkog odvjetnika"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {setDialogOpen(false); resetForm()}}
              >
                Odustani
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Spremanje...' : editingCase ? 'Spremi' : 'Dodaj predmet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
