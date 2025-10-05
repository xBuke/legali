'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  MessageSquare, 
  Bell, 
  Plus, 
  MoreVertical,
  AtSign,
  Paperclip,
  Send,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: string[]
  joinedAt: Date
}

interface CaseComment {
  id: string
  caseId: string
  author: TeamMember
  content: string
  createdAt: Date
  updatedAt?: Date
  isEdited: boolean
  attachments?: string[]
  mentions?: string[]
}

interface CaseNotification {
  id: string
  caseId: string
  type: 'comment' | 'status_change' | 'assignment' | 'deadline' | 'document'
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  userId: string
}

interface CaseCollaborationProps {
  caseId: string
  currentUser: TeamMember
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Marko Kovač',
    email: 'marko.kovac@ilegal.hr',
    role: 'owner',
    permissions: ['read', 'write', 'delete', 'admin'],
    joinedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Ana Novak',
    email: 'ana.novak@ilegal.hr',
    role: 'admin',
    permissions: ['read', 'write'],
    joinedAt: new Date('2024-02-01')
  },
  {
    id: '3',
    name: 'Petra Horvat',
    email: 'petra.horvat@ilegal.hr',
    role: 'member',
    permissions: ['read', 'write'],
    joinedAt: new Date('2024-02-15')
  }
]

const mockComments: CaseComment[] = [
  {
    id: '1',
    caseId: 'case-1',
    author: mockTeamMembers[0],
    content: 'Početna analiza predmeta je završena. Potrebno je pripremiti tužbu do kraja tjedna.',
    createdAt: new Date('2024-01-20T10:30:00'),
    mentions: ['ana.novak@ilegal.hr']
  },
  {
    id: '2',
    caseId: 'case-1',
    author: mockTeamMembers[1],
    content: 'Tužba je pripremljena i poslana na pregled. @marko.kovac@ilegal.hr možeš li pregledati?',
    createdAt: new Date('2024-01-22T14:15:00'),
    mentions: ['marko.kovac@ilegal.hr']
  },
  {
    id: '3',
    caseId: 'case-1',
    author: mockTeamMembers[0],
    content: 'Odličan rad! Tužba je odobrena i može se podnijeti.',
    createdAt: new Date('2024-01-23T09:45:00')
  }
]

const mockNotifications: CaseNotification[] = [
  {
    id: '1',
    caseId: 'case-1',
    type: 'comment',
    title: 'Novi komentar',
    message: 'Ana Novak je dodala komentar na predmet',
    isRead: false,
    createdAt: new Date('2024-01-22T14:15:00'),
    userId: '1'
  },
  {
    id: '2',
    caseId: 'case-1',
    type: 'status_change',
    title: 'Promjena statusa',
    message: 'Status predmeta je promijenjen u "U tijeku"',
    isRead: true,
    createdAt: new Date('2024-01-21T16:30:00'),
    userId: '1'
  },
  {
    id: '3',
    caseId: 'case-1',
    type: 'deadline',
    title: 'Rok se bliži',
    message: 'Rok za podnošenje tužbe je za 2 dana',
    isRead: false,
    createdAt: new Date('2024-01-20T08:00:00'),
    userId: '1'
  }
]

export function CaseCollaboration({ caseId, currentUser }: CaseCollaborationProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [comments, setComments] = useState<CaseComment[]>(mockComments)
  const [notifications, setNotifications] = useState<CaseNotification[]>(mockNotifications)
  const [newComment, setNewComment] = useState('')
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member')

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: CaseComment = {
      id: Date.now().toString(),
      caseId,
      author: currentUser,
      content: newComment,
      createdAt: new Date()
    }

    setComments(prev => [comment, ...prev])
    setNewComment('')
  }

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) return

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newMemberEmail.split('@')[0],
      email: newMemberEmail,
      role: newMemberRole,
      permissions: newMemberRole === 'admin' ? ['read', 'write'] : 
                   newMemberRole === 'member' ? ['read', 'write'] : ['read'],
      joinedAt: new Date()
    }

    setTeamMembers(prev => [...prev, newMember])
    setNewMemberEmail('')
    setNewMemberRole('member')
    setIsAddMemberOpen(false)
  }

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== memberId))
  }

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    )
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'member': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="h-4 w-4" />
      case 'status_change': return <CheckCircle className="h-4 w-4" />
      case 'assignment': return <Users className="h-4 w-4" />
      case 'deadline': return <Clock className="h-4 w-4" />
      case 'document': return <Paperclip className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const unreadNotifications = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tim ({teamMembers.length})
            </div>
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj člana
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dodaj člana tima</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="member-email">Email adresa</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="clan@ilegal.hr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="member-role">Uloga</Label>
                    <Select value={newMemberRole} onValueChange={(value: any) => setNewMemberRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="member">Član</SelectItem>
                        <SelectItem value="viewer">Promatrač</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                      Odustani
                    </Button>
                    <Button onClick={handleAddMember}>
                      Dodaj člana
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Pridružen: {member.joinedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(member.role)}>
                    {member.role === 'owner' ? 'Vlasnik' :
                     member.role === 'admin' ? 'Admin' :
                     member.role === 'member' ? 'Član' : 'Promatrač'}
                  </Badge>
                  {member.id !== currentUser.id && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Obavještenja
            {unreadNotifications > 0 && (
              <Badge variant="destructive">{unreadNotifications}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{notification.title}</h4>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.createdAt.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Komentari ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Dodaj komentar..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Paperclip className="h-4 w-4 mr-1" />
                      Priloži
                    </Button>
                    <Button size="sm" variant="outline">
                      <AtSign className="h-4 w-4 mr-1" />
                      Spomeni
                    </Button>
                  </div>
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Pošalji
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <Avatar>
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback>
                    {comment.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{comment.author.name}</h4>
                    <Badge className={getRoleColor(comment.author.role)}>
                      {comment.author.role === 'owner' ? 'Vlasnik' :
                       comment.author.role === 'admin' ? 'Admin' :
                       comment.author.role === 'member' ? 'Član' : 'Promatrač'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {comment.createdAt.toLocaleString()}
                    </span>
                    {comment.isEdited && (
                      <span className="text-xs text-muted-foreground">(uređeno)</span>
                    )}
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  {comment.mentions && comment.mentions.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <AtSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Spomenuti: {comment.mentions.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
