# Prioritized Implementation Plan - iLegal Dashboard Improvements

## Executive Summary

Based on your requirements, this plan prioritizes mobile responsiveness, user role management, calendar integration, and essential automation features. The implementation is divided into 3 phases with clear deliverables and timelines.

## Your Key Requirements

1. **Mobile Responsive** - High Priority
2. **User Roles** - Admin (oversees all accounts) + Basic user
3. **Calendar Integration** - Must have with deadlines
4. **Contract Templates** - For different cases
5. **Analytics** - Upcoming meetings/court dates, unsettled bills
6. **Performance** - Smooth operation
7. **Customization** - Basic: logo upload for templates

## Phase 1: Critical Fixes (Weeks 1-2)

### 🔴 **Priority 1: Fix Page Loading Issues**

**Problem**: Documents, Time Tracking, and Invoices pages returning 404 errors

**Solution**:
```typescript
// Check and fix API routes
// Ensure all pages are properly exported
// Fix any missing dependencies

// Files to check:
- app/dashboard/documents/page.tsx
- app/dashboard/time-tracking/page.tsx  
- app/dashboard/invoices/page.tsx
- app/api/documents/route.ts
- app/api/time-entries/route.ts
- app/api/invoices/route.ts
```

**Deliverable**: All pages load without errors

### 🔴 **Priority 2: Mobile Responsiveness**

**Problem**: Tables become horizontal scrollable, small touch targets

**Solution**: Implement mobile-first design for all sections

#### Dashboard Mobile Fixes
```typescript
// Replace table with card layout on mobile
const MobileDashboard = () => {
  return (
    <div className="block md:hidden">
      <div className="space-y-4">
        {/* Statistics cards - optimized for mobile */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-muted-foreground">Aktivni klijenti</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-muted-foreground">Otvoreni predmeti</div>
            </div>
          </Card>
        </div>
        
        {/* Recent activities - simplified for mobile */}
        <Card className="p-3">
          <h3 className="font-semibold mb-2">Nedavne aktivnosti</h3>
          <div className="text-center py-4 text-muted-foreground">
            Još nema aktivnosti
          </div>
        </Card>
      </div>
    </div>
  );
};
```

#### Clients Mobile Fixes
```typescript
// Replace table with card layout
const MobileClientList = ({ clients }: { clients: Client[] }) => {
  return (
    <div className="block md:hidden space-y-3">
      {clients.map(client => (
        <Card key={client.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{getClientName(client)}</h3>
              <p className="text-sm text-muted-foreground">{client.clientType}</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm">{client.email}</p>
                <p className="text-sm">{client.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

**Deliverable**: All sections work smoothly on mobile devices

### 🔴 **Priority 3: User Role System**

**Problem**: No role-based access control

**Solution**: Implement Admin and Basic user roles

```typescript
// Add to lib/permissions.ts
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  BASIC: 'BASIC'
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    // Admin can do everything
    clients: ['create', 'read', 'update', 'delete'],
    cases: ['create', 'read', 'update', 'delete'],
    documents: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update', 'delete'],
    timeEntries: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    analytics: ['read'],
  },
  [USER_ROLES.BASIC]: {
    // Basic user has limited access
    clients: ['read', 'update'], // Can't delete clients
    cases: ['read', 'update'], // Can't delete cases
    documents: ['create', 'read', 'update'], // Can't delete documents
    invoices: ['read'], // Can only view invoices
    timeEntries: ['create', 'read', 'update'], // Can't delete time entries
    users: [], // No user management
    settings: ['read'], // Can only view settings
    analytics: ['read'], // Can view analytics
  }
};

// Update components to use role-based permissions
const PermissionGuard = ({ permission, children, userRole }: {
  permission: string;
  children: React.ReactNode;
  userRole: string;
}) => {
  const hasPermission = checkPermission(permission, userRole);
  return hasPermission ? <>{children}</> : null;
};
```

**Deliverable**: Admin and Basic user roles implemented with proper access control

## Phase 2: Essential Features (Weeks 3-4)

### 🟡 **Priority 4: Calendar Integration with Deadlines**

**Problem**: No calendar integration for deadlines and meetings

**Solution**: Implement calendar with deadline tracking

```typescript
// Add calendar integration
interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'court_date' | 'deadline' | 'hearing';
  caseId?: string;
  clientId?: string;
  isAllDay: boolean;
  reminder: number; // minutes before
}

// Calendar component
const CalendarIntegration = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kalendar</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj događaj
        </Button>
      </div>
      
      {/* Calendar view */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'].map(day => (
            <div key={day} className="text-center font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {generateCalendarDays().map(day => (
            <div key={day.date.toISOString()} className="min-h-20 border rounded p-1">
              <div className="text-sm font-medium">{day.date.getDate()}</div>
              {day.events.map(event => (
                <div key={event.id} className="text-xs bg-blue-100 rounded p-1 mb-1">
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
                  {formatDate(event.start)} • {event.type}
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

**Deliverable**: Calendar with deadline tracking and upcoming events

### 🟡 **Priority 5: Contract Templates System**

**Problem**: No template system for different case types

**Solution**: Implement contract templates with logo customization

```typescript
interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ugovor' | 'tužba' | 'odluka' | 'presuda' | 'ostalo';
  content: string; // HTML content
  variables: TemplateVariable[];
  logoUrl?: string;
  isDefault: boolean;
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'client' | 'case';
  required: boolean;
  defaultValue?: string;
}

const ContractTemplates = () => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Predlošci dokumenata</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novi predložak
        </Button>
      </div>
      
      {/* Template categories */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['ugovor', 'tužba', 'odluka', 'presuda', 'ostalo'].map(category => (
          <Card key={category} className="p-4 text-center cursor-pointer hover:shadow-md">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-medium capitalize">{category}</h3>
            <p className="text-sm text-muted-foreground">
              {templates.filter(t => t.category === category).length} predložaka
            </p>
          </Card>
        ))}
      </div>
      
      {/* Template list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-4 cursor-pointer hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <div className="mt-2">
                  <Badge variant="outline" className="capitalize">
                    {template.category}
                  </Badge>
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

// Logo upload component
const LogoUpload = ({ onLogoUpload }: { onLogoUpload: (logoUrl: string) => void }) => {
  const [logo, setLogo] = useState<string | null>(null);
  
  const handleFileUpload = async (file: File) => {
    // Upload logo to storage
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await fetch('/api/upload/logo', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const { logoUrl } = await response.json();
      setLogo(logoUrl);
      onLogoUpload(logoUrl);
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label>Logo za predloške</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
      </div>
      
      {logo && (
        <div className="border rounded p-4">
          <img src={logo} alt="Logo" className="h-20 w-auto" />
        </div>
      )}
    </div>
  );
};
```

**Deliverable**: Contract templates system with logo customization

### 🟡 **Priority 6: Essential Analytics**

**Problem**: No analytics for upcoming meetings and unsettled bills

**Solution**: Implement key analytics dashboard

```typescript
interface EssentialAnalytics {
  upcomingMeetings: {
    total: number;
    thisWeek: number;
    nextWeek: number;
    overdue: number;
  };
  unsettledBills: {
    total: number;
    totalAmount: number;
    overdue: number;
    overdueAmount: number;
  };
  caseDeadlines: {
    total: number;
    thisWeek: number;
    nextWeek: number;
    overdue: number;
  };
}

const EssentialAnalytics = () => {
  const { data: analytics } = useSWR('/api/analytics/essential');
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ključni pokazatelji</h2>
      
      {/* Upcoming meetings */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Nadolazeći sastanci</h3>
          <Badge variant="outline">{analytics?.upcomingMeetings.total}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.upcomingMeetings.thisWeek}
            </div>
            <div className="text-sm text-muted-foreground">Ovaj tjedan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics?.upcomingMeetings.nextWeek}
            </div>
            <div className="text-sm text-muted-foreground">Sljedeći tjedan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {analytics?.upcomingMeetings.overdue}
            </div>
            <div className="text-sm text-muted-foreground">Dospjelo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {analytics?.upcomingMeetings.total}
            </div>
            <div className="text-sm text-muted-foreground">Ukupno</div>
          </div>
        </div>
      </Card>
      
      {/* Unsettled bills */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Neplaćeni računi</h3>
          <Badge variant="outline">{analytics?.unsettledBills.total}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {analytics?.unsettledBills.overdue}
            </div>
            <div className="text-sm text-muted-foreground">Dospjelo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {analytics?.unsettledBills.total - analytics?.unsettledBills.overdue}
            </div>
            <div className="text-sm text-muted-foreground">Neplaćeno</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {analytics?.unsettledBills.overdueAmount.toFixed(2)} EUR
            </div>
            <div className="text-sm text-muted-foreground">Dospjelo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {analytics?.unsettledBills.totalAmount.toFixed(2)} EUR
            </div>
            <div className="text-sm text-muted-foreground">Ukupno</div>
          </div>
        </div>
      </Card>
      
      {/* Case deadlines */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Rokovi predmeta</h3>
          <Badge variant="outline">{analytics?.caseDeadlines.total}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.caseDeadlines.thisWeek}
            </div>
            <div className="text-sm text-muted-foreground">Ovaj tjedan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics?.caseDeadlines.nextWeek}
            </div>
            <div className="text-sm text-muted-foreground">Sljedeći tjedan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {analytics?.caseDeadlines.overdue}
            </div>
            <div className="text-sm text-muted-foreground">Dospjelo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {analytics?.caseDeadlines.total}
            </div>
            <div className="text-sm text-muted-foreground">Ukupno</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
```

**Deliverable**: Essential analytics dashboard with key metrics

## Phase 3: Polish & Performance (Weeks 5-6)

### 🟢 **Priority 7: Performance Optimization**

**Problem**: Need smooth operation across all devices

**Solution**: Implement performance optimizations

```typescript
// Implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items, renderItem }: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={120}
    >
      {Row}
    </List>
  );
};

// Implement data caching
import useSWR from 'swr';

const useCachedData = (endpoint: string) => {
  return useSWR(endpoint, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    dedupingInterval: 5000, // Dedupe requests within 5 seconds
  });
};

// Implement lazy loading
const LazyComponent = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? children : <div className="h-32 bg-gray-100 animate-pulse rounded" />}
    </div>
  );
};
```

**Deliverable**: Smooth performance across all devices

### 🟢 **Priority 8: Basic Customization**

**Problem**: Need basic customization (logo upload for templates)

**Solution**: Implement logo upload and template customization

```typescript
// Logo upload for templates
const TemplateCustomization = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const [templateSettings, setTemplateSettings] = useState({
    logoPosition: 'top-left',
    logoSize: 'medium',
    includeLogo: true,
  });

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
              onChange={handleLogoUpload}
            />
            <p className="text-sm text-muted-foreground">
              Preporučena veličina: 200x100px, format: PNG/JPG
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
                  <SelectItem value="small">Mala</SelectItem>
                  <SelectItem value="medium">Srednja</SelectItem>
                  <SelectItem value="large">Velika</SelectItem>
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

**Deliverable**: Basic customization with logo upload for templates

## Implementation Timeline

### Week 1-2: Critical Fixes
- [ ] Fix 404 errors on all pages
- [ ] Implement mobile responsiveness for all sections
- [ ] Set up Admin/Basic user role system
- [ ] Test all functionality on mobile devices

### Week 3-4: Essential Features
- [ ] Implement calendar integration with deadlines
- [ ] Create contract templates system
- [ ] Build essential analytics dashboard
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
  "react-calendar": "^4.6.0"
}
```

### API Endpoints to Create
- `/api/analytics/essential` - Essential analytics data
- `/api/calendar/events` - Calendar events management
- `/api/templates/contracts` - Contract templates
- `/api/upload/logo` - Logo upload
- `/api/users/roles` - User role management

### Database Changes
- Add `role` field to User table
- Create `calendar_events` table
- Create `contract_templates` table
- Create `template_settings` table

## Success Metrics

### Phase 1 Success Criteria
- ✅ All pages load without errors
- ✅ Mobile responsiveness score > 90%
- ✅ User roles working correctly
- ✅ Touch targets minimum 44px

### Phase 2 Success Criteria
- ✅ Calendar integration working
- ✅ Contract templates functional
- ✅ Essential analytics displaying
- ✅ Logo upload working

### Phase 3 Success Criteria
- ✅ Page load times < 2 seconds
- ✅ Smooth scrolling on all devices
- ✅ No performance issues
- ✅ All features working on mobile

## Questions for Clarification

1. **Calendar Integration**: Which calendar provider would you prefer (Google Calendar, Outlook, or built-in)?

2. **Contract Templates**: What specific contract types are most important for your practice?

3. **Analytics Frequency**: How often should analytics data be refreshed (real-time, hourly, daily)?

4. **Logo Requirements**: Any specific requirements for logo format, size, or positioning?

5. **User Role Transition**: How should existing users be assigned to Admin/Basic roles?

6. **Mobile Priority**: Should mobile development be done first, or can it be parallel with desktop fixes?

This plan prioritizes your most critical needs while building a solid foundation for future enhancements. Each phase has clear deliverables and success criteria to ensure we meet your requirements effectively.

