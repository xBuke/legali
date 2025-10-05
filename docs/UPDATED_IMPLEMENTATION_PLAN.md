# Updated Implementation Plan - Croatian Law Compliant

## Executive Summary

Based on Croatian law research and your preferences, this updated plan includes Croatian-specific contract templates, flexible analytics intervals, built-in calendar with external connectivity, and comprehensive admin role management.

## Updated Requirements

1. **Calendar**: Built-in with external connectivity (Google Calendar, Outlook)
2. **Contract Templates**: Croatian law compliant templates
3. **Analytics**: Daily, weekly, monthly, yearly intervals
4. **User Roles**: Admin (comprehensive oversight) + Basic
5. **Performance**: Smooth operation
6. **Customization**: Logo upload for templates

## Croatian Law Contract Types

Based on Croatian civil law research, here are the essential contract types that must be included:

### **Mandatory Written Contracts (Croatian Law)**
- **Ugovor o najmu** (Rental Agreement)
- **Ugovor o zakupu** (Lease Agreement) 
- **Ugovor o kupoprodaji nekretnina** (Real Estate Purchase Agreement)
- **Ugovor o gradnji** (Construction Agreement)
- **Ugovor o zajmu** (Loan Agreement)

### **Common Legal Contracts**
- **Ugovor o radu** (Employment Contract)
- **Ugovor o pružanju usluga** (Service Agreement)
- **Ugovor o zastupanju** (Representation Agreement)
- **Ugovor o povjerenju** (Trust Agreement)
- **Ugovor o osiguranju** (Insurance Contract)

### **Commercial Contracts**
- **Ugovor o kupoprodaji robe** (Goods Sales Contract)
- **Ugovor o distribuciji** (Distribution Agreement)
- **Ugovor o franšizi** (Franchise Agreement)
- **Ugovor o licenciranju** (Licensing Agreement)

## Phase 1: Critical Fixes (Weeks 1-2)

### 🔴 **Priority 1: Fix Page Loading Issues**

**Solution**: Ensure all pages load correctly
```typescript
// Check and fix these files:
- app/dashboard/documents/page.tsx
- app/dashboard/time-tracking/page.tsx  
- app/dashboard/invoices/page.tsx
- app/api/documents/route.ts
- app/api/time-entries/route.ts
- app/api/invoices/route.ts
```

### 🔴 **Priority 2: Mobile Responsiveness**

**Solution**: Implement mobile-first design
```typescript
// Mobile card layout for all sections
const MobileResponsiveLayout = ({ children, type }: { children: React.ReactNode; type: 'table' | 'cards' }) => {
  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:block">
        {children}
      </div>
      
      {/* Mobile view */}
      <div className="block md:hidden">
        {type === 'table' ? <MobileCardView /> : children}
      </div>
    </>
  );
};
```

### 🔴 **Priority 3: Admin Role System**

**Solution**: Comprehensive admin oversight
```typescript
// Enhanced admin permissions
export const ADMIN_PERMISSIONS = {
  // User Management
  users: {
    create: true,
    read: true,
    update: true,
    delete: true,
    assignRoles: true,
    viewAll: true,
  },
  
  // System Oversight
  system: {
    viewLogs: true,
    manageSettings: true,
    viewAnalytics: true,
    exportData: true,
    backupData: true,
  },
  
  // All Business Data
  clients: { create: true, read: true, update: true, delete: true, viewAll: true },
  cases: { create: true, read: true, update: true, delete: true, viewAll: true },
  documents: { create: true, read: true, update: true, delete: true, viewAll: true },
  invoices: { create: true, read: true, update: true, delete: true, viewAll: true },
  timeEntries: { create: true, read: true, update: true, delete: true, viewAll: true },
  
  // Financial Oversight
  financial: {
    viewAllInvoices: true,
    viewAllPayments: true,
    manageBilling: true,
    viewFinancialReports: true,
  }
};

// Admin dashboard component
const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Badge variant="default">ADMIN</Badge>
      </div>
      
      {/* System overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-sm text-muted-foreground">Korisnici</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalClients}</div>
            <div className="text-sm text-muted-foreground">Klijenti</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalCases}</div>
            <div className="text-sm text-muted-foreground">Predmeti</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} EUR</div>
            <div className="text-sm text-muted-foreground">Prihod</div>
          </div>
        </Card>
      </div>
      
      {/* User management */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upravljanje korisnicima</h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj korisnika
          </Button>
        </div>
        <UserManagementTable />
      </Card>
      
      {/* System logs */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Sistemski logovi</h3>
        <SystemLogsTable />
      </Card>
    </div>
  );
};
```

## Phase 2: Essential Features (Weeks 3-4)

### 🟡 **Priority 4: Built-in Calendar with External Connectivity**

**Solution**: Built-in calendar with external sync
```typescript
interface CalendarIntegration {
  builtIn: {
    events: CalendarEvent[];
    syncEnabled: boolean;
  };
  external: {
    googleCalendar: GoogleCalendarConfig;
    outlook: OutlookConfig;
    syncInterval: number;
  };
}

const BuiltInCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [externalSync, setExternalSync] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kalendar</h2>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj događaj
          </Button>
          <Button variant="outline" onClick={() => setExternalSync(!externalSync)}>
            <Sync className="h-4 w-4 mr-2" />
            {externalSync ? 'Sinkronizacija uključena' : 'Sinkronizacija isključena'}
          </Button>
        </div>
      </div>
      
      {/* External calendar settings */}
      {externalSync && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Vanjska sinkronizacija</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Google Calendar</Label>
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Poveži Google Calendar
              </Button>
            </div>
            <div>
              <Label>Outlook</Label>
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Poveži Outlook
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Calendar view */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'].map(day => (
            <div key={day} className="text-center font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {generateCalendarDays().map(day => (
            <div key={day.date.toISOString()} className="min-h-20 border rounded p-1">
              <div className="text-sm font-medium">{day.date.getDate()}</div>
              {day.events.map(event => (
                <div key={event.id} className={`text-xs rounded p-1 mb-1 ${
                  event.type === 'court_date' ? 'bg-red-100 text-red-800' :
                  event.type === 'deadline' ? 'bg-orange-100 text-orange-800' :
                  event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
      
      {/* Upcoming events */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Nadolazeći događaji</h3>
        <div className="space-y-2">
          {getUpcomingEvents(events, 7).map(event => (
            <div key={event.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(event.start)} • {getEventTypeLabel(event.type)}
                </div>
              </div>
              <Badge variant={getEventTypeVariant(event.type)}>
                {getEventTypeLabel(event.type)}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
```

### 🟡 **Priority 5: Croatian Law Contract Templates**

**Solution**: Croatian law compliant templates
```typescript
interface CroatianContractTemplate {
  id: string;
  name: string;
  croatianName: string;
  category: 'mandatory' | 'common' | 'commercial';
  description: string;
  content: string;
  variables: TemplateVariable[];
  legalRequirements: string[];
  isMandatory: boolean;
  logoUrl?: string;
}

// Croatian contract templates
const CROATIAN_CONTRACT_TEMPLATES: CroatianContractTemplate[] = [
  {
    id: 'ugovor-o-najmu',
    name: 'Rental Agreement',
    croatianName: 'Ugovor o najmu',
    category: 'mandatory',
    description: 'Ugovor o najmu nekretnine - obavezan u pisanom obliku',
    content: `
      UGOVOR O NAJMU
        
      Zaključen dana ${date} godine između:
      
      Najmodavac: ${landlordName}
      Adresa: ${landlordAddress}
      OIB: ${landlordOIB}
      
      Najmoprimac: ${tenantName}
      Adresa: ${tenantAddress}
      OIB: ${tenantOIB}
      
      Član 1. - PREDMET UGOVORA
      Najmodavac daje u najam, a najmoprimac prima u najam ${propertyDescription}.
      
      Član 2. - NAJAMNINA
      Najamna je ${rentAmount} EUR mjesečno, plaća se do ${paymentDay}. dana u mjesecu.
      
      Član 3. - TRAJANJE UGOVORA
      Ugovor se sklapa na period od ${contractDuration} mjeseci.
      
      Član 4. - RASKID UGOVORA
      Ugovor se može raskinuti uz ${noticePeriod} dana unaprijed.
      
      Potpisi:
      Najmodavac: _________________
      Najmoprimac: _________________
    `,
    variables: [
      { name: 'date', type: 'date', required: true },
      { name: 'landlordName', type: 'text', required: true },
      { name: 'landlordAddress', type: 'text', required: true },
      { name: 'landlordOIB', type: 'text', required: true },
      { name: 'tenantName', type: 'text', required: true },
      { name: 'tenantAddress', type: 'text', required: true },
      { name: 'tenantOIB', type: 'text', required: true },
      { name: 'propertyDescription', type: 'text', required: true },
      { name: 'rentAmount', type: 'number', required: true },
      { name: 'paymentDay', type: 'number', required: true },
      { name: 'contractDuration', type: 'number', required: true },
      { name: 'noticePeriod', type: 'number', required: true },
    ],
    legalRequirements: [
      'Obavezan u pisanom obliku prema hrvatskom zakonu',
      'Mora sadržavati identifikaciju stranaka',
      'Mora definirati predmet najma',
      'Mora definirati najamnu i način plaćanja',
      'Mora definirati trajanje ugovora',
    ],
    isMandatory: true,
  },
  {
    id: 'ugovor-o-radu',
    name: 'Employment Contract',
    croatianName: 'Ugovor o radu',
    category: 'common',
    description: 'Ugovor o radu - standardni ugovor za zapošljavanje',
    content: `
      UGOVOR O RADU
        
      Zaključen dana ${date} godine između:
      
      Poslodavac: ${employerName}
      Adresa: ${employerAddress}
      OIB: ${employerOIB}
      
      Zaposlenik: ${employeeName}
      Adresa: ${employeeAddress}
      OIB: ${employeeOIB}
      
      Član 1. - RADNO MJESTO
      Zaposlenik se zapošljava na radnom mjestu ${jobTitle}.
      
      Član 2. - PLAĆA
      Bruto plaća iznosi ${salary} EUR mjesečno.
      
      Član 3. - RADNO VRIJEME
      Radno vrijeme je ${workingHours} sati tjedno.
      
      Član 4. - TRAJANJE UGOVORA
      Ugovor se sklapa na ${contractType === 'indefinite' ? 'neodređeno vrijeme' : 'određeno vrijeme'}.
      
      Potpisi:
      Poslodavac: _________________
      Zaposlenik: _________________
    `,
    variables: [
      { name: 'date', type: 'date', required: true },
      { name: 'employerName', type: 'text', required: true },
      { name: 'employerAddress', type: 'text', required: true },
      { name: 'employerOIB', type: 'text', required: true },
      { name: 'employeeName', type: 'text', required: true },
      { name: 'employeeAddress', type: 'text', required: true },
      { name: 'employeeOIB', type: 'text', required: true },
      { name: 'jobTitle', type: 'text', required: true },
      { name: 'salary', type: 'number', required: true },
      { name: 'workingHours', type: 'number', required: true },
      { name: 'contractType', type: 'select', required: true, options: ['indefinite', 'definite'] },
    ],
    legalRequirements: [
      'Mora sadržavati identifikaciju stranaka',
      'Mora definirati radno mjesto',
      'Mora definirati plaću',
      'Mora definirati radno vrijeme',
      'Mora definirati trajanje ugovora',
    ],
    isMandatory: false,
  },
  // Add more Croatian contract templates...
];

const CroatianContractTemplates = () => {
  const [templates, setTemplates] = useState<CroatianContractTemplate[]>(CROATIAN_CONTRACT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Hrvatski pravni predlošci</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novi predložak
        </Button>
      </div>
      
      {/* Category filter */}
      <div className="flex gap-2">
        <Button 
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
        >
          Svi
        </Button>
        <Button 
          variant={selectedCategory === 'mandatory' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('mandatory')}
        >
          Obavezni
        </Button>
        <Button 
          variant={selectedCategory === 'common' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('common')}
        >
          Uobičajeni
        </Button>
        <Button 
          variant={selectedCategory === 'commercial' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('commercial')}
        >
          Trgovinski
        </Button>
      </div>
      
      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="p-4 cursor-pointer hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{template.croatianName}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant={template.isMandatory ? 'destructive' : 'outline'}>
                    {template.isMandatory ? 'Obavezan' : 'Opcionalan'}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {template.category}
                  </Badge>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    {template.legalRequirements.length} pravni zahtjevi
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => useTemplate(template)}>
                  Koristi
                </Button>
                <Button size="sm" variant="outline" onClick={() => editTemplate(template)}>
                  <Edit className="h-4 w-4" />
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

### 🟡 **Priority 6: Flexible Analytics Intervals**

**Solution**: Daily, weekly, monthly, yearly analytics
```typescript
interface AnalyticsInterval {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  label: string;
  dateRange: {
    from: Date;
    to: Date;
  };
}

const FlexibleAnalytics = () => {
  const [interval, setInterval] = useState<AnalyticsInterval['type']>('monthly');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });
  
  const { data: analytics } = useSWR(`/api/analytics/${interval}?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`);
  
  const getIntervalLabel = (type: AnalyticsInterval['type']) => {
    switch (type) {
      case 'daily': return 'Dnevno';
      case 'weekly': return 'Tjedno';
      case 'monthly': return 'Mjesečno';
      case 'yearly': return 'Godišnje';
    }
  };
  
  const getDateRangeLabel = () => {
    switch (interval) {
      case 'daily':
        return formatDate(dateRange.from);
      case 'weekly':
        return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
      case 'monthly':
        return format(dateRange.from, 'MMMM yyyy', { locale: hr });
      case 'yearly':
        return format(dateRange.from, 'yyyy');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analitika</h2>
        <div className="flex gap-2">
          <Select value={interval} onValueChange={(value) => setInterval(value as AnalyticsInterval['type'])}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Dnevno</SelectItem>
              <SelectItem value="weekly">Tjedno</SelectItem>
              <SelectItem value="monthly">Mjesečno</SelectItem>
              <SelectItem value="yearly">Godišnje</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => exportAnalytics(interval, dateRange)}>
            <Download className="h-4 w-4 mr-2" />
            Izvezi
          </Button>
        </div>
      </div>
      
      {/* Date range selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div>
            <Label>Period</Label>
            <div className="text-lg font-semibold">{getDateRangeLabel()}</div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDateRange(getPreviousPeriod(interval, dateRange))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDateRange(getNextPeriod(interval, dateRange))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Analytics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics?.totalClients || 0}</div>
            <div className="text-sm text-muted-foreground">Klijenti</div>
            <div className="text-xs text-muted-foreground">
              {analytics?.clientsChange > 0 ? '+' : ''}{analytics?.clientsChange || 0}%
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics?.totalCases || 0}</div>
            <div className="text-sm text-muted-foreground">Predmeti</div>
            <div className="text-xs text-muted-foreground">
              {analytics?.casesChange > 0 ? '+' : ''}{analytics?.casesChange || 0}%
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics?.totalRevenue?.toFixed(2) || '0.00'} EUR</div>
            <div className="text-sm text-muted-foreground">Prihod</div>
            <div className="text-xs text-muted-foreground">
              {analytics?.revenueChange > 0 ? '+' : ''}{analytics?.revenueChange || 0}%
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics?.totalHours || 0}h</div>
            <div className="text-sm text-muted-foreground">Sati</div>
            <div className="text-xs text-muted-foreground">
              {analytics?.hoursChange > 0 ? '+' : ''}{analytics?.hoursChange || 0}%
            </div>
          </div>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Trend prihoda</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.revenueTrend || []}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Distribucija predmeta</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.caseDistribution || []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
              >
                {(analytics?.caseDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
```

## Phase 3: Polish & Performance (Weeks 5-6)

### 🟢 **Priority 7: Performance Optimization**

**Solution**: Smooth operation across all devices
```typescript
// Implement comprehensive performance optimizations
const PerformanceOptimizations = {
  // Virtual scrolling for large lists
  virtualScrolling: true,
  
  // Data caching with SWR
  dataCaching: {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  },
  
  // Lazy loading
  lazyLoading: {
    images: true,
    components: true,
    routes: true,
  },
  
  // Code splitting
  codeSplitting: {
    routes: true,
    components: true,
    libraries: true,
  },
  
  // Bundle optimization
  bundleOptimization: {
    treeShaking: true,
    minification: true,
    compression: true,
  }
};
```

### 🟢 **Priority 8: Logo Upload for Templates**

**Solution**: Basic customization with logo upload
```typescript
const LogoUploadForTemplates = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const [templateSettings, setTemplateSettings] = useState({
    logoPosition: 'top-left',
    logoSize: 'medium',
    includeLogo: true,
  });

  const handleLogoUpload = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Greška',
        description: 'Molimo odaberite sliku',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'Greška',
        description: 'Slika je prevelika. Maksimalna veličina je 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Upload logo
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const { logoUrl } = await response.json();
        setLogo(logoUrl);
        toast({
          title: 'Uspjeh',
          description: 'Logo je uspješno uploadan',
        });
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Greška pri uploadu loga',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Prilagodba predložaka</h2>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Logo postavke</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Upload logo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
            />
            <p className="text-sm text-muted-foreground">
              Preporučena veličina: 200x100px, format: PNG/JPG, maksimalno 5MB
            </p>
          </div>
          
          {logo && (
            <div className="border rounded p-4">
              <img src={logo} alt="Logo" className="h-20 w-auto" />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pozicija loga</Label>
              <Select
                value={templateSettings.logoPosition}
                onValueChange={(value) => setTemplateSettings(prev => ({ ...prev, logoPosition: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Gore lijevo</SelectItem>
                  <SelectItem value="top-center">Gore centar</SelectItem>
                  <SelectItem value="top-right">Gore desno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Veličina loga</Label>
              <Select
                value={templateSettings.logoSize}
                onValueChange={(value) => setTemplateSettings(prev => ({ ...prev, logoSize: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Mala (100x50px)</SelectItem>
                  <SelectItem value="medium">Srednja (200x100px)</SelectItem>
                  <SelectItem value="large">Velika (300x150px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeLogo"
              checked={templateSettings.includeLogo}
              onCheckedChange={(checked) => setTemplateSettings(prev => ({ ...prev, includeLogo: !!checked }))}
            />
            <Label htmlFor="includeLogo">Uključi logo u predloške</Label>
          </div>
        </div>
      </Card>
    </div>
  );
};
```

## Implementation Timeline

### Week 1-2: Critical Fixes
- [ ] Fix 404 errors on all pages
- [ ] Implement mobile responsiveness for all sections
- [ ] Set up comprehensive Admin role system
- [ ] Test all functionality on mobile devices

### Week 3-4: Essential Features
- [ ] Implement built-in calendar with external connectivity
- [ ] Create Croatian law compliant contract templates
- [ ] Build flexible analytics (daily/weekly/monthly/yearly)
- [ ] Add logo upload functionality

### Week 5-6: Polish & Performance
- [ ] Optimize performance across all devices
- [ ] Implement data caching and lazy loading
- [ ] Add virtual scrolling for large lists
- [ ] Final testing and bug fixes

## Technical Requirements

### Dependencies to Add
```json
{
  "react-window": "^1.8.8",
  "swr": "^2.2.4",
  "date-fns": "^2.30.0",
  "react-calendar": "^4.6.0",
  "recharts": "^2.8.0"
}
```

### API Endpoints to Create
- `/api/analytics/daily` - Daily analytics
- `/api/analytics/weekly` - Weekly analytics
- `/api/analytics/monthly` - Monthly analytics
- `/api/analytics/yearly` - Yearly analytics
- `/api/calendar/events` - Calendar events management
- `/api/calendar/sync` - External calendar sync
- `/api/templates/croatian-contracts` - Croatian contract templates
- `/api/upload/logo` - Logo upload
- `/api/admin/users` - Admin user management
- `/api/admin/system` - Admin system management

### Database Changes
- Add `role` field to User table
- Create `calendar_events` table
- Create `croatian_contract_templates` table
- Create `template_settings` table
- Create `admin_logs` table

## Success Metrics

### Phase 1 Success Criteria
- ✅ All pages load without errors
- ✅ Mobile responsiveness score > 90%
- ✅ Admin role system working correctly
- ✅ Touch targets minimum 44px

### Phase 2 Success Criteria
- ✅ Built-in calendar with external sync working
- ✅ Croatian contract templates functional
- ✅ Flexible analytics displaying correctly
- ✅ Logo upload working

### Phase 3 Success Criteria
- ✅ Page load times < 2 seconds
- ✅ Smooth scrolling on all devices
- ✅ No performance issues
- ✅ All features working on mobile

This updated plan incorporates Croatian law requirements, flexible analytics intervals, built-in calendar with external connectivity, and comprehensive admin oversight as requested.

