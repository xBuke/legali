'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Users, Building2, Mail, Phone, Pencil, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { ClientSearchFilters, ClientFilters } from '@/components/clients/client-search-filters'
import { ClientViewSelector, ClientViewMode } from '@/components/clients/client-view-selector'
import { ClientCard } from '@/components/clients/client-card'

type Client = {
  id: string
  clientType: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  status: string
  createdAt: string
  _count?: {
    cases: number
    documents: number
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewMode, setViewMode] = useState<ClientViewMode>('table')
  const [filters, setFilters] = useState<ClientFilters>({
    search: '',
    clientType: [],
    status: [],
    dateRange: { from: null, to: null },
  })
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    clientType: 'INDIVIDUAL',
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Croatia',
    personalId: '',
    taxId: '',
    notes: '',
    status: 'ACTIVE',
  })

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        // Extract clients array from response object
        setClients(data.clients || [])
      } else {
        console.error('Failed to fetch clients:', response.status)
        setClients([])
        toast({
          title: 'Greška',
          description: 'Nije moguće dohvatiti klijente',
          variant: 'destructive',
        })
      }
    } catch {
      console.error('Error fetching clients:')
      setClients([])
      toast({
        title: 'Greška',
        description: 'Nije moguće dohvatiti klijente',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: editingClient
            ? 'Klijent uspješno ažuriran'
            : 'Klijent uspješno kreiran',
        })
        setDialogOpen(false)
        resetForm()
        fetchClients()
      } else {
        throw new Error()
      }
    } catch {
      toast({
        title: 'Greška',
        description: 'Nije moguće spremiti klijenta',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Jeste li sigurni da želite obrisati ovog klijenta?')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Klijent uspješno obrisan',
        })
        fetchClients()
      } else {
        throw new Error()
      }
    } catch {
      toast({
        title: 'Greška',
        description: 'Nije moguće obrisati klijenta',
        variant: 'destructive',
      })
    }
  }

  function openEditDialog(client: Client) {
    setEditingClient(client)
    setFormData({
      clientType: client.clientType,
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      companyName: client.companyName || '',
      email: client.email || '',
      phone: client.phone || '',
      mobile: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Croatia',
      personalId: '',
      taxId: '',
      notes: '',
      status: client.status,
    })
    setDialogOpen(true)
  }

  function resetForm() {
    setEditingClient(null)
    setFormData({
      clientType: 'INDIVIDUAL',
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      mobile: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Croatia',
      personalId: '',
      taxId: '',
      notes: '',
      status: 'ACTIVE',
    })
  }

  function getClientName(client: Client) {
    if (client.clientType === 'COMPANY') {
      return client.companyName || 'Bez naziva'
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Bez imena'
  }

  // Filter clients based on current filters
  const filteredClients = clients.filter(client => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        getClientName(client).toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.companyName?.toLowerCase().includes(searchLower) ||
        client.firstName?.toLowerCase().includes(searchLower) ||
        client.lastName?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Client type filter
    if (filters.clientType.length > 0 && !filters.clientType.includes(client.clientType)) {
      return false
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(client.status)) {
      return false
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const clientDate = new Date(client.createdAt)
      if (filters.dateRange.from && clientDate < filters.dateRange.from) {
        return false
      }
      if (filters.dateRange.to && clientDate > filters.dateRange.to) {
        return false
      }
    }

    return true
  })

  const statusColors = {
    ACTIVE: 'bg-green-500/10 text-green-500',
    INACTIVE: 'bg-gray-500/10 text-gray-500',
    POTENTIAL: 'bg-blue-500/10 text-blue-500',
  }

  if (loading && clients.length === 0) {
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
          <h1 className="text-2xl md:text-3xl font-bold">Klijenti</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Upravljajte svojim klijentima
          </p>
        </div>
        <Button 
          onClick={() => { resetForm(); setDialogOpen(true) }}
          className="w-full sm:w-auto min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj klijenta
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Pretraži i filtriraj klijente</CardTitle>
              <CardDescription>
                Pronađite klijente prema različitim kriterijima
              </CardDescription>
            </div>
            <ClientViewSelector 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <ClientSearchFilters 
            filters={filters}
            onFiltersChange={setFilters}
            clients={clients}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Klijenti ({filteredClients.length})
            {filteredClients.length !== clients.length && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                od {clients.length} ukupno
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Pregled vaših klijenata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Još nema klijenata</p>
              <Button
                onClick={() => { resetForm(); setDialogOpen(true) }}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj prvog klijenta
              </Button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nema klijenata koji odgovaraju filtirima</p>
            </div>
          ) : (
            <>
              {/* Cards View */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      viewMode="detailed"
                      onEdit={() => openEditDialog(client)}
                      onDelete={() => handleDelete(client.id)}
                    />
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {filteredClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      viewMode="compact"
                      onEdit={() => openEditDialog(client)}
                      onDelete={() => handleDelete(client.id)}
                    />
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Naziv / Ime</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Kontakt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Predmeti</TableHead>
                        <TableHead className="text-right">Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {getClientName(client)}
                          </TableCell>
                          <TableCell>
                            {client.clientType === 'COMPANY' ? (
                              <Badge variant="outline">
                                <Building2 className="h-3 w-3 mr-1" />
                                Tvrtka
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                Pojedinac
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {client.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {client.email}
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {client.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                              {client.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {client._count?.cases || 0} predmeta
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/dashboard/clients/${client.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(client)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(client.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Mobile fallback for table view */}
              {viewMode === 'table' && (
                <div className="block md:hidden space-y-3">
                  {filteredClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      viewMode="detailed"
                      onEdit={() => openEditDialog(client)}
                      onDelete={() => handleDelete(client.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Uredi klijenta' : 'Dodaj novog klijenta'}
            </DialogTitle>
            <DialogDescription>
              Unesite podatke o klijentu
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tip klijenta</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.clientType === 'INDIVIDUAL' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, clientType: 'INDIVIDUAL' })}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Pojedinac
                </Button>
                <Button
                  type="button"
                  variant={formData.clientType === 'COMPANY' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, clientType: 'COMPANY' })}
                  className="flex-1"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Tvrtka
                </Button>
              </div>
            </div>

            {formData.clientType === 'INDIVIDUAL' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ime *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Prezime *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="companyName">Naziv tvrtke *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresa</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Grad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Poštanski broj</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
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
                {loading ? 'Spremanje...' : editingClient ? 'Spremi' : 'Dodaj klijenta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
