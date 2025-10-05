'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export interface CaseFilters {
  search: string
  status: string[]
  priority: string[]
  caseType: string[]
  client: string[]
  assignedTo: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
}

interface CaseSearchFiltersProps {
  filters: CaseFilters
  onFiltersChange: (filters: CaseFilters) => void
  clients: Array<{
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    clientType: string
  }>
  users: Array<{
    id: string
    firstName?: string
    lastName?: string
  }>
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

const statusOptions = [
  { value: 'OPEN', label: 'Otvoren' },
  { value: 'IN_PROGRESS', label: 'U obradi' },
  { value: 'ON_HOLD', label: 'Na čekanju' },
  { value: 'CLOSED_WON', label: 'Zatvoren - Dobijen' },
  { value: 'CLOSED_LOST', label: 'Zatvoren - Izgubljen' },
  { value: 'CLOSED_SETTLED', label: 'Zatvoren - Nagodba' },
  { value: 'ARCHIVED', label: 'Arhiviran' },
]

const priorityOptions = [
  { value: 'LOW', label: 'Nizak' },
  { value: 'MEDIUM', label: 'Srednji' },
  { value: 'HIGH', label: 'Visok' },
  { value: 'URGENT', label: 'Hitan' },
]

export function CaseSearchFilters({
  filters,
  onFiltersChange,
  clients,
  users,
}: CaseSearchFiltersProps) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

  const updateFilters = (updates: Partial<CaseFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      priority: [],
      caseType: [],
      client: [],
      assignedTo: [],
      dateRange: { from: null, to: null },
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.caseType.length > 0) count++
    if (filters.client.length > 0) count++
    if (filters.assignedTo.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    return count
  }

  const removeFilter = (type: keyof CaseFilters, value: string) => {
    if (type === 'status' || type === 'priority' || type === 'caseType' || type === 'client' || type === 'assignedTo') {
      updateFilters({
        [type]: filters[type].filter((item: string) => item !== value),
      })
    }
  }

  const removeDateFilter = () => {
    updateFilters({
      dateRange: { from: null, to: null },
    })
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži predmete po broju, nazivu, klijentu..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtri
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Napredni filtri</DialogTitle>
              <DialogDescription>
                Filtriranje predmeta prema različitim kriterijima
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.status.includes(option.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newStatus = filters.status.includes(option.value)
                          ? filters.status.filter((s) => s !== option.value)
                          : [...filters.status, option.value]
                        updateFilters({ status: newStatus })
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label>Prioritet</Label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.priority.includes(option.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newPriority = filters.priority.includes(option.value)
                          ? filters.priority.filter((p) => p !== option.value)
                          : [...filters.priority, option.value]
                        updateFilters({ priority: newPriority })
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Case Type Filter */}
              <div className="space-y-2">
                <Label>Tip predmeta</Label>
                <div className="flex flex-wrap gap-2">
                  {caseTypes.map((type) => (
                    <Button
                      key={type}
                      variant={filters.caseType.includes(type) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newCaseType = filters.caseType.includes(type)
                          ? filters.caseType.filter((t) => t !== type)
                          : [...filters.caseType, type]
                        updateFilters({ caseType: newCaseType })
                      }}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Client Filter */}
              <div className="space-y-2">
                <Label>Klijent</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !filters.client.includes(value)) {
                      updateFilters({ client: [...filters.client, value] })
                    }
                  }}
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

              {/* Assigned To Filter */}
              <div className="space-y-2">
                <Label>Dodijeljen</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !filters.assignedTo.includes(value)) {
                      updateFilters({ assignedTo: [...filters.assignedTo, value] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite korisnika" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {`${user.firstName} ${user.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Datum kreiranja</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                      Od
                    </Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateRange.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null
                        updateFilters({
                          dateRange: { ...filters.dateRange, from: date },
                        })
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                      Do
                    </Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateRange.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null
                        updateFilters({
                          dateRange: { ...filters.dateRange, to: date },
                        })
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Obriši sve filtre
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {statusOptions.find((s) => s.value === status)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter('status', status)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.priority.map((priority) => (
            <Badge key={priority} variant="secondary" className="gap-1">
              {priorityOptions.find((p) => p.value === priority)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter('priority', priority)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.caseType.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter('caseType', type)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.client.map((clientId) => {
            const client = clients.find((c) => c.id === clientId)
            return (
              <Badge key={clientId} variant="secondary" className="gap-1">
                {client?.clientType === 'COMPANY'
                  ? client.companyName
                  : `${client?.firstName} ${client?.lastName}`}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeFilter('client', clientId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
          {filters.assignedTo.map((userId) => {
            const user = users.find((u) => u.id === userId)
            return (
              <Badge key={userId} variant="secondary" className="gap-1">
                {`${user?.firstName} ${user?.lastName}`}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeFilter('assignedTo', userId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {filters.dateRange.from && format(filters.dateRange.from, 'dd.MM.yyyy')}
              {filters.dateRange.from && filters.dateRange.to && ' - '}
              {filters.dateRange.to && format(filters.dateRange.to, 'dd.MM.yyyy')}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={removeDateFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
