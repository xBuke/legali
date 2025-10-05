'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  templateType: 'standard' | 'hourly' | 'fixed' | 'retainer';
  items: InvoiceTemplateItem[];
  terms: string;
  notes: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
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

interface InvoiceTemplatesProps {
  onTemplateSelect?: (template: InvoiceTemplate) => void;
  showSelectButton?: boolean;
}

export function InvoiceTemplates({ onTemplateSelect, showSelectButton = true }: InvoiceTemplatesProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateType: 'standard' as 'standard' | 'hourly' | 'fixed' | 'retainer',
    terms: '',
    notes: '',
    isDefault: false,
  });
  const [items, setItems] = useState<InvoiceTemplateItem[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/invoices/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.map((template: any) => ({
          ...template,
          items: typeof template.items === 'string' ? JSON.parse(template.items) : template.items,
        })));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju predložaka',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Greška',
        description: 'Naziv predloška je obavezan',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingTemplate 
        ? `/api/invoices/templates/${editingTemplate.id}`
        : '/api/invoices/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: editingTemplate ? 'Predložak je ažuriran' : 'Predložak je stvoren',
        });
        loadTemplates();
        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri spremanju predloška',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri spremanju predloška',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj predložak?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Predložak je obrisan',
        });
        loadTemplates();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri brisanju predloška',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri brisanju predloška',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (template: InvoiceTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      templateType: template.templateType,
      terms: template.terms,
      notes: template.notes,
      isDefault: template.isDefault,
    });
    setItems(template.items);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (template: InvoiceTemplate) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (kopija)`,
      description: template.description,
      templateType: template.templateType,
      terms: template.terms,
      notes: template.notes,
      isDefault: false,
    });
    setItems(template.items);
    setIsDialogOpen(true);
  };

  const handleSelect = (template: InvoiceTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      templateType: 'standard',
      terms: '',
      notes: '',
      isDefault: false,
    });
    setItems([]);
    setEditingTemplate(null);
  };

  const addItem = () => {
    const newItem: InvoiceTemplateItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 25,
      isRequired: false,
      category: 'Usluga',
    };
    setItems([...items, newItem]);
  };

  const updateItem = (itemId: string, updates: Partial<InvoiceTemplateItem>) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const getTemplateTypeLabel = (type: string) => {
    const labels = {
      standard: 'Standardni',
      hourly: 'Po satu',
      fixed: 'Fiksni',
      retainer: 'Retainer',
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Učitavanje predložaka...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Predlošci računa</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novi predložak
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Uredi predložak' : 'Novi predložak'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate ? 'Uredite postojeći predložak' : 'Stvorite novi predložak računa'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Naziv predloška</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Naziv predloška"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="templateType">Tip predloška</Label>
                  <Select value={formData.templateType} onValueChange={(value: any) => 
                    setFormData({ ...formData, templateType: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standardni</SelectItem>
                      <SelectItem value="hourly">Po satu</SelectItem>
                      <SelectItem value="fixed">Fiksni</SelectItem>
                      <SelectItem value="retainer">Retainer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opis predloška..."
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Stavke predloška</h4>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj stavku
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <Card key={item.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                          <Label>Opis</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder="Opis stavke"
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
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(item.id)}
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
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    placeholder="Uvjeti plaćanja..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Napomene</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Dodatne napomene..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Ažuriraj' : 'Stvori'} predložak
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{getTemplateTypeLabel(template.templateType)}</Badge>
                  {template.isDefault && <Badge variant="default">Zadani</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {template.items.length} stavki
                </p>
              </div>
              <div className="flex gap-2">
                {showSelectButton && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelect(template)}
                  >
                    Koristi
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
