'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Calendar, 
  Euro,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  MapPin
} from 'lucide-react';

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  caseType: string;
  openedAt: string;
  closedAt: string | null;
  nextHearingDate: string | null;
  statuteOfLimitations: string | null;
  estimatedValue: number | null;
  contingencyFee: number | null;
  courtName: string | null;
  courtCaseNumber: string | null;
  judge: string | null;
  opposingCounsel: string | null;
}

export default function ClientCasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      // Mock data for demonstration
      setCases([
        {
          id: '1',
          caseNumber: 'CASE-000001',
          title: 'Građanski spor - naknada štete',
          description: 'Spor oko naknade štete nastale prometnom nesrećom',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          caseType: 'Građansko pravo',
          openedAt: '2024-01-15',
          closedAt: null,
          nextHearingDate: '2024-12-20',
          statuteOfLimitations: '2025-01-15',
          estimatedValue: 50000,
          contingencyFee: 20,
          courtName: 'Općinski sud u Zagrebu',
          courtCaseNumber: 'Gž-123/2024',
          judge: 'Dr. Ana Anić',
          opposingCounsel: 'Odvjetnički ured Marković',
        },
        {
          id: '2',
          caseNumber: 'CASE-000002',
          title: 'Ugovor o radu - spor',
          description: 'Spor oko raskida ugovora o radu',
          status: 'OPEN',
          priority: 'MEDIUM',
          caseType: 'Radno pravo',
          openedAt: '2024-02-10',
          closedAt: null,
          nextHearingDate: null,
          statuteOfLimitations: '2025-02-10',
          estimatedValue: 25000,
          contingencyFee: 15,
          courtName: 'Općinski sud u Zagrebu',
          courtCaseNumber: 'Gž-456/2024',
          judge: 'Dr. Petar Petrić',
          opposingCounsel: 'Odvjetnički ured Novak',
        },
        {
          id: '3',
          caseNumber: 'CASE-000003',
          title: 'Nasljedni postupak',
          description: 'Postupak nasljeđivanja nakon smrti',
          status: 'CLOSED_WON',
          priority: 'LOW',
          caseType: 'Nasljedno pravo',
          openedAt: '2023-11-01',
          closedAt: '2024-03-15',
          nextHearingDate: null,
          statuteOfLimitations: null,
          estimatedValue: 100000,
          contingencyFee: 10,
          courtName: 'Općinski sud u Zagrebu',
          courtCaseNumber: 'Gž-789/2023',
          judge: 'Dr. Marija Marić',
          opposingCounsel: 'Odvjetnički ured Horvat',
        },
      ]);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: { variant: 'secondary' as const, label: 'Otvoren', icon: AlertCircle },
      IN_PROGRESS: { variant: 'default' as const, label: 'U tijeku', icon: Clock },
      ON_HOLD: { variant: 'outline' as const, label: 'Na čekanju', icon: AlertCircle },
      CLOSED_WON: { variant: 'default' as const, label: 'Završen uspješno', icon: CheckCircle },
      CLOSED_LOST: { variant: 'destructive' as const, label: 'Završen', icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { variant: 'secondary' as const, label: 'Niska' },
      MEDIUM: { variant: 'default' as const, label: 'Srednja' },
      HIGH: { variant: 'destructive' as const, label: 'Visoka' },
      URGENT: { variant: 'destructive' as const, label: 'Hitno' },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hr-HR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moji predmeti</h1>
        <p className="text-gray-600 mt-1">
          Pregled svih vaših predmeta i njihovog napretka
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupno predmeta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases.length}</div>
            <p className="text-xs text-muted-foreground">Svi predmeti</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktivni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {cases.filter(c => c.status === 'IN_PROGRESS' || c.status === 'OPEN').length}
            </div>
            <p className="text-xs text-muted-foreground">U tijeku</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Završeni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cases.filter(c => c.status.startsWith('CLOSED')).length}
            </div>
            <p className="text-xs text-muted-foreground">Uspješno završeni</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ukupna vrijednost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cases
                .filter(c => c.estimatedValue)
                .reduce((sum, c) => sum + (c.estimatedValue || 0), 0)
                .toLocaleString()} EUR
            </div>
            <p className="text-xs text-muted-foreground">Procijenjena vrijednost</p>
          </CardContent>
        </Card>
      </div>

      {/* Cases List */}
      <Card>
        <CardHeader>
          <CardTitle>Predmeti</CardTitle>
          <CardDescription>
            Detaljni pregled svih vaših predmeta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nema predmeta
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((case_) => (
                <Card key={case_.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{case_.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {case_.caseNumber} • {case_.caseType}
                        </CardDescription>
                        {case_.description && (
                          <p className="text-sm text-gray-600 mt-2">{case_.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(case_.status)}
                        {getPriorityBadge(case_.priority)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Basic Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-900">Osnovne informacije</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Otvoren: {formatDate(case_.openedAt)}</span>
                          </div>
                          {case_.closedAt && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-gray-400" />
                              <span>Završen: {formatDate(case_.closedAt)}</span>
                            </div>
                          )}
                          {case_.nextHearingDate && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>Sljedeći ročište: {formatDate(case_.nextHearingDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Court Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-900">Sudski podaci</h4>
                        <div className="space-y-1 text-sm">
                          {case_.courtName && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{case_.courtName}</span>
                            </div>
                          )}
                          {case_.courtCaseNumber && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-gray-400" />
                              <span>Broj: {case_.courtCaseNumber}</span>
                            </div>
                          )}
                          {case_.judge && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>Sudac: {case_.judge}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Financial Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-900">Financijski podaci</h4>
                        <div className="space-y-1 text-sm">
                          {case_.estimatedValue && (
                            <div className="flex items-center gap-2">
                              <Euro className="h-4 w-4 text-gray-400" />
                              <span>Vrijednost: {case_.estimatedValue.toLocaleString()} EUR</span>
                            </div>
                          )}
                          {case_.contingencyFee && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">%</span>
                              <span>Provizija: {case_.contingencyFee}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Opposing Counsel */}
                    {case_.opposingCounsel && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Protivni odvjetnik:</span>
                          <span className="font-medium">{case_.opposingCounsel}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
