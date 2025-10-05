'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'currency';
  selected: boolean;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  category: 'financial' | 'productivity' | 'client' | 'case';
  fields: ReportField[];
  filters: ReportFilter[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

const availableFields: ReportField[] = [
  { id: 'client_name', name: 'Ime klijenta', type: 'text', selected: false },
  { id: 'case_number', name: 'Broj predmeta', type: 'text', selected: false },
  { id: 'case_status', name: 'Status predmeta', type: 'text', selected: false },
  { id: 'case_priority', name: 'Prioritet predmeta', type: 'text', selected: false },
  { id: 'invoice_amount', name: 'Iznos računa', type: 'currency', selected: false },
  { id: 'invoice_status', name: 'Status računa', type: 'text', selected: false },
  { id: 'time_duration', name: 'Trajanje rada', type: 'number', selected: false },
  { id: 'time_billable', name: 'Naplativo vrijeme', type: 'text', selected: false },
  { id: 'document_count', name: 'Broj dokumenata', type: 'number', selected: false },
  { id: 'created_date', name: 'Datum stvaranja', type: 'date', selected: false },
  { id: 'due_date', name: 'Datum dospijeća', type: 'date', selected: false },
];

const reportTemplates: Omit<ReportTemplate, 'id'>[] = [
  {
    name: 'Financijski izvještaj',
    category: 'financial',
    fields: availableFields.filter(f => ['invoice_amount', 'invoice_status', 'client_name', 'created_date'].includes(f.id)),
    filters: [],
    dateRange: { from: undefined, to: undefined },
  },
  {
    name: 'Izvještaj produktivnosti',
    category: 'productivity',
    fields: availableFields.filter(f => ['time_duration', 'time_billable', 'case_number', 'created_date'].includes(f.id)),
    filters: [],
    dateRange: { from: undefined, to: undefined },
  },
  {
    name: 'Izvještaj klijenata',
    category: 'client',
    fields: availableFields.filter(f => ['client_name', 'case_number', 'case_status', 'created_date'].includes(f.id)),
    filters: [],
    dateRange: { from: undefined, to: undefined },
  },
  {
    name: 'Izvještaj predmeta',
    category: 'case',
    fields: availableFields.filter(f => ['case_number', 'case_status', 'case_priority', 'due_date'].includes(f.id)),
    filters: [],
    dateRange: { from: undefined, to: undefined },
  },
];

export function ReportsBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customReport, setCustomReport] = useState<ReportTemplate>({
    id: 'custom',
    name: 'Prilagođeni izvještaj',
    category: 'financial',
    fields: [...availableFields],
    filters: [],
    dateRange: { from: undefined, to: undefined },
  });
  const [reportData, setReportData] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleTemplateSelect = (templateName: string) => {
    if (templateName === 'custom') {
      setSelectedTemplate('custom');
      return;
    }

    const template = reportTemplates.find(t => t.name === templateName);
    if (template) {
      setCustomReport({
        id: 'custom',
        name: template.name,
        category: template.category,
        fields: template.fields.map(f => ({ ...f, selected: true })),
        filters: [],
        dateRange: { from: undefined, to: undefined },
      });
      setSelectedTemplate(templateName);
    }
  };

  const handleFieldToggle = (fieldId: string) => {
    setCustomReport(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, selected: !field.selected } : field
      ),
    }));
  };

  const addFilter = () => {
    setCustomReport(prev => ({
      ...prev,
      filters: [
        ...prev.filters,
        {
          id: Date.now().toString(),
          field: '',
          operator: 'equals',
          value: '',
        },
      ],
    }));
  };

  const removeFilter = (filterId: string) => {
    setCustomReport(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== filterId),
    }));
  };

  const updateFilter = (filterId: string, field: string, value: string) => {
    setCustomReport(prev => ({
      ...prev,
      filters: prev.filters.map(f =>
        f.id === filterId ? { ...f, [field]: value } : f
      ),
    }));
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const selectedFields = customReport.fields.filter(f => f.selected);
      const response = await fetch('/api/analytics/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: selectedFields,
          filters: customReport.filters,
          dateRange: customReport.dateRange,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    // Implementation for exporting report
    console.log(`Exporting report as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Odaberite predložak izvještaja</CardTitle>
          <CardDescription>
            Odaberite postojeći predložak ili stvorite prilagođeni izvještaj
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Button
                key={template.name}
                variant={selectedTemplate === template.name ? 'default' : 'outline'}
                onClick={() => handleTemplateSelect(template.name)}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {template.category}
                  </div>
                </div>
              </Button>
            ))}
            <Button
              variant={selectedTemplate === 'custom' ? 'default' : 'outline'}
              onClick={() => handleTemplateSelect('custom')}
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <Plus className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Prilagođeni izvještaj</div>
                <div className="text-xs text-muted-foreground">
                  Stvori vlastiti
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Konfiguracija izvještaja</CardTitle>
          <CardDescription>
            Odaberite polja i filtre za izvještaj
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div>
            <Label>Vremenski raspon</Label>
            <div className="flex gap-4 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customReport.dateRange.from ? (
                      format(customReport.dateRange.from, 'dd.MM.yyyy', { locale: hr })
                    ) : (
                      'Od datuma'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customReport.dateRange.from}
                    onSelect={(date) =>
                      setCustomReport(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: date },
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customReport.dateRange.to ? (
                      format(customReport.dateRange.to, 'dd.MM.yyyy', { locale: hr })
                    ) : (
                      'Do datuma'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customReport.dateRange.to}
                    onSelect={(date) =>
                      setCustomReport(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: date },
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Fields Selection */}
          <div>
            <Label>Polja za uključivanje</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {customReport.fields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={field.selected}
                    onCheckedChange={() => handleFieldToggle(field.id)}
                  />
                  <Label htmlFor={field.id} className="text-sm">
                    {field.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Filtri</Label>
              <Button variant="outline" size="sm" onClick={addFilter}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj filter
              </Button>
            </div>
            <div className="space-y-2 mt-2">
              {customReport.filters.map((filter) => (
                <div key={filter.id} className="flex gap-2 items-center">
                  <Select
                    value={filter.field}
                    onValueChange={(value) => updateFilter(filter.id, 'field', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Polje" />
                    </SelectTrigger>
                    <SelectContent>
                      {customReport.fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(filter.id, 'operator', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Jednako</SelectItem>
                      <SelectItem value="contains">Sadrži</SelectItem>
                      <SelectItem value="greater">Veće od</SelectItem>
                      <SelectItem value="less">Manje od</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                    placeholder="Vrijednost"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Report */}
          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={generating}>
              {generating ? 'Generiranje...' : 'Generiraj izvještaj'}
            </Button>
            {reportData.length > 0 && (
              <>
                <Button variant="outline" onClick={() => exportReport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Izvezi CSV
                </Button>
                <Button variant="outline" onClick={() => exportReport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Izvezi PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rezultati izvještaja</CardTitle>
            <CardDescription>
              {reportData.length} zapisa pronađeno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    {customReport.fields
                      .filter(f => f.selected)
                      .map((field) => (
                        <th key={field.id} className="text-left p-2 font-medium">
                          {field.name}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-b">
                      {customReport.fields
                        .filter(f => f.selected)
                        .map((field) => (
                          <td key={field.id} className="p-2">
                            {row[field.id] || '-'}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Prikazano 10 od {reportData.length} zapisa
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
