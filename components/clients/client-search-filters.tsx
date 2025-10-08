'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export interface ClientFilters {
  search: string
  clientType: string[]
  status: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
}

interface ClientSearchFiltersProps {
  filters: ClientFilters
  onFiltersChange: (filters: ClientFilters) => void
  clients: Array<{
    id: string
    clientType: string
    status: string
    firstName?: string
    lastName?: string
    companyName?: string
    email?: string
  }>
}

export function ClientSearchFilters({ filters, onFiltersChange }: ClientSearchFiltersProps) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleClientTypeChange = (value: string) => {
    const newTypes = filters.clientType.includes(value)
      ? filters.clientType.filter(type => type !== value)
      : [...filters.clientType, value]
    onFiltersChange({ ...filters, clientType: newTypes })
  }

  const handleStatusChange = (value: string) => {
    const newStatuses = filters.status.includes(value)
      ? filters.status.filter(status => status !== value)
      : [...filters.status, value]
    onFiltersChange({ ...filters, status: newStatuses })
  }

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    const date = value ? new Date(value) : null
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: date }
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      clientType: [],
      status: [],
      dateRange: { from: null, to: null }
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.clientType.length > 0) count++
    if (filters.status.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži klijente po imenu, emailu, tvrtki..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtri
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filtri klijenata</DialogTitle>
              <DialogDescription>
                Filtriranje klijenata prema različitim kriterijima
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Client Type Filter */}
              <div className="space-y-2">
                <Label>Tip klijenta</Label>
                <div className="space-y-2">
                  {[
                    { value: 'INDIVIDUAL', label: 'Pojedinac' },
                    { value: 'COMPANY', label: 'Tvrtka' }
                  ].map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`type-${type.value}`}
                        checked={filters.clientType.includes(type.value)}
                        onChange={() => handleClientTypeChange(type.value)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`type-${type.value}`} className="text-sm">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="space-y-2">
                  {[
                    { value: 'ACTIVE', label: 'Aktivan' },
                    { value: 'INACTIVE', label: 'Neaktivan' },
                    { value: 'POTENTIAL', label: 'Potencijalni' }
                  ].map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`status-${status.value}`}
                        checked={filters.status.includes(status.value)}
                        onChange={() => handleStatusChange(status.value)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`status-${status.value}`} className="text-sm">
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Datum registracije</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">Od</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateRange.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleDateRangeChange('from', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo" className="text-xs text-muted-foreground">Do</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateRange.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : ''}
                      onChange={(e) => handleDateRangeChange('to', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Obriši sve filtre
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Pretraga: {filters.search}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.clientType.map((type) => (
            <Badge key={type} variant="secondary" className="flex items-center gap-1">
              Tip: {type === 'INDIVIDUAL' ? 'Pojedinac' : 'Tvrtka'}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleClientTypeChange(type)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              Status: {status}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleStatusChange(status)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Datum: {filters.dateRange.from && format(filters.dateRange.from, 'dd.MM.yyyy')} - {filters.dateRange.to && format(filters.dateRange.to, 'dd.MM.yyyy')}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onFiltersChange({ ...filters, dateRange: { from: null, to: null } })}
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
