'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  X, 
  User, 
  Briefcase, 
  FileText, 
  Clock,
  Receipt,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface SearchResult {
  id: string;
  type: string;
  score: number;
  displayName: string;
  url: string;
  clientName?: string;
  caseName?: string;
  userName?: string;
  status?: string;
  priority?: string;
  total?: number;
  date?: string;
  description?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  types: {
    clients: number;
    cases: number;
    documents: number;
    'time-entries': number;
    invoices: number;
  };
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          results ? Math.min(prev + 1, results.results.length - 1) : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results && results.results[selectedIndex]) {
          handleResultClick(results.results[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setSelectedIndex(0);
      } else {
        toast({
          title: 'Greška',
          description: 'Greška pri pretraživanju',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri pretraživanju',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    onClose();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <User className="h-4 w-4" />;
      case 'case':
        return <Briefcase className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'time-entry':
        return <Clock className="h-4 w-4" />;
      case 'invoice':
        return <Receipt className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getResultTypeLabel = (type: string) => {
    const labels = {
      'client': 'Klijent',
      'case': 'Predmet',
      'document': 'Dokument',
      'time-entry': 'Unos vremena',
      'invoice': 'Račun',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (result: SearchResult) => {
    if (result.status) {
      const statusConfig = {
        'ACTIVE': { variant: 'default' as const, label: 'Aktivan' },
        'INACTIVE': { variant: 'secondary' as const, label: 'Neaktivan' },
        'OPEN': { variant: 'default' as const, label: 'Otvoren' },
        'IN_PROGRESS': { variant: 'default' as const, label: 'U tijeku' },
        'CLOSED_WON': { variant: 'default' as const, label: 'Završen' },
        'DRAFT': { variant: 'secondary' as const, label: 'Nacrt' },
        'SENT': { variant: 'default' as const, label: 'Poslan' },
        'PAID': { variant: 'default' as const, label: 'Plaćen' },
        'OVERDUE': { variant: 'destructive' as const, label: 'Dospio' },
      };
      
      const config = statusConfig[result.status as keyof typeof statusConfig];
      if (config) {
        return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
      }
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: hr });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Globalna pretraga
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              placeholder="Pretražite klijente, predmete, dokumente..."
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => {
                  setQuery('');
                  setResults(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search Results */}
          <div className="mt-4 max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Pretraživanje...</span>
              </div>
            )}

            {!loading && query && !results && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Unesite najmanje 2 znaka za pretraživanje</p>
              </div>
            )}

            {!loading && results && results.results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nema rezultata za &quot;{query}&quot;</p>
              </div>
            )}

            {!loading && results && results.results.length > 0 && (
              <div className="space-y-2">
                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{results.total} rezultata za &quot;{query}&quot;</span>
                  <div className="flex space-x-2">
                    {Object.entries(results.types).map(([type, count]) => (
                      count > 0 && (
                        <Badge key={type} variant="outline" className="text-xs">
                          {getResultTypeLabel(type)}: {count}
                        </Badge>
                      )
                    ))}
                  </div>
                </div>

                {/* Results List */}
                {results.results.map((result, index) => (
                  <Card
                    key={`${result.type}-${result.id}`}
                    className={`cursor-pointer transition-colors ${
                      index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="p-2 rounded-full bg-muted">
                            {getResultIcon(result.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium truncate">{result.displayName}</h4>
                              <Badge variant="outline" className="text-xs">
                                {getResultTypeLabel(result.type)}
                              </Badge>
                              {getStatusBadge(result)}
                            </div>
                            
                            {result.clientName && (
                              <p className="text-sm text-muted-foreground">
                                Klijent: {result.clientName}
                              </p>
                            )}
                            
                            {result.caseName && (
                              <p className="text-sm text-muted-foreground">
                                Predmet: {result.caseName}
                              </p>
                            )}
                            
                            {result.userName && (
                              <p className="text-sm text-muted-foreground">
                                Korisnik: {result.userName}
                              </p>
                            )}
                            
                            {result.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {result.description}
                              </p>
                            )}
                            
                            {result.date && (
                              <p className="text-sm text-muted-foreground">
                                {formatDate(result.date)}
                              </p>
                            )}
                            
                            {result.total && (
                              <p className="text-sm text-muted-foreground">
                                {result.total.toFixed(2)} EUR
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Koristite ↑↓ za navigaciju, Enter za odabir, Esc za zatvaranje</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
