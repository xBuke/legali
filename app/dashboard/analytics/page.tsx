'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { CaseDistributionChart } from '@/components/analytics/case-distribution-chart';
import { ProductivityChart } from '@/components/analytics/productivity-chart';
import { ReportsBuilder } from '@/components/analytics/reports-builder';

interface KPIMetrics {
  revenue: {
    current: number;
    previous: number;
    trend: number;
    forecast: number;
  };
  productivity: {
    casesCompleted: number;
    averageResolutionTime: number;
    billableHours: number;
    efficiency: number;
  };
  clientSatisfaction: {
    rating: number;
    totalResponses: number;
    trend: number;
  };
  caseSuccess: {
    successRate: number;
    totalCases: number;
    trend: number;
  };
}

interface BusinessForecast {
  revenue: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
  cases: {
    expected: number;
    capacity: number;
  };
  growth: {
    clientGrowth: number;
    revenueGrowth: number;
  };
}

interface BusinessAlerts {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  action?: string;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [kpis, setKpis] = useState<KPIMetrics | null>(null);
  const [forecast, setForecast] = useState<BusinessForecast | null>(null);
  const [alerts, setAlerts] = useState<BusinessAlerts[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setRefreshing(true);
      
      // Load KPIs
      const kpisResponse = await fetch('/api/analytics/kpis');
      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        setKpis(kpisData);
      }

      // Load Forecast
      const forecastResponse = await fetch('/api/analytics/forecast');
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        setForecast(forecastData);
      }

      // Load Alerts
      const alertsResponse = await fetch('/api/analytics/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju analitike',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = (trend: number) => {
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Učitavanje analitike...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analitika i izvještaji</h1>
          <p className="text-muted-foreground">
            Pregled poslovnih metrika i performansi
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadAnalyticsData}
            disabled={refreshing}
            className="min-h-[44px]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Osvježi
          </Button>
          <Button className="min-h-[44px]">
            <Download className="h-4 w-4 mr-2" />
            Izvezi izvještaj
          </Button>
        </div>
      </div>

      {/* Business Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Poslovni alati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <span className="text-lg">{getAlertIcon(alert.type)}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleString('hr-HR')}
                    </p>
                  </div>
                  {alert.action && (
                    <Button size="sm" variant="outline">
                      {alert.action}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Metrics */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue KPI */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Prihod
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.revenue.current)}</div>
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon(kpis.revenue.trend)}
                <span className={getTrendColor(kpis.revenue.trend)}>
                  {formatPercentage(kpis.revenue.trend)}
                </span>
                <span className="text-muted-foreground">od prošlog mjeseca</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Prognoza: {formatCurrency(kpis.revenue.forecast)}
              </div>
            </CardContent>
          </Card>

          {/* Productivity KPI */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Produktivnost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.productivity.casesCompleted}</div>
              <div className="text-sm text-muted-foreground">završenih predmeta</div>
              <div className="text-xs text-muted-foreground mt-1">
                Prosječno vrijeme: {kpis.productivity.averageResolutionTime} dana
              </div>
            </CardContent>
          </Card>

          {/* Client Satisfaction KPI */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Zadovoljstvo klijenata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.clientSatisfaction.rating.toFixed(1)}/5</div>
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon(kpis.clientSatisfaction.trend)}
                <span className={getTrendColor(kpis.clientSatisfaction.trend)}>
                  {formatPercentage(kpis.clientSatisfaction.trend)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {kpis.clientSatisfaction.totalResponses} odgovora
              </div>
            </CardContent>
          </Card>

          {/* Case Success KPI */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Uspješnost predmeta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.caseSuccess.successRate.toFixed(1)}%</div>
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon(kpis.caseSuccess.trend)}
                <span className={getTrendColor(kpis.caseSuccess.trend)}>
                  {formatPercentage(kpis.caseSuccess.trend)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {kpis.caseSuccess.totalCases} ukupno predmeta
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Pregled</TabsTrigger>
          <TabsTrigger value="revenue">Prihod</TabsTrigger>
          <TabsTrigger value="productivity">Produktivnost</TabsTrigger>
          <TabsTrigger value="reports">Izvještaji</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Trend prihoda
                </CardTitle>
                <CardDescription>
                  Mjesečni prihod kroz zadnjih 12 mjeseci
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>

            {/* Case Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribucija predmeta
                </CardTitle>
                <CardDescription>
                  Predmeti po statusu i tipu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaseDistributionChart />
              </CardContent>
            </Card>
          </div>

          {/* Business Forecast */}
          {forecast && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Poslovna prognoza
                </CardTitle>
                <CardDescription>
                  Predviđanja za sljedeće razdoblje
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(forecast.revenue.nextMonth)}
                    </div>
                    <div className="text-sm text-muted-foreground">Sljedeći mjesec</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(forecast.revenue.nextQuarter)}
                    </div>
                    <div className="text-sm text-muted-foreground">Sljedeći kvartal</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(forecast.revenue.nextYear)}
                    </div>
                    <div className="text-sm text-muted-foreground">Sljedeća godina</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Performing Case Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Najuspješniji tipovi predmeta
              </CardTitle>
              <CardDescription>
                Analiza performansi po tipovima predmeta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Građansko pravo', successRate: 85, averageDuration: 35, revenue: 3200 },
                  { type: 'Trgovačko pravo', successRate: 82, averageDuration: 28, revenue: 2800 },
                  { type: 'Radno pravo', successRate: 78, averageDuration: 42, revenue: 2200 },
                  { type: 'Kazneno pravo', successRate: 75, averageDuration: 55, revenue: 1800 }
                ].map((type, index) => (
                  <div key={type.type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{type.type}</h3>
                        <p className="text-sm text-muted-foreground">
                          Prosječno trajanje: {type.averageDuration} dana
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">{type.successRate}% uspjeh</p>
                        <p className="text-sm text-muted-foreground">Stopa uspjeha</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{type.revenue.toLocaleString()} €</p>
                        <p className="text-sm text-muted-foreground">Prosječni prihod</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Mjesečni trendovi
              </CardTitle>
              <CardDescription>
                Pregled mjesečnih performansi i trendova
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { month: 'Sij', opened: 12, closed: 8, revenue: 18000 },
                  { month: 'Velj', opened: 15, closed: 12, revenue: 22000 },
                  { month: 'Ožu', opened: 18, closed: 14, revenue: 26000 },
                  { month: 'Tra', opened: 14, closed: 16, revenue: 24000 },
                  { month: 'Svi', opened: 16, closed: 13, revenue: 25000 },
                  { month: 'Lip', opened: 20, closed: 18, revenue: 30000 }
                ].map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold">{trend.month}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{trend.month} 2024</h3>
                        <p className="text-sm text-muted-foreground">
                          Otvoreno: {trend.opened} | Zatvoreno: {trend.closed}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{trend.revenue.toLocaleString()} €</p>
                      <p className="text-sm text-muted-foreground">Prihod</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analiza prihoda</CardTitle>
              <CardDescription>
                Detaljna analiza prihoda po klijentima, predmetima i vremenu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart className="h-96" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analiza produktivnosti</CardTitle>
              <CardDescription>
                Metrije produktivnosti tima i pojedinaca
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductivityChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
