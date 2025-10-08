'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Briefcase,
  FileText,
  Clock,
  DollarSign,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { CustomLineChart, CustomBarChart, CustomPieChart, CustomAreaChart } from '@/components/charts';

interface AnalyticsData {
  overview: {
    totalClients: number;
    activeCases: number;
    totalRevenue: number;
    billableHours: number;
    clientGrowth: number;
    caseGrowth: number;
    revenueGrowth: number;
    hoursGrowth: number;
  };
  revenue: {
    monthly: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
    byClient: Array<{ client: string; revenue: number; cases: number }>;
    byCase: Array<{ case: string; revenue: number; hours: number }>;
  };
  timeTracking: {
    daily: Array<{ date: string; hours: number; billable: number }>;
    byUser: Array<{ user: string; hours: number; billable: number }>;
    byCase: Array<{ case: string; hours: number; billable: number }>;
  };
  cases: {
    status: Array<{ status: string; count: number; percentage: number }>;
    priority: Array<{ priority: string; count: number; percentage: number }>;
    timeline: Array<{ month: string; opened: number; closed: number }>;
  };
  clients: {
    byType: Array<{ type: string; count: number; percentage: number }>;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    acquisition: Array<{ month: string; new: number; total: number }>;
  };
}

export default function AnalyticsPage() {
  const t = useTranslations();
  const { toast } = useToast();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12months');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, fetchAnalyticsData]);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockData: AnalyticsData = {
        overview: {
          totalClients: 156,
          activeCases: 89,
          totalRevenue: 245000,
          billableHours: 2840,
          clientGrowth: 12.5,
          caseGrowth: -3.2,
          revenueGrowth: 18.7,
          hoursGrowth: 8.3,
        },
        revenue: {
          monthly: [
            { month: 'Jan', revenue: 18000, expenses: 12000, profit: 6000 },
            { month: 'Feb', revenue: 22000, expenses: 14000, profit: 8000 },
            { month: 'Mar', revenue: 25000, expenses: 15000, profit: 10000 },
            { month: 'Apr', revenue: 28000, expenses: 16000, profit: 12000 },
            { month: 'May', revenue: 32000, expenses: 18000, profit: 14000 },
            { month: 'Jun', revenue: 35000, expenses: 20000, profit: 15000 },
          ],
          byClient: [
            { client: 'ABC Corp', revenue: 45000, cases: 12 },
            { client: 'XYZ Ltd', revenue: 38000, cases: 8 },
            { client: 'DEF Inc', revenue: 32000, cases: 15 },
            { client: 'GHI LLC', revenue: 28000, cases: 6 },
            { client: 'JKL Co', revenue: 25000, cases: 10 },
          ],
          byCase: [
            { case: 'Contract Dispute', revenue: 15000, hours: 120 },
            { case: 'Estate Planning', revenue: 12000, hours: 80 },
            { case: 'Corporate Law', revenue: 18000, hours: 150 },
            { case: 'Litigation', revenue: 22000, hours: 200 },
            { case: 'Real Estate', revenue: 10000, hours: 60 },
          ],
        },
        timeTracking: {
          daily: [
            { date: 'Week 1', hours: 35, billable: 28 },
            { date: 'Week 2', hours: 42, billable: 35 },
            { date: 'Week 3', hours: 38, billable: 32 },
            { date: 'Week 4', hours: 45, billable: 38 },
          ],
          byUser: [
            { user: 'John Doe', hours: 120, billable: 100 },
            { user: 'Jane Smith', hours: 95, billable: 80 },
            { user: 'Mike Johnson', hours: 110, billable: 90 },
            { user: 'Sarah Wilson', hours: 85, billable: 70 },
          ],
          byCase: [
            { case: 'Contract Dispute', hours: 120, billable: 100 },
            { case: 'Estate Planning', hours: 80, billable: 70 },
            { case: 'Corporate Law', hours: 150, billable: 130 },
            { case: 'Litigation', hours: 200, billable: 180 },
          ],
        },
        cases: {
          status: [
            { status: 'Open', count: 45, percentage: 50.6 },
            { status: 'In Progress', count: 28, percentage: 31.5 },
            { status: 'Completed', count: 12, percentage: 13.5 },
            { status: 'On Hold', count: 4, percentage: 4.5 },
          ],
          priority: [
            { priority: 'High', count: 15, percentage: 16.9 },
            { priority: 'Medium', count: 45, percentage: 50.6 },
            { priority: 'Low', count: 29, percentage: 32.6 },
          ],
          timeline: [
            { month: 'Jan', opened: 12, closed: 8 },
            { month: 'Feb', opened: 15, closed: 10 },
            { month: 'Mar', opened: 18, closed: 12 },
            { month: 'Apr', opened: 14, closed: 16 },
            { month: 'May', opened: 20, closed: 14 },
            { month: 'Jun', opened: 16, closed: 18 },
          ],
        },
        clients: {
          byType: [
            { type: 'Individual', count: 89, percentage: 57.1 },
            { type: 'Corporate', count: 45, percentage: 28.8 },
            { type: 'Non-profit', count: 22, percentage: 14.1 },
          ],
          byStatus: [
            { status: 'Active', count: 134, percentage: 85.9 },
            { status: 'Inactive', count: 22, percentage: 14.1 },
          ],
          acquisition: [
            { month: 'Jan', new: 8, total: 148 },
            { month: 'Feb', new: 12, total: 150 },
            { month: 'Mar', new: 15, total: 153 },
            { month: 'Apr', new: 10, total: 154 },
            { month: 'May', new: 18, total: 155 },
            { month: 'Jun', new: 14, total: 156 },
          ],
        },
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <TrendingUp className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-4 opacity-50" />
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            {t('navigation.analytics')}
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your legal practice performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalClients}</div>
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon(analyticsData.overview.clientGrowth)}
              <span className={`text-xs ${getTrendColor(analyticsData.overview.clientGrowth)}`}>
                {analyticsData.overview.clientGrowth > 0 ? '+' : ''}{analyticsData.overview.clientGrowth}%
              </span>
            </div>
            <Progress 
              value={Math.min(Math.abs(analyticsData.overview.clientGrowth), 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.activeCases}</div>
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon(analyticsData.overview.caseGrowth)}
              <span className={`text-xs ${getTrendColor(analyticsData.overview.caseGrowth)}`}>
                {analyticsData.overview.caseGrowth > 0 ? '+' : ''}{analyticsData.overview.caseGrowth}%
              </span>
            </div>
            <Progress 
              value={Math.min(Math.abs(analyticsData.overview.caseGrowth), 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{analyticsData.overview.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon(analyticsData.overview.revenueGrowth)}
              <span className={`text-xs ${getTrendColor(analyticsData.overview.revenueGrowth)}`}>
                {analyticsData.overview.revenueGrowth > 0 ? '+' : ''}{analyticsData.overview.revenueGrowth}%
              </span>
            </div>
            <Progress 
              value={Math.min(Math.abs(analyticsData.overview.revenueGrowth), 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.billableHours.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon(analyticsData.overview.hoursGrowth)}
              <span className={`text-xs ${getTrendColor(analyticsData.overview.hoursGrowth)}`}>
                {analyticsData.overview.hoursGrowth > 0 ? '+' : ''}{analyticsData.overview.hoursGrowth}%
              </span>
            </div>
            <Progress 
              value={Math.min(Math.abs(analyticsData.overview.hoursGrowth), 100)} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
            <CardDescription>
              Monthly revenue, expenses, and profit analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomLineChart 
              data={analyticsData.revenue.monthly} 
              config={{
                revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
                expenses: { label: 'Expenses', color: 'hsl(var(--destructive))' },
                profit: { label: 'Profit', color: 'hsl(var(--success))' }
              }}
              height={300}
            />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Revenue by Client
            </CardTitle>
            <CardDescription>
              Top clients by revenue contribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomBarChart 
              data={analyticsData.revenue.byClient} 
              config={{
                revenue: { label: 'Revenue (€)', color: 'hsl(var(--primary))' },
                cases: { label: 'Cases', color: 'hsl(var(--secondary))' }
              }}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Time Tracking Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Tracking Trends
            </CardTitle>
            <CardDescription>
              Weekly time tracking and billable hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomAreaChart 
              data={analyticsData.timeTracking.daily} 
              config={{
                hours: { label: 'Total Hours', color: 'hsl(var(--primary))' },
                billable: { label: 'Billable Hours', color: 'hsl(var(--success))' }
              }}
              height={300}
            />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Time by Case Type
            </CardTitle>
            <CardDescription>
              Hours spent on different case types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomPieChart 
              data={analyticsData.timeTracking.byCase.map(item => ({
                name: item.case,
                value: item.hours,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
              }))} 
              config={{
                value: { label: 'Hours' }
              }}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Case Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Status Distribution
            </CardTitle>
            <CardDescription>
              Current status of all cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomPieChart 
              data={analyticsData.cases.status.map(item => ({
                name: item.status,
                value: item.count,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
              }))} 
              config={{
                value: { label: 'Cases' }
              }}
              height={300}
            />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Case Timeline
            </CardTitle>
            <CardDescription>
              Cases opened and closed over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomBarChart 
              data={analyticsData.cases.timeline} 
              config={{
                opened: { label: 'Opened', color: 'hsl(var(--primary))' },
                closed: { label: 'Closed', color: 'hsl(var(--success))' }
              }}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Client Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Types
            </CardTitle>
            <CardDescription>
              Distribution of clients by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomPieChart 
              data={analyticsData.clients.byType.map(item => ({
                name: item.type,
                value: item.count,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
              }))} 
              config={{
                value: { label: 'Clients' }
              }}
              height={300}
            />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Client Acquisition
            </CardTitle>
            <CardDescription>
              New client acquisition over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomLineChart 
              data={analyticsData.clients.acquisition} 
              config={{
                new: { label: 'New Clients', color: 'hsl(var(--primary))' },
                total: { label: 'Total Clients', color: 'hsl(var(--secondary))' }
              }}
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
