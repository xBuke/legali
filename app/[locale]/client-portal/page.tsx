'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Briefcase, 
  FileText, 
  Clock, 
  Euro,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface ClientData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  clientType: string;
  email: string | null;
  phone: string | null;
}

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  priority: string;
  openedAt: string;
  nextHearingDate: string | null;
  estimatedValue: number | null;
}

interface Document {
  id: string;
  title: string | null;
  originalName: string;
  category: string | null;
  createdAt: string;
  mimeType: string;
}

interface TimeEntry {
  id: string;
  date: string;
  duration: number;
  description: string;
  amount: number;
}

export default function ClientPortalDashboard() {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('clientPortal');

  useEffect(() => {
    // In a real implementation, you would get the client ID from authentication
    // For now, we'll use a mock client ID
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      // Mock data for demonstration
      // In a real implementation, you would fetch this from your API
      setClientData({
        id: '1',
        firstName: 'Marko',
        lastName: 'Marković',
        companyName: null,
        clientType: 'INDIVIDUAL',
        email: 'marko.markovic@example.com',
        phone: '+385 91 123 4567',
      });

      setCases([
        {
          id: '1',
          caseNumber: 'CASE-000001',
          title: 'Građanski spor - naknada štete',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          openedAt: '2024-01-15',
          nextHearingDate: '2024-12-20',
          estimatedValue: 50000,
        },
        {
          id: '2',
          caseNumber: 'CASE-000002',
          title: 'Ugovor o radu - spor',
          status: 'OPEN',
          priority: 'MEDIUM',
          openedAt: '2024-02-10',
          nextHearingDate: null,
          estimatedValue: 25000,
        },
      ]);

      setDocuments([
        {
          id: '1',
          title: 'Tužba',
          originalName: 'tuzba.pdf',
          category: 'Tužba',
          createdAt: '2024-01-20',
          mimeType: 'application/pdf',
        },
        {
          id: '2',
          title: 'Dokazni materijal',
          originalName: 'dokazi.pdf',
          category: 'Dokaz',
          createdAt: '2024-01-25',
          mimeType: 'application/pdf',
        },
      ]);

      setTimeEntries([
        {
          id: '1',
          date: '2024-01-20',
          duration: 120,
          description: 'Analiza dokaza',
          amount: 200.00,
        },
        {
          id: '2',
          date: '2024-01-25',
          duration: 90,
          description: 'Priprema tužbe',
          amount: 150.00,
        },
      ]);
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      OPEN: { variant: 'secondary' as const, label: t('status.open'), color: 'blue' },
      IN_PROGRESS: { variant: 'default' as const, label: t('status.inProgress'), color: 'orange' },
      ON_HOLD: { variant: 'outline' as const, label: t('status.onHold'), color: 'gray' },
      CLOSED_WON: { variant: 'default' as const, label: t('status.closedWon'), color: 'green' },
      CLOSED_LOST: { variant: 'destructive' as const, label: t('status.closedLost'), color: 'red' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN;
    
    return (
      <StatusBadge variant={config.variant} color={config.color}>
        {config.label}
      </StatusBadge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { variant: 'secondary' as const, label: t('priority.low') },
      MEDIUM: { variant: 'default' as const, label: t('priority.medium') },
      HIGH: { variant: 'destructive' as const, label: t('priority.high') },
      URGENT: { variant: 'destructive' as const, label: t('priority.urgent') },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hr-HR');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalBilledAmount = timeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalTimeSpent = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t('welcome.title', { name: `${clientData?.firstName} ${clientData?.lastName}` })}
        </h1>
        <p className="text-muted-foreground">
          {t('welcome.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Briefcase className="h-4 w-4 mr-2 text-primary" />
              {t('stats.activeCases')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases.length}</div>
            <p className="text-xs text-muted-foreground">{t('stats.totalCases')}</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-primary" />
              {t('stats.documents')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">{t('stats.availableDocuments')}</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              {t('stats.timeSpent')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalTimeSpent)}</div>
            <p className="text-xs text-muted-foreground">{t('stats.totalWork')}</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Euro className="h-4 w-4 mr-2 text-primary" />
              {t('stats.billed')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBilledAmount.toFixed(2)} EUR</div>
            <p className="text-xs text-muted-foreground">{t('stats.totalCosts')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('sections.myCases')}</span>
            <Link href="/client-portal/cases">
              <span className="text-sm text-primary hover:underline">{t('common.viewAll')}</span>
            </Link>
          </CardTitle>
          <CardDescription>
            {t('sections.casesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={t('emptyStates.noActiveCases')}
              description={t('emptyStates.noActiveCasesDescription')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.caseNumber')}</TableHead>
                  <TableHead>{t('table.title')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                  <TableHead>{t('table.priority')}</TableHead>
                  <TableHead>{t('table.nextHearing')}</TableHead>
                  <TableHead>{t('table.estimatedValue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.slice(0, 3).map((case_) => (
                  <TableRow key={case_.id}>
                    <TableCell className="font-medium">{case_.caseNumber}</TableCell>
                    <TableCell>{case_.title}</TableCell>
                    <TableCell>{getStatusBadge(case_.status)}</TableCell>
                    <TableCell>{getPriorityBadge(case_.priority)}</TableCell>
                    <TableCell>
                      {case_.nextHearingDate ? formatDate(case_.nextHearingDate) : '-'}
                    </TableCell>
                    <TableCell>
                      {case_.estimatedValue ? `${case_.estimatedValue.toLocaleString()} EUR` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('sections.recentDocuments')}</span>
            <Link href="/client-portal/documents">
              <span className="text-sm text-primary hover:underline">{t('common.viewAll')}</span>
            </Link>
          </CardTitle>
          <CardDescription>
            {t('sections.documentsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t('emptyStates.noDocuments')}
              description={t('emptyStates.noDocumentsDescription')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.category')}</TableHead>
                  <TableHead>{t('table.date')}</TableHead>
                  <TableHead>{t('table.type')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.slice(0, 3).map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      {doc.title || doc.originalName}
                    </TableCell>
                    <TableCell>
                      {doc.category && (
                        <Badge variant="outline">{doc.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.mimeType}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.recentWork')}</CardTitle>
          <CardDescription>
            {t('sections.workDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={t('emptyStates.noWork')}
              description={t('emptyStates.noWorkDescription')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.date')}</TableHead>
                  <TableHead>{t('table.description')}</TableHead>
                  <TableHead>{t('table.duration')}</TableHead>
                  <TableHead>{t('table.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.slice(0, 3).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{formatDuration(entry.duration)}</TableCell>
                    <TableCell className="font-medium">
                      {entry.amount.toFixed(2)} EUR
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
