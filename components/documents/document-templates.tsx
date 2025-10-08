'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  Copy,
  Eye,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  caseType: string;
  content: string;
  variables: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  usageCount: number;
}

interface DocumentTemplatesProps {
  caseId?: string;
  caseType?: string;
  onTemplateSelect?: (template: DocumentTemplate) => void;
  className?: string;
}

export function DocumentTemplates({ caseId, caseType, onTemplateSelect, className }: DocumentTemplatesProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCaseType, setSelectedCaseType] = useState('');
  const { toast } = useToast();

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    caseType: '',
    content: '',
    isPublic: false,
  });

  const categories = [
    'Ugovori',
    'Tužbe',
    'Odgovori',
    'Zahtjevi',
    'Izvještaji',
    'Pisma',
    'Dokumenti',
    'Ostalo',
  ];

  const caseTypes = [
    'Građansko pravo',
    'Kazneno pravo',
    'Radno pravo',
    'Obiteljsko pravo',
    'Trgovačko pravo',
    'Upravno pravo',
    'Nasljednopravni predmet',
    'Nekretnine',
    'Ugovori',
    'Naknada štete',
    'Ostalo',
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const url = caseId ? `/api/documents/templates?caseId=${caseId}` : '/api/documents/templates';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!templateForm.name.trim() || !templateForm.content.trim()) {
      toast({
        title: 'Greška',
        description: 'Naziv i sadržaj su obavezni',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/documents/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateForm),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates(prev => [newTemplate, ...prev]);
        setShowCreateTemplate(false);
        setTemplateForm({ name: '', description: '', category: '', caseType: '', content: '', isPublic: false });
        
        toast({
          title: 'Uspjeh',
          description: 'Predložak je stvoren',
        });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Greška pri stvaranju predloška',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTemplate || !templateForm.name.trim() || !templateForm.content.trim()) {
      toast({
        title: 'Greška',
        description: 'Naziv i sadržaj su obavezni',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/documents/templates/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateForm),
      });

      if (response.ok) {
        const updatedTemplate = await response.json();
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
        setEditingTemplate(null);
        setTemplateForm({ name: '', description: '', category: '', caseType: '', content: '', isPublic: false });
        
        toast({
          title: 'Uspjeh',
          description: 'Predložak je ažuriran',
        });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Greška pri ažuriranju predloška',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj predložak?')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        
        toast({
          title: 'Uspjeh',
          description: 'Predložak je obrisan',
        });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Greška pri brisanju predloška',
        variant: 'destructive',
      });
    }
  };

  const handleUseTemplate = async (template: DocumentTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    } else {
      // Default behavior - show template content in a new window for copying
      try {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${template.name}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                  .header { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                  .content { white-space: pre-wrap; background: #fafafa; padding: 15px; border-radius: 5px; }
                  .instructions { background: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>${template.name}</h1>
                  <p><strong>Kategorija:</strong> ${template.category}</p>
                  <p><strong>Tip predmeta:</strong> ${template.caseType}</p>
                </div>
                <div class="instructions">
                  <strong>Upute:</strong> Kopirajte sadržaj ispod i zamijenite varijable (npr. [CLIENT_NAME], [DATE]) s odgovarajućim podacima.
                </div>
                <div class="content">${template.content}</div>
              </body>
            </html>
          `);
        }
        
        toast({
          title: 'Uspjeh',
          description: 'Predložak je otvoren u novom prozoru za kopiranje',
        });
      } catch (error) {
        toast({
          title: 'Greška',
          description: 'Greška pri otvaranju predloška',
          variant: 'destructive',
        });
      }
    }
  };

  const startEditing = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      caseType: template.caseType,
      content: template.content,
      isPublic: template.isPublic,
    });
  };

  const cancelEditing = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', description: '', category: '', caseType: '', content: '', isPublic: false });
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-muted-foreground">Učitavanje predložaka...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Predlošci dokumenata
          </CardTitle>
          <CardDescription>
            Upravljajte predlošcima dokumenata za brže stvaranje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pretraži predloške..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Kategorija" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve kategorije</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowCreateTemplate(true)}
              className="min-h-[44px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novi predložak
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Template */}
      {(showCreateTemplate || editingTemplate) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTemplate ? 'Uredi predložak' : 'Stvori novi predložak'}
            </CardTitle>
            <CardDescription>
              {editingTemplate ? 'Ažurirajte podatke o predlošku' : 'Definirajte novi predložak dokumenta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateName">Naziv predloška</Label>
                  <Input
                    id="templateName"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Npr. Tužba za naknadu štete"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="templateCategory">Kategorija</Label>
                  <Select
                    value={templateForm.category}
                    onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite kategoriju" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateCaseType">Tip predmeta</Label>
                  <Select
                    value={templateForm.caseType}
                    onValueChange={(value) => setTemplateForm(prev => ({ ...prev, caseType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite tip predmeta" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={templateForm.isPublic}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isPublic" className="text-sm">
                    Javni predložak
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="templateDescription">Opis</Label>
                <Textarea
                  id="templateDescription"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Opis predloška..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="templateContent">Sadržaj predloška</Label>
                <Textarea
                  id="templateContent"
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Unesite sadržaj predloška..."
                  rows={10}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Koristite varijable kao što su [CLIENT_NAME], [CASE_NUMBER], [DATE] za dinamički sadržaj
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="min-h-[44px]">
                  {editingTemplate ? 'Ažuriraj predložak' : 'Stvori predložak'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={editingTemplate ? cancelEditing : () => setShowCreateTemplate(false)}
                  className="min-h-[44px]"
                >
                  Odustani
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(template)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{template.category}</Badge>
                  <Badge variant="outline">{template.caseType}</Badge>
                  {template.isPublic && (
                    <Badge variant="default">Javni</Badge>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Korišten: {template.usageCount} puta</p>
                  <p>Stvoren: {new Date(template.createdAt).toLocaleDateString('hr-HR')}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 min-h-[36px]"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Koristi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Preview template content
                      const newWindow = window.open('', '_blank');
                      if (newWindow) {
                        newWindow.document.write(`
                          <html>
                            <head><title>${template.name}</title></head>
                            <body style="font-family: Arial, sans-serif; padding: 20px;">
                              <h1>${template.name}</h1>
                              <p><strong>Kategorija:</strong> ${template.category}</p>
                              <p><strong>Tip predmeta:</strong> ${template.caseType}</p>
                              <hr>
                              <div style="white-space: pre-wrap;">${template.content}</div>
                            </body>
                          </html>
                        `);
                      }
                    }}
                    className="min-h-[36px]"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery || (selectedCategory && selectedCategory !== 'all')
                ? 'Nema predložaka koji odgovaraju filtru' 
                : 'Nema predložaka dokumenata'}
            </p>
            {!searchQuery && (!selectedCategory || selectedCategory === 'all') && (
              <Button
                onClick={() => setShowCreateTemplate(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Stvori prvi predložak
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
