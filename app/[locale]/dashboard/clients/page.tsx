'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
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
import { 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  Pencil, 
  Trash2, 
  Eye, 
  Search,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations()
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
  }, [])

  async function fetchClients() {
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
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
      toast({
        title: 'Greška',
        description: 'Nije moguće dohvatiti klijente',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

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
    } catch (error) {
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
    } catch (error) {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            {t('navigation.clients')}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your clients and their information
          </p>
        </div>
        <Button 
          onClick={() => { resetForm(); setDialogOpen(true) }}
          className="w-full sm:w-auto"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="card-hover">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
              <CardDescription>
                Find clients using various criteria
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

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clients ({filteredClients.length})
            {filteredClients.length !== clients.length && (
              <Badge variant="secondary" className="ml-2">
                of {clients.length} total
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Overview of your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Get started by adding your first client to the system"
              action={
                <Button
                  onClick={() => { resetForm(); setDialogOpen(true) }}
                  className="mt-4"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Client
                </Button>
              }
            />
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching clients"
              description="Try adjusting your search criteria or filters"
            />
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
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cases</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {client.clientType === 'COMPANY' ? (
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Users className="h-4 w-4 text-muted-foreground" />
                              )}
                              {getClientName(client)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.clientType === 'COMPANY' ? (
                              <Badge variant="outline" className="gap-1">
                                <Building2 className="h-3 w-3" />
                                Company
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" />
                                Individual
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {client.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[200px]">{client.email}</span>
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span className="truncate max-w-[200px]">{client.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge 
                              status={client.status.toLowerCase() as 'active' | 'inactive' | 'pending'} 
                              showDot 
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary">
                                {client._count?.cases || 0} cases
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8"
                              >
                                <Link href={`/dashboard/clients/${client.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(client)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(client.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
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
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
            <DialogDescription>
              Enter client information and details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Client Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={formData.clientType === 'INDIVIDUAL' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, clientType: 'INDIVIDUAL' })}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Individual</span>
                </Button>
                <Button
                  type="button"
                  variant={formData.clientType === 'COMPANY' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, clientType: 'COMPANY' })}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">Company</span>
                </Button>
              </div>
            </div>

            {formData.clientType === 'INDIVIDUAL' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  placeholder="Enter company name"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="10001"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {setDialogOpen(false); resetForm()}}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingClient ? 'Save Changes' : 'Add Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
