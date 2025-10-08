'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Filter, 
  Save, 
  Bookmark, 
  Star,
  X,
  SortAsc,
  SortDesc
} from 'lucide-react'

interface SavedSearch {
  id: string
  name: string
  query: string
  filters: CaseFilters
  sortBy: string
  sortOrder: 'asc' | 'desc'
  isFavorite: boolean
  createdAt: Date
  lastUsed?: Date
}

interface CaseFilters {
  search: string
  status: string[]
  priority: string[]
  caseType: string[]
  client: string[]
  assignedTo: string[]
  dateRange: {
    from: string
    to: string
  }
  tags: string[]
}

interface AdvancedCaseSearchProps {
  onSearch: (filters: CaseFilters, sortBy: string, sortOrder: 'asc' | 'desc') => void
  onSaveSearch?: (search: SavedSearch) => void
  initialFilters?: CaseFilters
}

const defaultFilters: CaseFilters = {
  search: '',
  status: [],
  priority: [],
  caseType: [],
  client: [],
  assignedTo: [],
  dateRange: { from: '', to: '' },
  tags: []
}

const sortOptions = [
  { value: 'caseNumber', label: 'Broj predmeta' },
  { value: 'title', label: 'Naziv' },
  { value: 'createdAt', label: 'Datum kreiranja' },
  { value: 'nextHearing', label: 'Sljedeće ročište' },
  { value: 'priority', label: 'Prioritet' },
  { value: 'status', label: 'Status' }
]

const statusOptions = [
  'Otvoren', 'U tijeku', 'Na čekanju', 'Zatvoren - Dobijen', 
  'Zatvoren - Izgubljen', 'Zatvoren - Nagodba', 'Arhiviran'
]

const priorityOptions = ['Nizak', 'Srednji', 'Visok', 'Hitan']

const caseTypeOptions = [
  'Građansko pravo', 'Kazneno pravo', 'Radno pravo', 'Obiteljsko pravo',
  'Trgovačko pravo', 'Upravno pravo', 'Nasljednopravni predmet', 
  'Nekretnine', 'Ugovori', 'Naknada štete', 'Ostalo'
]

export function AdvancedCaseSearch({ 
  onSearch, 
  onSaveSearch, 
  initialFilters = defaultFilters 
}: AdvancedCaseSearchProps) {
  const [filters, setFilters] = useState<CaseFilters>(initialFilters)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  useEffect(() => {
    // Load saved searches from localStorage
    const saved = localStorage.getItem('case-saved-searches')
    if (saved) {
      setSavedSearches(JSON.parse(saved))
    }
  }, [])

  const handleFilterChange = (key: keyof CaseFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleArrayFilterChange = (key: keyof CaseFilters, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: checked 
        ? [...(prev[key] as string[]), value]
        : (prev[key] as string[]).filter(item => item !== value)
    }))
  }

  const handleSearch = () => {
    onSearch(filters, sortBy, sortOrder)
  }

  const handleSaveSearch = () => {
    if (!searchName.trim()) return

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      query: filters.search,
      filters,
      sortBy,
      sortOrder,
      isFavorite: false,
      createdAt: new Date(),
      lastUsed: new Date()
    }

    const updatedSearches = [...savedSearches, newSearch]
    setSavedSearches(updatedSearches)
    localStorage.setItem('case-saved-searches', JSON.stringify(updatedSearches))
    onSaveSearch?.(newSearch)
    setIsSaveDialogOpen(false)
    setSearchName('')
  }

  const handleLoadSearch = (search: SavedSearch) => {
    setFilters(search.filters)
    setSortBy(search.sortBy)
    setSortOrder(search.sortOrder)
    
    // Update last used
    const updatedSearches = savedSearches.map(s => 
      s.id === search.id ? { ...s, lastUsed: new Date() } : s
    )
    setSavedSearches(updatedSearches)
    localStorage.setItem('case-saved-searches', JSON.stringify(updatedSearches))
  }

  const handleDeleteSearch = (searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId)
    setSavedSearches(updatedSearches)
    localStorage.setItem('case-saved-searches', JSON.stringify(updatedSearches))
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.caseType.length > 0) count++
    if (filters.client.length > 0) count++
    if (filters.assignedTo.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.tags.length > 0) count++
    return count
  }

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži predmete po broju, nazivu, klijentu..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtri
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Pretraži
        </Button>
      </div>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Pretraži: {filters.search}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('search', '')}
              />
            </Badge>
          )}
          {filters.status.map(status => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              Status: {status}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleArrayFilterChange('status', status, false)}
              />
            </Badge>
          ))}
          {filters.priority.map(priority => (
            <Badge key={priority} variant="secondary" className="flex items-center gap-1">
              Prioritet: {priority}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleArrayFilterChange('priority', priority, false)}
              />
            </Badge>
          ))}
          {filters.caseType.map(type => (
            <Badge key={type} variant="secondary" className="flex items-center gap-1">
              Tip: {type}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleArrayFilterChange('caseType', type, false)}
              />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Obriši sve
          </Button>
        </div>
      )}

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Napredni filtri</span>
              <div className="flex gap-2">
                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Spremi pretragu
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Spremi pretragu</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="search-name">Naziv pretrage</Label>
                        <Input
                          id="search-name"
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                          placeholder="npr. Aktivni građanski sporovi"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                          Odustani
                        </Button>
                        <Button onClick={handleSaveSearch}>
                          Spremi
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Obriši sve
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Filter */}
            <div>
              <Label>Status</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {statusOptions.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status.includes(status)}
                      onCheckedChange={(checked) => 
                        handleArrayFilterChange('status', status, checked as boolean)
                      }
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <Label>Prioritet</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {priorityOptions.map(priority => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={filters.priority.includes(priority)}
                      onCheckedChange={(checked) => 
                        handleArrayFilterChange('priority', priority, checked as boolean)
                      }
                    />
                    <Label htmlFor={`priority-${priority}`} className="text-sm">
                      {priority}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Case Type Filter */}
            <div>
              <Label>Tip predmeta</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {caseTypeOptions.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.caseType.includes(type)}
                      onCheckedChange={(checked) => 
                        handleArrayFilterChange('caseType', type, checked as boolean)
                      }
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from">Datum od</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateRange.from}
                  onChange={(e) => handleFilterChange('dateRange', { 
                    ...filters.dateRange, 
                    from: e.target.value 
                  })}
                />
              </div>
              <div>
                <Label htmlFor="date-to">Datum do</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateRange.to}
                  onChange={(e) => handleFilterChange('dateRange', { 
                    ...filters.dateRange, 
                    to: e.target.value 
                  })}
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sort-by">Sortiraj po</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort-order">Redoslijed</Label>
                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center gap-2">
                        <SortAsc className="h-4 w-4" />
                        Uzlazno
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center gap-2">
                        <SortDesc className="h-4 w-4" />
                        Silazno
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Spremljene pretrage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedSearches.map(search => (
                <div key={search.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{search.name}</h3>
                      {search.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {search.query || 'Bez pretrage'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {search.lastUsed 
                        ? `Korišteno: ${new Date(search.lastUsed).toLocaleDateString()}`
                        : `Stvoreno: ${new Date(search.createdAt).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleLoadSearch(search)}
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteSearch(search.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
