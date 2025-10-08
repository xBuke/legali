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

interface InvoiceFilters {
  search: string;
  status: string[];
  client: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  amountRange: {
    min: number | undefined;
    max: number | undefined;
  };
}

interface InvoiceSearchFiltersProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  clients: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  }>;
}

export function InvoiceSearchFilters({ filters, onFiltersChange, clients }: InvoiceSearchFiltersProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<InvoiceFilters>(filters);

  const statusOptions = [
    { value: 'DRAFT', label: 'Nacrt' },
    { value: 'SENT', label: 'Poslan' },
    { value: 'PAID', label: 'Plaćen' },
    { value: 'OVERDUE', label: 'Dospio' },
    { value: 'CANCELLED', label: 'Otkazan' },
  ];

  const getClientName = (client: Record<string, unknown>) => {
    if (client.companyName) {
      return client.companyName;
    }
    return `${client.firstName || ''} ${client.lastName || ''}`.trim();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.client.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.amountRange.min !== undefined || filters.amountRange.max !== undefined) count++;
    return count;
  };

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsDialogOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: InvoiceFilters = {
      search: '',
      status: [],
      client: [],
      dateRange: { from: undefined, to: undefined },
      amountRange: { min: undefined, max: undefined },
    };
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setIsDialogOpen(false);
  };

  const removeStatusFilter = (status: string) => {
    const newFilters = {
      ...filters,
      status: filters.status.filter(s => s !== status),
    };
    onFiltersChange(newFilters);
  };

  const removeClientFilter = (clientId: string) => {
    const newFilters = {
      ...filters,
      client: filters.client.filter(c => c !== clientId),
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

  const removeAmountFilter = () => {
    const newFilters = {
      ...filters,
      amountRange: { min: undefined, max: undefined },
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
              placeholder="Pretraži račune po broju, klijentu..."
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
              <DialogTitle>Filtri računa</DialogTitle>
              <DialogDescription>
                Filtriranje računa prema različitim kriterijima
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Status Filter */}
              <div>
                <Label>Status računa</Label>
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

              {/* Client Filter */}
              <div>
                <Label>Klijent</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !tempFilters.client.includes(value)) {
                      setTempFilters({
                        ...tempFilters,
                        client: [...tempFilters.client, value],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite klijenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {getClientName(client)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tempFilters.client.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tempFilters.client.map(clientId => {
                      const client = clients.find(c => c.id === clientId);
                      return (
                        <Badge key={clientId} variant="secondary" className="flex items-center gap-1">
                          {getClientName(client)}
                          <button
                            onClick={() => {
                              setTempFilters({
                                ...tempFilters,
                                client: tempFilters.client.filter(c => c !== clientId),
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

              {/* Date Range Filter */}
              <div>
                <Label>Datum izdavanja</Label>
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

              {/* Amount Range Filter */}
              <div>
                <Label>Iznos računa</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Minimalni iznos (EUR)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tempFilters.amountRange.min || ''}
                      onChange={(e) => setTempFilters({
                        ...tempFilters,
                        amountRange: {
                          ...tempFilters.amountRange,
                          min: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Maksimalni iznos (EUR)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tempFilters.amountRange.max || ''}
                      onChange={(e) => setTempFilters({
                        ...tempFilters,
                        amountRange: {
                          ...tempFilters.amountRange,
                          max: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })}
                      placeholder="999999.99"
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
          {filters.client.map(clientId => {
            const client = clients.find(c => c.id === clientId);
            return (
              <Badge key={clientId} variant="secondary" className="flex items-center gap-1">
                Klijent: {getClientName(client)}
                <button
                  onClick={() => removeClientFilter(clientId)}
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
          {(filters.amountRange.min !== undefined || filters.amountRange.max !== undefined) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Iznos: {filters.amountRange.min !== undefined && `${filters.amountRange.min} EUR`}
              {filters.amountRange.min !== undefined && filters.amountRange.max !== undefined && ' - '}
              {filters.amountRange.max !== undefined && `${filters.amountRange.max} EUR`}
              <button
                onClick={removeAmountFilter}
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
