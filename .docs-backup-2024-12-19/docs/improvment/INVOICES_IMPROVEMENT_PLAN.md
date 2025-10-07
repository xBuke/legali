# Invoices (Računi) Improvement Plan

## Current State Analysis

### What Works Well
- Clean interface with good statistics display
- Comprehensive invoice creation form
- Good client association
- Proper status management
- PDF generation functionality
- Payment tracking integration

### Issues Identified

#### Desktop (1920x1080)
- **Good**: Layout is well-spaced and readable
- **Issue**: Could benefit from more detailed invoice management features
- **Issue**: No invoice templates or automation
- **Issue**: Limited invoice analytics and reporting

#### Tablet (768x1024)
- **Good**: Form adapts well to tablet size
- **Issue**: Statistics cards could be better optimized
- **Issue**: Table could be more touch-friendly

#### Mobile (375x667)
- **Issue**: Form becomes cramped on mobile
- **Issue**: Statistics cards stack but could be optimized
- **Issue**: Table is not mobile-friendly

## Comprehensive Improvement Plan

### 1. Enhanced Invoice Management Interface

#### Current Problems
- Basic invoice creation form only
- No invoice templates
- Limited invoice management options
- No bulk operations
- No invoice automation

#### Proposed Solutions

**A. Invoice Templates System**
```typescript
interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  templateType: 'standard' | 'hourly' | 'fixed' | 'retainer';
  items: InvoiceTemplateItem[];
  terms: string;
  notes: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceTemplateItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  isRequired: boolean;
  category: string;
}

const InvoiceTemplates = () => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Predlošci računa</h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novi predložak
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-4 cursor-pointer hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{template.templateType}</Badge>
                  {template.isDefault && <Badge variant="default">Zadani</Badge>}
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

**B. Advanced Invoice Creation**
```typescript
interface InvoiceCreation {
  clientId: string;
  templateId?: string;
  items: InvoiceItem[];
  terms: string;
  notes: string;
  dueDate: Date;
  issueDate: Date;
  taxRate: number;
  discount: number;
  paymentTerms: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  category: string;
  caseId?: string;
  timeEntryId?: string;
}

const AdvancedInvoiceCreation = () => {
  const [invoice, setInvoice] = useState<InvoiceCreation>({
    clientId: '',
    items: [],
    terms: '',
    notes: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    issueDate: new Date(),
    taxRate: 25, // Croatian VAT rate
    discount: 0,
    paymentTerms: '30 dana',
  });

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, {
        id: generateId(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: prev.taxRate,
        total: 0,
        category: 'Usluga',
        caseId: undefined,
        timeEntryId: undefined,
      }]
    }));
  };

  const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, ...updates, total: (updates.quantity || item.quantity) * (updates.unitPrice || item.unitPrice) }
          : item
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client">Klijent</Label>
          <Select value={invoice.clientId} onValueChange={(value) => 
            setInvoice(prev => ({ ...prev, clientId: value }))
          }>
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
        </div>
        
        <div>
          <Label htmlFor="template">Predložak</Label>
          <Select value={invoice.templateId || ''} onValueChange={(value) => 
            setInvoice(prev => ({ ...prev, templateId: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Odaberite predložak (opcionalno)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Bez predloška</SelectItem>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Stavke računa</h3>
          <Button onClick={addItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Dodaj stavku
          </Button>
        </div>
        
        <div className="space-y-4">
          {invoice.items.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <Label>Opis</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder="Opis usluge"
                  />
                </div>
                <div>
                  <Label>Količina</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Cijena</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>PDV %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.taxRate}
                    onChange={(e) => updateItem(item.id, { taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex-1">
                    <Label>Ukupno</Label>
                    <div className="text-lg font-semibold">
                      {item.total.toFixed(2)} EUR
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInvoice(prev => ({
                      ...prev,
                      items: prev.items.filter(i => i.id !== item.id)
                    }))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="terms">Uvjeti plaćanja</Label>
          <Textarea
            id="terms"
            value={invoice.terms}
            onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
            placeholder="Uvjeti plaćanja..."
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="notes">Napomene</Label>
          <Textarea
            id="notes"
            value={invoice.notes}
            onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Dodatne napomene..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
```

### 2. Enhanced Invoice Analytics

#### Current Problems
- Basic statistics only
- No trend analysis
- No payment analytics
- No client payment behavior insights
- No revenue forecasting

#### Proposed Solutions

**A. Advanced Analytics Dashboard**
```typescript
interface InvoiceAnalytics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  averagePaymentTime: number;
  paymentRate: number;
  monthlyTrends: MonthlyTrend[];
  clientAnalytics: ClientPaymentAnalytics[];
  categoryAnalytics: CategoryAnalytics[];
}

interface MonthlyTrend {
  month: string;
  invoices: number;
  amount: number;
  paid: number;
  outstanding: number;
}

const InvoiceAnalytics = () => {
  const { data: analytics } = useSWR('/api/invoices/analytics');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ukupno računa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.totalInvoices}</div>
          <p className="text-xs text-muted-foreground">
            {analytics?.totalAmount.toFixed(2)} EUR
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Plaćeno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {analytics?.paidAmount.toFixed(2)} EUR
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics?.paymentRate.toFixed(1)}% stopa plaćanja
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Neplaćeno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {analytics?.outstandingAmount.toFixed(2)} EUR
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics?.overdueAmount.toFixed(2)} EUR dospjelo
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Prosječno vrijeme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics?.averagePaymentTime.toFixed(0)} dana
          </div>
          <p className="text-xs text-muted-foreground">
            Prosječno vrijeme plaćanja
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

**B. Invoice Charts**
```typescript
const InvoiceCharts = () => {
  const { data: analytics } = useSWR('/api/invoices/analytics');
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Mjesečni trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.monthlyTrends}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Ukupno" />
              <Line type="monotone" dataKey="paid" stroke="#82ca9d" name="Plaćeno" />
              <Line type="monotone" dataKey="outstanding" stroke="#ffc658" name="Neplaćeno" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Status računa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Plaćeno', value: analytics?.paidAmount, color: '#82ca9d' },
                  { name: 'Neplaćeno', value: analytics?.outstandingAmount, color: '#ffc658' },
                  { name: 'Dospjelo', value: analytics?.overdueAmount, color: '#ff7300' },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
              >
                {[
                  { name: 'Plaćeno', value: analytics?.paidAmount, color: '#82ca9d' },
                  { name: 'Neplaćeno', value: analytics?.outstandingAmount, color: '#ffc658' },
                  { name: 'Dospjelo', value: analytics?.overdueAmount, color: '#ff7300' },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
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
- No mobile-specific invoice features

#### Proposed Solutions

**A. Mobile-Optimized Invoice Creation**
```typescript
const MobileInvoiceCreation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['Klijent', 'Stavke', 'Detalji', 'Pregled'];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Novi račun</h2>
        <div className="text-sm text-muted-foreground">
          {currentStep + 1} od {steps.length}
        </div>
      </div>
      
      <div className="flex space-x-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`flex-1 h-2 rounded ${
              index <= currentStep ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      
      <div className="space-y-4">
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Odaberite klijenta</h3>
            <div className="space-y-2">
              {clients.map(client => (
                <Card key={client.id} className="p-4 cursor-pointer hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{getClientName(client)}</h4>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setInvoice(prev => ({ ...prev, clientId: client.id }));
                        setCurrentStep(1);
                      }}
                    >
                      Odaberi
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dodajte stavke</h3>
            <div className="space-y-4">
              {invoice.items.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Opis usluge"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Količina"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                      />
                      <Input
                        type="number"
                        placeholder="Cijena"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {item.total.toFixed(2)} EUR
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInvoice(prev => ({
                          ...prev,
                          items: prev.items.filter(i => i.id !== item.id)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button onClick={addItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Dodaj stavku
              </Button>
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalji računa</h3>
            <div className="space-y-4">
              <div>
                <Label>Datum dospijeća</Label>
                <Input
                  type="date"
                  value={invoice.dueDate.toISOString().split('T')[0]}
                  onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Uvjeti plaćanja</Label>
                <Textarea
                  value={invoice.terms}
                  onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Uvjeti plaćanja..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Napomene</Label>
                <Textarea
                  value={invoice.notes}
                  onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Dodatne napomene..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pregled računa</h3>
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Klijent:</span>
                  <span className="font-medium">{getClientName(selectedClient)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Datum dospijeća:</span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Broj stavki:</span>
                  <span className="font-medium">{invoice.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ukupno:</span>
                  <span className="font-medium text-lg">
                    {invoice.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)} EUR
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="flex-1"
          >
            Nazad
          </Button>
        )}
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="flex-1"
          >
            Dalje
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="flex-1"
          >
            Stvori račun
          </Button>
        )}
      </div>
    </div>
  );
};
```

**B. Mobile Invoice List**
```typescript
const MobileInvoiceList = ({ invoices }: { invoices: Invoice[] }) => {
  return (
    <div className="space-y-4">
      {invoices.map(invoice => (
        <Card key={invoice.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
              <p className="text-sm text-muted-foreground">
                {getClientName(invoice.client)}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Dospijeće: {formatDate(invoice.dueDate)}</span>
                <span>{invoice.total.toFixed(2)} EUR</span>
              </div>
              <div className="mt-2">
                {getStatusBadge(invoice.status)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleView(invoice)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(invoice)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

### 4. Advanced Invoice Features

#### A. Invoice Automation
```typescript
interface InvoiceAutomation {
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

// Example: Auto-create invoice from time entries
const AutoCreateInvoiceFromTimeEntries = () => {
  const [rule, setRule] = useState<AutomationRule>({
    id: 'auto-invoice-time-entries',
    name: 'Automatski račun iz unosa vremena',
    conditions: [
      { field: 'timeEntries.billable', operator: 'equals', value: true },
      { field: 'timeEntries.status', operator: 'equals', value: 'approved' },
      { field: 'timeEntries.date', operator: 'greater_than', value: '30 days ago' },
    ],
    actions: [
      { type: 'create_invoice', params: { template: 'hourly', client: 'auto' } },
      { type: 'send_notification', params: { type: 'email', recipient: 'client' } },
    ],
    isActive: false,
  });
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{rule.name}</h3>
          <p className="text-sm text-muted-foreground">
            Automatski stvori račun iz odobrenih unosa vremena
          </p>
        </div>
        <Switch
          checked={rule.isActive}
          onCheckedChange={(checked) => setRule(prev => ({ ...prev, isActive: checked }))}
        />
      </div>
    </Card>
  );
};
```

#### B. Payment Reminders
```typescript
interface PaymentReminder {
  id: string;
  invoiceId: string;
  type: 'email' | 'sms' | 'letter';
  scheduledDate: Date;
  sentDate?: Date;
  status: 'scheduled' | 'sent' | 'failed';
  template: string;
  recipient: string;
}

const PaymentReminders = () => {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Podsjetnici za plaćanje</h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novi podsjetnik
        </Button>
      </div>
      
      <div className="space-y-2">
        {reminders.map(reminder => (
          <Card key={reminder.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium">Račun {reminder.invoiceId}</h4>
                <p className="text-sm text-muted-foreground">
                  {reminder.type} • {formatDate(reminder.scheduledDate)}
                </p>
                <div className="mt-1">
                  <Badge variant={reminder.status === 'sent' ? 'default' : 'secondary'}>
                    {reminder.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4" />
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

#### C. Invoice Approval Workflow
```typescript
interface InvoiceApprovalWorkflow {
  id: string;
  name: string;
  steps: ApprovalStep[];
  isActive: boolean;
}

interface ApprovalStep {
  id: string;
  name: string;
  approver: string;
  order: number;
  isRequired: boolean;
  timeout?: number;
}

const InvoiceApprovalWorkflow = () => {
  const [workflow, setWorkflow] = useState<InvoiceApprovalWorkflow>({
    id: 'default-approval',
    name: 'Zadani workflow odobravanja',
    steps: [
      {
        id: 'manager-approval',
        name: 'Odobravanje menadžera',
        approver: 'manager',
        order: 1,
        isRequired: true,
        timeout: 48, // 48 hours
      },
      {
        id: 'accounting-approval',
        name: 'Odobravanje računovodstva',
        approver: 'accounting',
        order: 2,
        isRequired: true,
        timeout: 24,
      },
    ],
    isActive: true,
  });
  
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Workflow odobravanja</h3>
          <Switch
            checked={workflow.isActive}
            onCheckedChange={(checked) => setWorkflow(prev => ({ ...prev, isActive: checked }))}
          />
        </div>
        
        <div className="space-y-2">
          {workflow.steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3 p-3 border rounded">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                {step.order}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{step.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {step.approver} • {step.timeout}h timeout
                </p>
              </div>
              <Badge variant={step.isRequired ? 'default' : 'secondary'}>
                {step.isRequired ? 'Obavezno' : 'Opcionalno'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
```

### 5. Integration Features

#### A. Accounting System Integration
```typescript
interface AccountingIntegration {
  provider: 'quickbooks' | 'xero' | 'sage' | 'custom';
  syncEnabled: boolean;
  syncInterval: number;
  autoSync: boolean;
  mapping: FieldMapping[];
}

interface FieldMapping {
  localField: string;
  externalField: string;
  isRequired: boolean;
}

const AccountingIntegration = () => {
  const [integration, setIntegration] = useState<AccountingIntegration>({
    provider: 'quickbooks',
    syncEnabled: false,
    syncInterval: 60,
    autoSync: false,
    mapping: [],
  });
  
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Integracija s računovodstvom</h3>
            <p className="text-sm text-muted-foreground">
              Sinkroniziraj račune s {integration.provider}
            </p>
          </div>
          <Switch
            checked={integration.syncEnabled}
            onCheckedChange={(checked) => setIntegration(prev => ({ ...prev, syncEnabled: checked }))}
          />
        </div>
        
        {integration.syncEnabled && (
          <div className="space-y-4">
            <div>
              <Label>Provider</Label>
              <Select value={integration.provider} onValueChange={(value) => 
                setIntegration(prev => ({ ...prev, provider: value as any }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quickbooks">QuickBooks</SelectItem>
                  <SelectItem value="xero">Xero</SelectItem>
                  <SelectItem value="sage">Sage</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Interval sinkronizacije (minute)</Label>
              <Input
                type="number"
                min="5"
                value={integration.syncInterval}
                onChange={(e) => setIntegration(prev => ({ ...prev, syncInterval: parseInt(e.target.value) || 60 }))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoSync"
                checked={integration.autoSync}
                onCheckedChange={(checked) => setIntegration(prev => ({ ...prev, autoSync: !!checked }))}
              />
              <Label htmlFor="autoSync">Automatska sinkronizacija</Label>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
```

#### B. Payment Gateway Integration
```typescript
interface PaymentGatewayIntegration {
  provider: 'stripe' | 'paypal' | 'bank_transfer' | 'custom';
  isActive: boolean;
  config: any;
  webhooks: WebhookConfig[];
}

interface WebhookConfig {
  event: string;
  url: string;
  isActive: boolean;
}

const PaymentGatewayIntegration = () => {
  const [gateway, setGateway] = useState<PaymentGatewayIntegration>({
    provider: 'stripe',
    isActive: false,
    config: {},
    webhooks: [],
  });
  
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Integracija s platnim sustavom</h3>
            <p className="text-sm text-muted-foreground">
              Omogući online plaćanje računa
            </p>
          </div>
          <Switch
            checked={gateway.isActive}
            onCheckedChange={(checked) => setGateway(prev => ({ ...prev, isActive: checked }))}
          />
        </div>
        
        {gateway.isActive && (
          <div className="space-y-4">
            <div>
              <Label>Provider</Label>
              <Select value={gateway.provider} onValueChange={(value) => 
                setGateway(prev => ({ ...prev, provider: value as any }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {gateway.provider === 'stripe' && (
              <div className="space-y-2">
                <Label>Stripe API Key</Label>
                <Input
                  type="password"
                  placeholder="sk_test_..."
                  value={gateway.config.apiKey || ''}
                  onChange={(e) => setGateway(prev => ({
                    ...prev,
                    config: { ...prev.config, apiKey: e.target.value }
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
```

## 🎉 IMPLEMENTATION STATUS: PHASE 1 PARTIALLY COMPLETE!

### ✅ **COMPLETED FEATURES (Phase 1)**

#### 1. Mobile Responsiveness ✅
- **Status**: COMPLETED
- **Implementation**: Enhanced mobile responsiveness with card layout
- **Details**: 
  - Mobile-optimized card layout with touch-friendly buttons (44px minimum)
  - Responsive design works across all screen sizes
  - Proper information hierarchy for mobile devices
  - Touch-friendly action buttons with proper spacing
  - Mobile-friendly invoice creation dialog
  - Responsive statistics cards

### 📋 **REMAINING FEATURES (Phase 1 & 2)**

#### Phase 1 (High Priority) - Remaining
2. **Invoice Templates** - Template system for common invoice types
3. **Advanced Search and Filtering** - Multi-criteria filtering system
4. **Invoice Creation Process** - Enhanced invoice creation workflow

#### Phase 2 (Medium Priority)
1. Add invoice analytics
2. Implement payment reminders
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
- `/api/invoices/templates` - Invoice templates
- `/api/invoices/analytics` - Analytics data
- `/api/invoices/automation` - Automation rules
- `/api/invoices/reminders` - Payment reminders
- `/api/invoices/approval` - Approval workflow
- `/api/invoices/integrations` - Integration settings

### Database Changes
- Invoice templates table
- Invoice automation table
- Payment reminders table
- Invoice approval workflow table
- Invoice analytics cache table

## Success Metrics

### User Experience
- Reduced time to create invoices
- Increased invoice accuracy
- Improved mobile usability
- Faster invoice operations

### Performance
- Faster analytics loading
- Reduced page load times
- Better mobile performance
- Improved data loading

### Business Impact
- Better invoice management
- Increased payment rates
- Improved cash flow
- Better client satisfaction

## Questions for Further Development

1. **Invoice Templates**: What types of invoice templates are most needed for your practice?
2. **Payment Methods**: What payment methods should be supported for online payments?
3. **Automation Needs**: What invoice tasks should be automated?
4. **Integration Requirements**: Which accounting systems need to integrate with invoicing?
5. **Approval Process**: Is an invoice approval workflow needed?
6. **Mobile Usage**: How important is mobile invoice creation and management?
7. **Analytics Needs**: What invoice metrics and reports are most important?
8. **Payment Reminders**: How should payment reminders be handled?

