'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface TimeEntryFilters {
  search: string;
  case: string[];
  user: string[];
  billable: boolean | null;
  status: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  durationRange: {
    min: number | undefined;
    max: number | undefined;
  };
}

interface TimeEntrySearchFiltersProps {
  filters: TimeEntryFilters;
  onFiltersChange: (filters: TimeEntryFilters) => void;
  cases: Array<{
    id: string;
    caseNumber: string;
    title: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export function TimeEntrySearchFilters({ filters, onFiltersChange, cases, users }: TimeEntrySearchFiltersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<TimeEntryFilters>(filters);

  const statusOptions = [
    { value: 'DRAFT', label: 'Nacrt' },
    { value: 'SUBMITTED', label: 'Poslan' },
    { value: 'APPROVED', label: 'Odobren' },
    { value: 'BILLED', label: 'Naplaćen' },
  ];

  const billableOptions = [
    { value: 'true', label: 'Naplativo' },
    { value: 'false', label: 'Nenaplativo' },
    { value: 'null', label: 'Sve' },
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.case.length > 0) count++;
    if (filters.user.length > 0) count++;
    if (filters.billable !== null) count++;
    if (filters.status.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.durationRange.min !== undefined || filters.durationRange.max !== undefined) count++;
    return count;
  };

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsDialogOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: TimeEntryFilters = {
      search: '',
      case: [],
      user: [],
      billable: null,
      status: [],
      dateRange: { from: undefined, to: undefined },
      durationRange: { min: undefined, max: undefined },
    };
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setIsDialogOpen(false);
  };

  const removeCaseFilter = (caseId: string) => {
    const newFilters = {
      ...filters,
      case: filters.case.filter(c => c !== caseId),
    };
    onFiltersChange(newFilters);
  };

  const removeUserFilter = (userId: string) => {
    const newFilters = {
      ...filters,
      user: filters.user.filter(u => u !== userId),
    };
    onFiltersChange(newFilters);
  };

  const removeStatusFilter = (status: string) => {
    const newFilters = {
      ...filters,
      status: filters.status.filter(s => s !== status),
    };
    onFiltersChange(newFilters);
  };

  const removeDateFilter = () => {
    const newFilters = {
      ...filters,
      dateRange: { from: undefined, to: undefined },
    };
    onFiltersChange(newFilters);
  };

  const removeDurationFilter = () => {
    const newFilters = {
      ...filters,
      durationRange: { min: undefined, max: undefined },
    };
    onFiltersChange(newFilters);
  };

  const removeBillableFilter = () => {
    const newFilters = {
      ...filters,
      billable: null,
    };
    onFiltersChange(newFilters);
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži unose vremena po opisu..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtri
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Filtri unosa vremena</DialogTitle>
              <DialogDescription>
                Filtriranje unosa vremena prema različitim kriterijima
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Case Filter */}
              <div>
                <Label>Predmet</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !tempFilters.case.includes(value)) {
                      setTempFilters({
                        ...tempFilters,
                        case: [...tempFilters.case, value],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite predmet" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map(caseItem => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.caseNumber} - {caseItem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tempFilters.case.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tempFilters.case.map(caseId => {
                      const caseItem = cases.find(c => c.id === caseId);
                      return (
                        <Badge key={caseId} variant="secondary" className="flex items-center gap-1">
                          {caseItem?.caseNumber}
                          <button
                            onClick={() => {
                              setTempFilters({
                                ...tempFilters,
                                case: tempFilters.case.filter(c => c !== caseId),
                              });
                            }}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* User Filter */}
              <div>
                <Label>Korisnik</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !tempFilters.user.includes(value)) {
                      setTempFilters({
                        ...tempFilters,
                        user: [...tempFilters.user, value],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite korisnika" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tempFilters.user.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tempFilters.user.map(userId => {
                      const user = users.find(u => u.id === userId);
                      return (
                        <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                          {user?.name}
                          <button
                            onClick={() => {
                              setTempFilters({
                                ...tempFilters,
                                user: tempFilters.user.filter(u => u !== userId),
                              });
                            }}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Billable Filter */}
              <div>
                <Label>Naplativost</Label>
                <Select
                  value={tempFilters.billable === null ? 'null' : tempFilters.billable.toString()}
                  onValueChange={(value) => {
                    const billableValue = value === 'null' ? null : value === 'true';
                    setTempFilters({
                      ...tempFilters,
                      billable: billableValue,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {billableOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Label>Status</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {statusOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={tempFilters.status.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempFilters({
                              ...tempFilters,
                              status: [...tempFilters.status, option.value],
                            });
                          } else {
                            setTempFilters({
                              ...tempFilters,
                              status: tempFilters.status.filter(s => s !== option.value),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <Label>Datum unosa</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Od</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.dateRange.from ? (
                            format(tempFilters.dateRange.from, 'dd.MM.yyyy', { locale: hr })
                          ) : (
                            'Odaberite datum'
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={tempFilters.dateRange.from}
                          onSelect={(date) => setTempFilters({
                            ...tempFilters,
                            dateRange: { ...tempFilters.dateRange, from: date },
                          })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Do</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.dateRange.to ? (
                            format(tempFilters.dateRange.to, 'dd.MM.yyyy', { locale: hr })
                          ) : (
                            'Odaberite datum'
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={tempFilters.dateRange.to}
                          onSelect={(date) => setTempFilters({
                            ...tempFilters,
                            dateRange: { ...tempFilters.dateRange, to: date },
                          })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Duration Range Filter */}
              <div>
                <Label>Trajanje (sati)</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Minimalno trajanje</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.25"
                      value={tempFilters.durationRange.min || ''}
                      onChange={(e) => setTempFilters({
                        ...tempFilters,
                        durationRange: {
                          ...tempFilters.durationRange,
                          min: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Maksimalno trajanje</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.25"
                      value={tempFilters.durationRange.max || ''}
                      onChange={(e) => setTempFilters({
                        ...tempFilters,
                        durationRange: {
                          ...tempFilters.durationRange,
                          max: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })}
                      placeholder="24.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleClearFilters}>
                  Obriši sve filtre
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Odustani
                  </Button>
                  <Button onClick={handleApplyFilters}>
                    Primijeni filtre
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.case.map(caseId => {
            const caseItem = cases.find(c => c.id === caseId);
            return (
              <Badge key={caseId} variant="secondary" className="flex items-center gap-1">
                Predmet: {caseItem?.caseNumber}
                <button
                  onClick={() => removeCaseFilter(caseId)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {filters.user.map(userId => {
            const user = users.find(u => u.id === userId);
            return (
              <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                Korisnik: {user?.name}
                <button
                  onClick={() => removeUserFilter(userId)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {filters.billable !== null && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Naplativost: {filters.billable ? 'Naplativo' : 'Nenaplativo'}
              <button
                onClick={removeBillableFilter}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status.map(status => {
            const statusOption = statusOptions.find(opt => opt.value === status);
            return (
              <Badge key={status} variant="secondary" className="flex items-center gap-1">
                Status: {statusOption?.label}
                <button
                  onClick={() => removeStatusFilter(status)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Datum: {filters.dateRange.from && format(filters.dateRange.from, 'dd.MM.yyyy', { locale: hr })}
              {filters.dateRange.from && filters.dateRange.to && ' - '}
              {filters.dateRange.to && format(filters.dateRange.to, 'dd.MM.yyyy', { locale: hr })}
              <button
                onClick={removeDateFilter}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.durationRange.min !== undefined || filters.durationRange.max !== undefined) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Trajanje: {filters.durationRange.min !== undefined && `${filters.durationRange.min}h`}
              {filters.durationRange.min !== undefined && filters.durationRange.max !== undefined && ' - '}
              {filters.durationRange.max !== undefined && `${filters.durationRange.max}h`}
              <button
                onClick={removeDurationFilter}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
