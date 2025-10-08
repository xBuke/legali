'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface CaseNote {
  id: string;
  content: string;
  type: 'note' | 'comment' | 'update';
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  caseId: string;
}

interface CaseNotesProps {
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  className?: string;
}

export function CaseNotes({ caseId, caseNumber, className }: CaseNotesProps) {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'comment' | 'update'>('note');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [caseId, loadNotes]);

  const loadNotes = async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      toast({
        title: 'Greška',
        description: 'Unesite sadržaj napomene',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote,
          type: noteType,
        }),
      });

      if (response.ok) {
        const newNoteData = await response.json();
        setNotes(prev => [newNoteData, ...prev]);
        setNewNote('');
        setNoteType('note');
        setIsPrivate(false);
        
        toast({
          title: 'Uspjeh',
          description: 'Napomena je dodana',
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to add note');
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: error instanceof Error ? error.message : 'Greška pri dodavanju napomene',
        variant: 'destructive',
      });
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editContent.trim()) {
      toast({
        title: 'Greška',
        description: 'Unesite sadržaj napomene',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/cases/${caseId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
        }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(prev => prev.map(note => 
          note.id === noteId ? updatedNote : note
        ));
        setEditingNote(null);
        setEditContent('');
        
        toast({
          title: 'Uspjeh',
          description: 'Napomena je ažurirana',
        });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        title: 'Greška',
        description: 'Greška pri ažuriranju napomene',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovu napomenu?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cases/${caseId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        
        toast({
          title: 'Uspjeh',
          description: 'Napomena je obrisana',
        });
      } else {
        throw new Error();
      }
    } catch {
      toast({
        title: 'Greška',
        description: 'Greška pri brisanju napomene',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (note: CaseNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'note':
        return 'bg-blue-500/10 text-blue-500';
      case 'comment':
        return 'bg-green-500/10 text-green-500';
      case 'update':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getNoteTypeLabel = (type: string) => {
    switch (type) {
      case 'note':
        return 'Napomena';
      case 'comment':
        return 'Komentar';
      case 'update':
        return 'Ažuriranje';
      default:
        return type;
    }
  };

  const getAuthorName = (author: CaseNote['author']) => {
    if (!author) {
      return 'Nepoznat korisnik';
    }
    return `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'Nepoznat korisnik';
  };

  const getAuthorInitials = (author: CaseNote['author']) => {
    if (!author) {
      return '?';
    }
    if (author.firstName && author.lastName) {
      return `${author.firstName[0]}${author.lastName[0]}`.toUpperCase();
    }
    return author.email?.[0]?.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-muted-foreground">Učitavanje napomena...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Add New Note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Dodaj napomenu
          </CardTitle>
          <CardDescription>
            Dodajte napomenu, komentar ili ažuriranje za predmet {caseNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Tip napomene</label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as 'note' | 'comment' | 'update')}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="note">Napomena</option>
                  <option value="comment">Komentar</option>
                  <option value="update">Ažuriranje</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isPrivate" className="text-sm">
                  Privatna napomena
                </label>
              </div>
            </div>
            
            <div>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Unesite sadržaj napomene..."
                rows={4}
                className="w-full"
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Dodaj napomenu
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Napomene i komentari
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            {notes.length} napomena za predmet {caseNumber}
          </CardDescription>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            {notes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nema napomena za ovaj predmet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {getAuthorInitials(note.author)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {getAuthorName(note.author)}
                          </span>
                          <Badge className={getNoteTypeColor(note.type)}>
                            {getNoteTypeLabel(note.type)}
                          </Badge>
                          {note.isPrivate && (
                            <Badge variant="outline" className="text-xs">
                              Privatno
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(note.createdAt), 'dd.MM.yyyy HH:mm', { locale: hr })}
                          </span>
                          {note.updatedAt !== note.createdAt && (
                            <>
                              <Clock className="h-3 w-3 ml-2" />
                              <span>
                                Ažurirano: {format(new Date(note.updatedAt), 'dd.MM.yyyy HH:mm', { locale: hr })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingNote === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditNote(note.id)}
                          className="min-h-[36px]"
                        >
                          Spremi
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          className="min-h-[36px]"
                        >
                          Odustani
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">
                      {note.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
