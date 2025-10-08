'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { 
  User, 
  FileText, 
  Clock,
  Receipt, 
  Euro, 
  Calendar,
  Briefcase
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  changes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface CaseTimelineProps {
  caseId: string;
  caseNumber: string;
  caseTitle: string;
}

export function CaseTimeline({ caseId, caseNumber, caseTitle }: CaseTimelineProps) {
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [caseId, loadActivities]);

  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/activity-logs?entityId=${caseId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        toast({
          title: 'Greška',
          description: 'Greška pri učitavanju aktivnosti',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju aktivnosti',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (entity: string) => {
    switch (entity) {
      case 'Client':
        return <User className="h-4 w-4" />;
      case 'Case':
        return <Briefcase className="h-4 w-4" />;
      case 'Document':
        return <FileText className="h-4 w-4" />;
      case 'TimeEntry':
        return <Clock className="h-4 w-4" />;
      case 'Invoice':
        return <Receipt className="h-4 w-4" />;
      case 'Payment':
        return <Euro className="h-4 w-4" />;
      case 'Expense':
        return <Euro className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'VIEW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'DOWNLOAD':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SEND':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PAY':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityDescription = (activity: ActivityLog) => {
    const userName = `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email;
    
    const entityLabels: { [key: string]: string } = {
      'Client': 'klijent',
      'Case': 'predmet',
      'Document': 'dokument',
      'TimeEntry': 'unos vremena',
      'Invoice': 'račun',
      'Payment': 'plaćanje',
      'Expense': 'trošak',
    };

    const actionLabels: { [key: string]: string } = {
      'CREATE': 'stvorio',
      'UPDATE': 'ažurirao',
      'DELETE': 'obrisao',
      'VIEW': 'pregledao',
      'DOWNLOAD': 'preuzeo',
      'SEND': 'poslao',
      'PAY': 'platio',
    };

    const entityLabel = entityLabels[activity.entity] || activity.entity.toLowerCase();
    const actionLabel = actionLabels[activity.action] || activity.action.toLowerCase();

    let description = `${userName} je ${actionLabel} ${entityLabel}`;

    // Add specific details based on changes
    if (activity.changes && activity.action === 'UPDATE') {
      try {
        const changes = JSON.parse(activity.changes);
        const changedFields = Object.keys(changes);
        if (changedFields.length > 0) {
          description += ` (${changedFields.join(', ')})`;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    return description;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: hr });
  };

  const groupActivitiesByDate = (activities: ActivityLog[]) => {
    const groups: { [key: string]: ActivityLog[] } = {};
    
    activities.forEach(activity => {
      const date = format(new Date(activity.createdAt), 'dd.MM.yyyy', { locale: hr });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    return groups;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline predmeta</CardTitle>
          <CardDescription>
            Povijest aktivnosti za predmet {caseNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Učitavanje aktivnosti...</div>
        </CardContent>
      </Card>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Timeline predmeta
        </CardTitle>
        <CardDescription>
          Povijest aktivnosti za predmet {caseNumber} - {caseTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedActivities).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nema aktivnosti za ovaj predmet
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dayActivities]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center">
                    <div className="h-px bg-border flex-1" />
                    <div className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                      {date}
                    </div>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  
                  <div className="space-y-3 ml-4">
                    {dayActivities
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full border ${getActivityColor(activity.action)}`}>
                            {getActivityIcon(activity.entity, activity.action)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium">
                                {getActivityDescription(activity)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {activity.action}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.createdAt)}
                            </p>
                            
                            {activity.changes && activity.action === 'UPDATE' && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <details>
                                  <summary className="cursor-pointer font-medium">
                                    Detalji promjena
                                  </summary>
                                  <pre className="mt-2 whitespace-pre-wrap">
                                    {JSON.stringify(JSON.parse(activity.changes), null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
