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
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<Case | null>(null)
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
  }, [])

  async function fetchCases() {
    try {
      const response = await fetch('/api/cases')
      if (response.ok) {
        const data = await response.json()
        setCases(data)
      }
    } catch (error) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Predmeti</h1>
          <p className="text-muted-foreground mt-1">
            Upravljajte svojim pravnim predmetima
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj predmet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Svi predmeti</CardTitle>
          <CardDescription>
            Pregled svih vaših predmeta
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
          ) : (
            <Table>
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
                {cases.map((caseData) => (
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
