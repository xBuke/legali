# Time Tracking (Pratnja vremena) Improvement Plan

## Current State Analysis

### What Works Well
- Clean interface with good statistics display
- Comprehensive time entry form
- Good case association
- Proper time formatting
- Status indicators for billable/non-billable entries
- Permission-based access control

### Issues Identified

#### Desktop (1920x1080)
- **Good**: Layout is well-spaced and readable
- **Issue**: Could benefit from more detailed time tracking features
- **Issue**: No time tracking analytics or reports
- **Issue**: Limited time entry management options

#### Tablet (768x1024)
- **Good**: Form adapts well to tablet size
- **Issue**: Statistics cards could be better optimized
- **Issue**: Table could be more touch-friendly

#### Mobile (375x667)
- **Issue**: Form becomes cramped on mobile
- **Issue**: Statistics cards stack but could be optimized
- **Issue**: Table is not mobile-friendly

## Comprehensive Improvement Plan

### 1. Enhanced Time Tracking Interface

#### Current Problems
- Basic time entry form only
- No timer functionality
- Limited time entry management
- No bulk operations
- No time tracking analytics

#### Proposed Solutions

**A. Timer-Based Time Tracking**
```typescript
interface TimeTracker {
  isRunning: boolean;
  startTime: Date | null;
  currentEntry: TimeEntry | null;
  elapsedTime: number;
  caseId: string | null;
  description: string;
}

const TimeTracker = () => {
  const [tracker, setTracker] = useState<TimeTracker>({
    isRunning: false,
    startTime: null,
    currentEntry: null,
    elapsedTime: 0,
    caseId: null,
    description: '',
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tracker.isRunning && tracker.startTime) {
      interval = setInterval(() => {
        setTracker(prev => ({
          ...prev,
          elapsedTime: Date.now() - prev.startTime!.getTime(),
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tracker.isRunning, tracker.startTime]);

  const startTimer = () => {
    setTracker(prev => ({
      ...prev,
      isRunning: true,
      startTime: new Date(),
    }));
  };

  const stopTimer = () => {
    setTracker(prev => ({
      ...prev,
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
    }));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Timer</h3>
        <div className="text-2xl font-mono">
          {formatTime(tracker.elapsedTime)}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="case">Predmet</Label>
          <Select value={tracker.caseId || ''} onValueChange={(value) => 
            setTracker(prev => ({ ...prev, caseId: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Odaberite predmet" />
            </SelectTrigger>
            <SelectContent>
              {cases.map(case => (
                <SelectItem key={case.id} value={case.id}>
                  {case.caseNumber} - {case.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="description">Opis rada</Label>
          <Textarea
            id="description"
            value={tracker.description}
            onChange={(e) => setTracker(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Opisite što radite..."
          />
        </div>
        
        <div className="flex gap-2">
          {!tracker.isRunning ? (
            <Button onClick={startTimer} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Pokreni timer
            </Button>
          ) : (
            <Button onClick={stopTimer} variant="destructive" className="flex-1">
              <Pause className="h-4 w-4 mr-2" />
              Zaustavi timer
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
```

**B. Advanced Time Entry Management**
```typescript
interface TimeEntryFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  case: string[];
  user: string[];
  billable: boolean | null;
  status: 'draft' | 'submitted' | 'approved' | 'billed';
}

const TimeEntryManagement = () => {
  const [filters, setFilters] = useState<TimeEntryFilters>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date(),
    },
    case: [],
    user: [],
    billable: null,
    status: 'draft',
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Datum od</Label>
          <Input
            type="date"
            value={filters.dateRange.from.toISOString().split('T')[0]}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, from: new Date(e.target.value) }
            }))}
          />
        </div>
        <div className="flex-1">
          <Label>Datum do</Label>
          <Input
            type="date"
            value={filters.dateRange.to.toISOString().split('T')[0]}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, to: new Date(e.target.value) }
            }))}
          />
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Predmet</Label>
          <Select value={filters.case[0] || ''} onValueChange={(value) => 
            setFilters(prev => ({ ...prev, case: value ? [value] : [] }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Svi predmeti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Svi predmeti</SelectItem>
              {cases.map(case => (
                <SelectItem key={case.id} value={case.id}>
                  {case.caseNumber} - {case.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Label>Status</Label>
          <Select value={filters.status} onValueChange={(value) => 
            setFilters(prev => ({ ...prev, status: value as any }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Nacrt</SelectItem>
              <SelectItem value="submitted">Poslano</SelectItem>
              <SelectItem value="approved">Odobreno</SelectItem>
              <SelectItem value="billed">Naplaćeno</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
```

### 2. Enhanced Time Tracking Analytics

#### Current Problems
- Basic statistics only
- No trend analysis
- No productivity insights
- No time allocation reports
- No billing efficiency metrics

#### Proposed Solutions

**A. Advanced Analytics Dashboard**
```typescript
interface TimeAnalytics {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  averageDailyHours: number;
  productivityScore: number;
  billingEfficiency: number;
  timeByCase: CaseTimeBreakdown[];
  timeByUser: UserTimeBreakdown[];
  timeByCategory: CategoryTimeBreakdown[];
  trends: TimeTrend[];
}

interface CaseTimeBreakdown {
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  totalHours: number;
  billableHours: number;
  averageHourlyRate: number;
  totalAmount: number;
}

const TimeAnalytics = () => {
  const { data: analytics } = useSWR('/api/time-tracking/analytics');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ukupno sati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalHours.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground">
            {analytics?.billableHours.toFixed(1)}h naplativo
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Produktivnost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.productivityScore}%</div>
          <p className="text-xs text-muted-foreground">
            Prosječno {analytics?.averageDailyHours.toFixed(1)}h/dan
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Naplativost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.billingEfficiency}%</div>
          <p className="text-xs text-muted-foreground">
            Naplativo vremena
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ukupni iznos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics?.timeByCase.reduce((sum, case) => sum + case.totalAmount, 0).toFixed(2)} EUR
          </div>
          <p className="text-xs text-muted-foreground">
            Fakturirano
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

**B. Time Tracking Charts**
```typescript
const TimeTrackingCharts = () => {
  const { data: analytics } = useSWR('/api/time-tracking/analytics');
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Vrijeme po predmetima</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.timeByCase}
                dataKey="totalHours"
                nameKey="caseTitle"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
              >
                {analytics?.timeByCase.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Trend vremena</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.trends}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="billableHours" stroke="#8884d8" />
              <Line type="monotone" dataKey="nonBillableHours" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 3. Improved Mobile Experience

#### Current Problems
- Form becomes cramped on mobile
- Statistics cards could be better optimized
- Table is not mobile-friendly
- No mobile-specific time tracking features

#### Proposed Solutions

**A. Mobile-Optimized Timer**
```typescript
const MobileTimer = () => {
  const [tracker, setTracker] = useState<TimeTracker>({
    isRunning: false,
    startTime: null,
    currentEntry: null,
    elapsedTime: 0,
    caseId: null,
    description: '',
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-lg font-mono">
            {formatTime(tracker.elapsedTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            {tracker.caseId ? getCaseTitle(tracker.caseId) : 'Bez predmeta'}
          </div>
        </div>
        
        <div className="flex gap-2">
          {!tracker.isRunning ? (
            <Button onClick={startTimer} size="lg">
              <Play className="h-5 w-5" />
            </Button>
          ) : (
            <Button onClick={stopTimer} variant="destructive" size="lg">
              <Pause className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
```

**B. Mobile Time Entry Cards**
```typescript
const MobileTimeEntryList = ({ timeEntries }: { timeEntries: TimeEntry[] }) => {
  return (
    <div className="space-y-4">
      {timeEntries.map(entry => (
        <Card key={entry.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{entry.description}</h3>
              <p className="text-sm text-muted-foreground">
                {entry.case?.caseNumber} - {entry.case?.title}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{formatDuration(entry.duration)}</span>
                <span>{entry.hourlyRate.toFixed(2)} EUR/h</span>
                <span>{entry.amount.toFixed(2)} EUR</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(entry.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

### 4. Advanced Time Tracking Features

#### A. Time Tracking Templates
```typescript
interface TimeTrackingTemplate {
  id: string;
  name: string;
  description: string;
  caseId?: string;
  hourlyRate: number;
  isBillable: boolean;
  tags: string[];
  isDefault: boolean;
}

const TimeTrackingTemplates = () => {
  const [templates, setTemplates] = useState<TimeTrackingTemplate[]>([]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Predlošci</h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novi predložak
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-4 cursor-pointer hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={template.isBillable ? 'default' : 'secondary'}>
                    {template.isBillable ? 'Naplativo' : 'Nenaplativo'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {template.hourlyRate.toFixed(2)} EUR/h
                  </span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => useTemplate(template)}>
                Koristi
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

#### B. Time Tracking Automation
```typescript
interface TimeTrackingAutomation {
  rules: AutomationRule[];
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
}

interface AutomationRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
}

// Example: Auto-start timer when opening a case
const AutoStartTimer = () => {
  const { data: currentCase } = useSWR('/api/cases/current');
  
  useEffect(() => {
    if (currentCase && !tracker.isRunning) {
      // Auto-start timer for current case
      setTracker(prev => ({
        ...prev,
        caseId: currentCase.id,
        description: `Rad na predmetu ${currentCase.caseNumber}`,
      }));
    }
  }, [currentCase]);
  
  return null;
};
```

#### C. Time Tracking Reports
```typescript
interface TimeTrackingReport {
  id: string;
  name: string;
  type: 'summary' | 'detailed' | 'billing' | 'productivity';
  filters: TimeEntryFilters;
  generatedAt: Date;
  data: any;
}

const TimeTrackingReports = () => {
  const [reports, setReports] = useState<TimeTrackingReport[]>([]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Izvještaji</h3>
        <Button size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Novi izvještaj
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(report => (
          <Card key={report.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{report.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {report.type} • {formatDate(report.generatedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### 5. Integration Features

#### A. Calendar Integration
```typescript
interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'apple';
  syncEnabled: boolean;
  syncInterval: number;
  autoCreateEntries: boolean;
}

const CalendarIntegration = () => {
  const [integration, setIntegration] = useState<CalendarIntegration>({
    provider: 'google',
    syncEnabled: false,
    syncInterval: 15,
    autoCreateEntries: false,
  });
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Kalendar integracija</h3>
          <p className="text-sm text-muted-foreground">
            Automatski sinkroniziraj s kalendarom
          </p>
        </div>
        <Switch
          checked={integration.syncEnabled}
          onCheckedChange={(checked) => setIntegration(prev => ({ ...prev, syncEnabled: checked }))}
        />
      </div>
    </Card>
  );
};
```

#### B. Billing Integration
```typescript
interface BillingIntegration {
  autoCreateInvoices: boolean;
  invoiceTemplate: string;
  billingCycle: 'weekly' | 'monthly' | 'quarterly';
  includeNonBillable: boolean;
}

const BillingIntegration = () => {
  const [billing, setBilling] = useState<BillingIntegration>({
    autoCreateInvoices: false,
    invoiceTemplate: 'default',
    billingCycle: 'monthly',
    includeNonBillable: false,
  });
  
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Automatsko fakturiranje</h3>
            <p className="text-sm text-muted-foreground">
              Automatski stvori račune iz unosa vremena
            </p>
          </div>
          <Switch
            checked={billing.autoCreateInvoices}
            onCheckedChange={(checked) => setBilling(prev => ({ ...prev, autoCreateInvoices: checked }))}
          />
        </div>
        
        {billing.autoCreateInvoices && (
          <div className="space-y-4">
            <div>
              <Label>Ciklus fakturiranja</Label>
              <Select value={billing.billingCycle} onValueChange={(value) => 
                setBilling(prev => ({ ...prev, billingCycle: value as any }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Tjedno</SelectItem>
                  <SelectItem value="monthly">Mjesečno</SelectItem>
                  <SelectItem value="quarterly">Kvartalno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeNonBillable"
                checked={billing.includeNonBillable}
                onCheckedChange={(checked) => setBilling(prev => ({ ...prev, includeNonBillable: !!checked }))}
              />
              <Label htmlFor="includeNonBillable">Uključi nenaplativo vrijeme</Label>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
```

## Implementation Priority

### Phase 1 (High Priority)
1. Fix mobile responsiveness
2. Implement timer functionality
3. Add advanced search and filtering
4. Improve time entry management

### Phase 2 (Medium Priority)
1. Add time tracking analytics
2. Implement time tracking templates
3. Add mobile-specific features
4. Improve performance

### Phase 3 (Low Priority)
1. Advanced automation features
2. Integration features
3. Advanced reporting
4. Team collaboration features

## Technical Requirements

### Dependencies
- React Window for virtualization
- React Hook Form for forms
- React Query for data fetching
- Recharts for charts
- Framer Motion for animations

### API Endpoints Needed
- `/api/time-tracking/timer` - Timer management
- `/api/time-tracking/analytics` - Analytics data
- `/api/time-tracking/templates` - Time tracking templates
- `/api/time-tracking/reports` - Time tracking reports
- `/api/time-tracking/automation` - Automation rules
- `/api/time-tracking/integrations` - Integration settings

### Database Changes
- Time tracking templates table
- Time tracking automation table
- Time tracking reports table
- Time tracking analytics cache table

## Success Metrics

### User Experience
- Reduced time to log time entries
- Increased time tracking accuracy
- Improved mobile usability
- Faster time entry operations

### Performance
- Faster analytics loading
- Reduced page load times
- Better mobile performance
- Improved data loading

### Business Impact
- Better time tracking accuracy
- Increased billing efficiency
- Improved productivity insights
- Better client billing

## Questions for Further Development

1. **Timer Usage**: How important is real-time timer functionality for your workflow?
2. **Analytics Needs**: What time tracking metrics and reports are most important?
3. **Mobile Usage**: How important is mobile time tracking for your team?
4. **Integration Requirements**: Which systems need to integrate with time tracking?
5. **Automation Needs**: What time tracking tasks should be automated?
6. **Billing Integration**: How should time tracking integrate with billing and invoicing?
7. **Team Collaboration**: How many team members need to track time?
8. **Reporting Requirements**: What time tracking reports are needed for management?

