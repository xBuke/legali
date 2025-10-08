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
import { Search, Filter, X, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'

export interface DocumentFilters {
  search: string
  category: string[]
  fileType: string[]
  case: string[]
  client: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
  fileSize: {
    min: number
    max: number
  }
}

interface DocumentSearchFiltersProps {
  filters: DocumentFilters
  onFiltersChange: (filters: DocumentFilters) => void
  documents: Array<{
    id: string
    fileName: string
    originalName: string
    mimeType: string
    category?: string
    case?: { id: string; caseNumber: string }
    client?: { id: string; firstName?: string; lastName?: string; companyName?: string; clientType: string }
  }>
}

export function DocumentSearchFilters({ filters, onFiltersChange, documents }: DocumentSearchFiltersProps) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleCategoryChange = (value: string) => {
    const newCategories = filters.category.includes(value)
      ? filters.category.filter(cat => cat !== value)
      : [...filters.category, value]
    onFiltersChange({ ...filters, category: newCategories })
  }

  const handleFileTypeChange = (value: string) => {
    const newFileTypes = filters.fileType.includes(value)
      ? filters.fileType.filter(type => type !== value)
      : [...filters.fileType, value]
    onFiltersChange({ ...filters, fileType: newFileTypes })
  }

  const handleCaseChange = (value: string) => {
    const newCases = filters.case.includes(value)
      ? filters.case.filter(caseId => caseId !== value)
      : [...filters.case, value]
    onFiltersChange({ ...filters, case: newCases })
  }

  const handleClientChange = (value: string) => {
    const newClients = filters.client.includes(value)
      ? filters.client.filter(clientId => clientId !== value)
      : [...filters.client, value]
    onFiltersChange({ ...filters, client: newClients })
  }

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    const date = value ? new Date(value) : null
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: date }
    })
  }

  const handleFileSizeChange = (field: 'min' | 'max', value: string) => {
    const size = value ? parseInt(value) : 0
    onFiltersChange({
      ...filters,
      fileSize: { ...filters.fileSize, [field]: size }
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      category: [],
      fileType: [],
      case: [],
      client: [],
      dateRange: { from: null, to: null },
      fileSize: { min: 0, max: 0 }
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.category.length > 0) count++
    if (filters.fileType.length > 0) count++
    if (filters.case.length > 0) count++
    if (filters.client.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.fileSize.min > 0 || filters.fileSize.max > 0) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  // Get unique categories and file types from documents
  const documentsArray = Array.isArray(documents) ? documents : []
  const categories = Array.from(new Set(documentsArray.map(doc => doc.category).filter((cat): cat is string => Boolean(cat))))
  const fileTypes = Array.from(new Set(documentsArray.map(doc => doc.mimeType.split('/')[1] || doc.mimeType.split('/')[0])))

  const getClientName = (client: Record<string, unknown>) => {
    if (!client) return ''
    if (client.clientType === 'COMPANY') {
      return client.companyName || 'Bez naziva'
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Bez imena'
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži dokumente po nazivu, kategoriji, predmetu..."
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
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filtri dokumenata</DialogTitle>
              <DialogDescription>
                Filtriranje dokumenata prema različitim kriterijima
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Kategorija</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        checked={filters.category.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`category-${category}`} className="text-sm">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Type Filter */}
              <div className="space-y-2">
                <Label>Tip datoteke</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {fileTypes.map((fileType) => (
                    <div key={fileType} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`fileType-${fileType}`}
                        checked={filters.fileType.includes(fileType)}
                        onChange={() => handleFileTypeChange(fileType)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`fileType-${fileType}`} className="text-sm">
                        {fileType.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Filter */}
              <div className="space-y-2">
                <Label>Predmet</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {documentsArray
                    .filter(doc => doc.case)
                    .map((doc) => (
                      <div key={doc.case!.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`case-${doc.case!.id}`}
                          checked={filters.case.includes(doc.case!.id)}
                          onChange={() => handleCaseChange(doc.case!.id)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`case-${doc.case!.id}`} className="text-sm">
                          {doc.case!.caseNumber}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Client Filter */}
              <div className="space-y-2">
                <Label>Klijent</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {documentsArray
                    .filter(doc => doc.client)
                    .map((doc) => (
                      <div key={doc.client!.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`client-${doc.client!.id}`}
                          checked={filters.client.includes(doc.client!.id)}
                          onChange={() => handleClientChange(doc.client!.id)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`client-${doc.client!.id}`} className="text-sm">
                          {getClientName(doc.client)}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Datum kreiranja</Label>
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

              {/* File Size Filter */}
              <div className="space-y-2">
                <Label>Veličina datoteke (MB)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="sizeMin" className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      id="sizeMin"
                      type="number"
                      min="0"
                      value={filters.fileSize.min || ''}
                      onChange={(e) => handleFileSizeChange('min', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sizeMax" className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      id="sizeMax"
                      type="number"
                      min="0"
                      value={filters.fileSize.max || ''}
                      onChange={(e) => handleFileSizeChange('max', e.target.value)}
                      placeholder="∞"
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
          
          {filters.category.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center gap-1">
              Kategorija: {category}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleCategoryChange(category)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {filters.fileType.map((fileType) => (
            <Badge key={fileType} variant="secondary" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {fileType.toUpperCase()}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleFileTypeChange(fileType)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {filters.case.map((caseId) => {
            const caseData = documentsArray.find(doc => doc.case?.id === caseId)?.case
            return caseData ? (
              <Badge key={caseId} variant="secondary" className="flex items-center gap-1">
                Predmet: {caseData.caseNumber}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleCaseChange(caseId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null
          })}
          
          {filters.client.map((clientId) => {
            const clientData = documentsArray.find(doc => doc.client?.id === clientId)?.client
            return clientData ? (
              <Badge key={clientId} variant="secondary" className="flex items-center gap-1">
                Klijent: {getClientName(clientData)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleClientChange(clientId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null
          })}
          
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
          
          {(filters.fileSize.min > 0 || filters.fileSize.max > 0) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Veličina: {filters.fileSize.min > 0 ? `${filters.fileSize.min}MB` : '0MB'} - {filters.fileSize.max > 0 ? `${filters.fileSize.max}MB` : '∞'}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onFiltersChange({ ...filters, fileSize: { min: 0, max: 0 } })}
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
