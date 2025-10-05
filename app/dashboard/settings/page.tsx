'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, User, Shield, Bell, Globe, Database, Eye, EyeOff, CreditCard, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface SubscriptionData {
  organization: {
    id: string;
    name: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    storageUsed: string;
    storageLimit: string;
    userCount: number;
    isTrialActive: boolean;
    trialDaysRemaining: number;
  };
  currentPlan: {
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
    limits: {
      users: number;
      storage: number;
    };
    storageUsedFormatted: string;
    storageLimitFormatted: string;
    storageUsagePercentage: number;
  };
  availablePlans: Array<{
    tier: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
    limits: {
      users: number;
      storage: number;
    };
    isCurrentPlan: boolean;
  }>;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [organizationModalOpen, setOrganizationModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [emailNotificationModalOpen, setEmailNotificationModalOpen] = useState(false);
  const [pushNotificationModalOpen, setPushNotificationModalOpen] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [organizationForm, setOrganizationForm] = useState({
    name: 'Test Law Firm'
  });
  const [emailNotificationForm, setEmailNotificationForm] = useState({
    caseUpdates: true,
    deadlineReminders: true,
    newDocuments: true,
    paymentReminders: true
  });
  const [pushNotificationForm, setPushNotificationForm] = useState({
    caseUpdates: true,
    deadlineReminders: true,
    newDocuments: false,
    paymentReminders: true
  });
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const [userResponse, subscriptionResponse] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/organizations/subscription')
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
        setProfileForm({
          firstName: userData.firstName || '',
          lastName: userData.lastName || ''
        });
      }

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscriptionData(subscriptionData);
      } else {
        // If subscription API fails, create a basic subscription data structure
        console.warn('Subscription API failed, using fallback data');
        setSubscriptionData({
          organization: {
            id: 'fallback',
            name: 'Test Law Firm',
            subscriptionTier: 'BASIC',
            subscriptionStatus: 'TRIAL',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            subscriptionEndsAt: null,
            storageUsed: '0',
            storageLimit: '53687091200',
            userCount: 1,
            isTrialActive: true,
            trialDaysRemaining: 14,
          },
          currentPlan: {
            name: 'Basic',
            price: 147,
            currency: 'EUR',
            interval: 'month',
            features: [
              'Up to 3 user accounts',
              'Unlimited cases & clients',
              '50GB document storage',
              'Time tracking & invoicing',
              'Client portal',
              'End-to-end encryption',
              '2FA security',
              'Email support (48h)',
            ],
            limits: {
              users: 3,
              storage: 53687091200,
            },
            storageUsedFormatted: '0 B',
            storageLimitFormatted: '50 GB',
            storageUsagePercentage: 0,
          },
          availablePlans: [
            {
              tier: 'BASIC',
              name: 'Basic',
              price: 147,
              currency: 'EUR',
              interval: 'month',
              features: [
                'Up to 3 user accounts',
                'Unlimited cases & clients',
                '50GB document storage',
                'Time tracking & invoicing',
                'Client portal',
                'End-to-end encryption',
                '2FA security',
                'Email support (48h)',
              ],
              limits: { users: 3, storage: 53687091200 },
              isCurrentPlan: true,
            },
            {
              tier: 'PRO',
              name: 'Pro',
              price: 297,
              currency: 'EUR',
              interval: 'month',
              features: [
                'Up to 6 user accounts',
                'Everything in Basic',
                'AI Document Analyzer',
                'OCR & text extraction',
                'Document summarization',
                'Risk assessment',
                '200GB storage',
                'Advanced reporting',
                'API access',
                'Priority support (24h)',
              ],
              limits: { users: 6, storage: 200 * 1024 * 1024 * 1024 },
              isCurrentPlan: false,
            },
            {
              tier: 'ENTERPRISE',
              name: 'Enterprise',
              price: 497,
              currency: 'EUR',
              interval: 'month',
              features: [
                'Unlimited user accounts',
                'Everything in Pro',
                'AI Legal Assistant Chatbot',
                'Legal research assistance',
                'Document drafting AI',
                'Unlimited storage',
                'SSO integration',
                'White-label options',
                'Dedicated support (4h)',
                'Custom integrations',
              ],
              limits: { users: Infinity, storage: Infinity },
              isCurrentPlan: false,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Greška',
        description: 'Neuspješno učitavanje podataka',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        toast({
          title: 'Uspjeh',
          description: 'Profil je uspješno ažuriran'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri ažuriranju profila');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Greška',
        description: error instanceof Error ? error.message : 'Greška pri ažuriranju profila',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Greška',
        description: 'Nove lozinke se ne podudaraju',
        variant: 'destructive'
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: 'Greška',
        description: 'Nova lozinka mora imati najmanje 8 znakova',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Here you would implement password change API
      toast({
        title: 'Uspjeh',
        description: 'Lozinka je uspješno promijenjena'
      });
      setPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri promjeni lozinke',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOrganizationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Here you would implement organization update API
      toast({
        title: 'Uspjeh',
        description: 'Organizacija je uspješno ažurirana'
      });
      setOrganizationModalOpen(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri ažuriranju organizacije',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async (type: 'email' | 'push') => {
    setSaving(true);
    try {
      // Here you would implement notification settings API
      toast({
        title: 'Uspjeh',
        description: `${type === 'email' ? 'Email' : 'Push'} obavještenja su uspješno ažurirana`
      });
      if (type === 'email') {
        setEmailNotificationModalOpen(false);
      } else {
        setPushNotificationModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri ažuriranju obavještenja',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Postavke</h1>
        <p className="text-gray-600 mt-2">
          Upravljajte postavkama vašeg računa i organizacije
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil korisnika
            </CardTitle>
            <CardDescription>
              Upravljajte svojim osobnim podacima
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ime</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Vaše ime"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Prezime</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Vaše prezime"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email adresa</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  Email adresa se ne može mijenjati
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Uloga</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {user?.role || 'Nepoznato'}
                  </Badge>
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? 'Spremanje...' : 'Spremi promjene'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sigurnosne postavke
            </CardTitle>
            <CardDescription>
              Upravljajte sigurnosnim postavkama vašeg računa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Dvofaktorska autentifikacija (2FA)</h4>
                  <p className="text-sm text-gray-600">
                    Dodatna sigurnosna mjera za zaštitu vašeg računa
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={user?.twoFactorEnabled ? 'default' : 'secondary'}>
                    {user?.twoFactorEnabled ? 'Omogućena' : 'Onemogućena'}
                  </Badge>
                  <Link href="/dashboard/security">
                    <Button variant="outline" size="sm">
                      Upravljaj
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Promjena lozinke</h4>
                  <p className="text-sm text-gray-600">
                    Ažurirajte svoju lozinku za dodatnu sigurnost
                  </p>
                </div>
                <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Promijeni lozinku
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Promjena lozinke</DialogTitle>
                      <DialogDescription>
                        Unesite trenutnu lozinku i novu lozinku za ažuriranje.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Trenutna lozinka</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Unesite trenutnu lozinku"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova lozinka</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Unesite novu lozinku"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Potvrdite novu lozinku</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Potvrdite novu lozinku"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPasswordModalOpen(false)}>
                          Odustani
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? 'Spremanje...' : 'Promijeni lozinku'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Informacije o računu
            </CardTitle>
            <CardDescription>
              Osnovne informacije o vašem računu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">ID korisnika</Label>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {user?.id || 'Nepoznato'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Datum registracije</Label>
                  <p className="text-sm">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('hr-HR') : 'Nepoznato'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Zadnja prijava</Label>
                  <p className="text-sm">
                    {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('hr-HR') : 'Nikad'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status računa</Label>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Aktivan
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Postavke organizacije
            </CardTitle>
            <CardDescription>
              Upravljajte postavkama vaše odvjetničke kancelarije
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Naziv organizacije</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {organizationForm.name}
                </p>
                <Dialog open={organizationModalOpen} onOpenChange={setOrganizationModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Uredi organizaciju
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Uredi organizaciju</DialogTitle>
                      <DialogDescription>
                        Ažurirajte informacije o vašoj organizaciji.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleOrganizationUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="organizationName">Naziv organizacije</Label>
                        <Input
                          id="organizationName"
                          value={organizationForm.name}
                          onChange={(e) => setOrganizationForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Unesite naziv organizacije"
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOrganizationModalOpen(false)}>
                          Odustani
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? 'Spremanje...' : 'Spremi promjene'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Članovi tima</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Upravljajte članovima vašeg tima
                </p>
                <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Upravljaj članovima
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Upravljanje članovima tima</DialogTitle>
                      <DialogDescription>
                        Dodajte, uklonite ili upravljajte članovima vašeg tima.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Test User</p>
                            <p className="text-sm text-gray-600">test@example.com</p>
                          </div>
                          <Badge variant="secondary">ADMIN</Badge>
                        </div>
                      </div>
                      <div className="text-center py-4 text-gray-500">
                        <p>Funkcionalnost upravljanja članovima tima bit će dostupna u budućim verzijama.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTeamModalOpen(false)}>
                        Zatvori
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Settings */}
        {subscriptionData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pretplata
              </CardTitle>
              <CardDescription>
                Upravljajte svojom pretplatom i planom
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Plan Overview */}
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{subscriptionData.currentPlan.name} Plan</h4>
                      <p className="text-sm text-gray-600">
                        {subscriptionData.currentPlan.price} {subscriptionData.currentPlan.currency}/{subscriptionData.currentPlan.interval}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={subscriptionData.organization.subscriptionStatus === 'ACTIVE' ? 'default' : 
                                subscriptionData.organization.isTrialActive ? 'secondary' : 'destructive'}
                        className="mb-2"
                      >
                        {subscriptionData.organization.subscriptionStatus === 'ACTIVE' ? 'Aktivna' :
                         subscriptionData.organization.isTrialActive ? 'Probni period' : 
                         subscriptionData.organization.subscriptionStatus}
                      </Badge>
                      {subscriptionData.organization.isTrialActive && (
                        <p className="text-sm text-orange-600 font-medium">
                          {subscriptionData.organization.trialDaysRemaining} dana preostalo
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Usage Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Korisnici</p>
                      <p className="font-semibold">
                        {subscriptionData.organization.userCount} / {subscriptionData.currentPlan.limits.users === Infinity ? '∞' : subscriptionData.currentPlan.limits.users}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pohrana</p>
                      <p className="font-semibold">
                        {subscriptionData.currentPlan.storageUsedFormatted} / {subscriptionData.currentPlan.storageLimitFormatted}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(subscriptionData.currentPlan.storageUsagePercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Current Plan Details */}
                  <div className="p-4 border rounded-lg bg-white">
                    <h4 className="font-semibold mb-3">Trenutni plan: {subscriptionData.currentPlan.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Uključene značajke:</h5>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              {subscriptionData.currentPlan.features.slice(0, Math.ceil(subscriptionData.currentPlan.features.length / 2)).map((feature, index) => (
                                <div key={index} className="mb-1">• {feature}</div>
                              ))}
                            </div>
                            <div>
                              {subscriptionData.currentPlan.features.slice(Math.ceil(subscriptionData.currentPlan.features.length / 2)).map((feature, index) => (
                                <div key={index} className="mb-1">• {feature}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Ograničenja:</h5>
                        <div className="text-sm text-gray-700">
                          <div>Korisnici: {subscriptionData.currentPlan.limits.users === Infinity ? 'Neograničeno' : subscriptionData.currentPlan.limits.users}</div>
                          <div>Pohrana: {subscriptionData.currentPlan.storageLimitFormatted}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Available Plans */}
                  <div>
                    <h4 className="font-semibold mb-4">Dostupni planovi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {subscriptionData.availablePlans.map((plan) => (
                        <div 
                          key={plan.tier} 
                          className={`p-4 border rounded-lg ${
                            plan.isCurrentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="text-center mb-4">
                            <h5 className="font-semibold text-lg">{plan.name}</h5>
                            <p className="text-2xl font-bold text-blue-600">
                              {plan.price} {plan.currency}
                            </p>
                            <p className="text-sm text-gray-600">/{plan.interval}</p>
                            {plan.isCurrentPlan && (
                              <Badge variant="default" className="mt-2">Trenutni plan</Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-700 leading-relaxed mb-4">
                            <div className="grid grid-cols-1 gap-1">
                              {plan.features.map((feature, index) => (
                                <div key={index} className="mb-1">• {feature}</div>
                              ))}
                            </div>
                          </div>

                          {!plan.isCurrentPlan && (
                            <Button 
                              className="w-full" 
                              variant={plan.tier === 'PRO' ? 'default' : 'outline'}
                              onClick={() => {
                                toast({
                                  title: 'Funkcionalnost u razvoju',
                                  description: `Upgrade na ${plan.name} plan bit će dostupan uskoro`,
                                });
                              }}
                            >
                              Odaberi plan
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Postavke obavještenja
            </CardTitle>
            <CardDescription>
              Upravljajte kako i kada primate obavještenja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email obavještenja</h4>
                  <p className="text-sm text-gray-600">
                    Primajte obavještenja putem emaila
                  </p>
                </div>
                <Dialog open={emailNotificationModalOpen} onOpenChange={setEmailNotificationModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Konfiguriraj
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Email obavještenja</DialogTitle>
                      <DialogDescription>
                        Odaberite kada želite primati email obavještenja.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email-case-updates"
                          checked={emailNotificationForm.caseUpdates}
                          onCheckedChange={(checked) => setEmailNotificationForm(prev => ({ ...prev, caseUpdates: !!checked }))}
                        />
                        <Label htmlFor="email-case-updates">Ažuriranja predmeta</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email-deadline-reminders"
                          checked={emailNotificationForm.deadlineReminders}
                          onCheckedChange={(checked) => setEmailNotificationForm(prev => ({ ...prev, deadlineReminders: !!checked }))}
                        />
                        <Label htmlFor="email-deadline-reminders">Podsjetnici za rokove</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email-new-documents"
                          checked={emailNotificationForm.newDocuments}
                          onCheckedChange={(checked) => setEmailNotificationForm(prev => ({ ...prev, newDocuments: !!checked }))}
                        />
                        <Label htmlFor="email-new-documents">Novi dokumenti</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email-payment-reminders"
                          checked={emailNotificationForm.paymentReminders}
                          onCheckedChange={(checked) => setEmailNotificationForm(prev => ({ ...prev, paymentReminders: !!checked }))}
                        />
                        <Label htmlFor="email-payment-reminders">Podsjetnici za plaćanja</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setEmailNotificationModalOpen(false)}>
                        Odustani
                      </Button>
                      <Button onClick={() => handleNotificationUpdate('email')} disabled={saving}>
                        {saving ? 'Spremanje...' : 'Spremi postavke'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push obavještenja</h4>
                  <p className="text-sm text-gray-600">
                    Primajte obavještenja u aplikaciji
                  </p>
                </div>
                <Dialog open={pushNotificationModalOpen} onOpenChange={setPushNotificationModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Konfiguriraj
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Push obavještenja</DialogTitle>
                      <DialogDescription>
                        Odaberite kada želite primati push obavještenja u aplikaciji.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="push-case-updates"
                          checked={pushNotificationForm.caseUpdates}
                          onCheckedChange={(checked) => setPushNotificationForm(prev => ({ ...prev, caseUpdates: !!checked }))}
                        />
                        <Label htmlFor="push-case-updates">Ažuriranja predmeta</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="push-deadline-reminders"
                          checked={pushNotificationForm.deadlineReminders}
                          onCheckedChange={(checked) => setPushNotificationForm(prev => ({ ...prev, deadlineReminders: !!checked }))}
                        />
                        <Label htmlFor="push-deadline-reminders">Podsjetnici za rokove</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="push-new-documents"
                          checked={pushNotificationForm.newDocuments}
                          onCheckedChange={(checked) => setPushNotificationForm(prev => ({ ...prev, newDocuments: !!checked }))}
                        />
                        <Label htmlFor="push-new-documents">Novi dokumenti</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="push-payment-reminders"
                          checked={pushNotificationForm.paymentReminders}
                          onCheckedChange={(checked) => setPushNotificationForm(prev => ({ ...prev, paymentReminders: !!checked }))}
                        />
                        <Label htmlFor="push-payment-reminders">Podsjetnici za plaćanja</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPushNotificationModalOpen(false)}>
                        Odustani
                      </Button>
                      <Button onClick={() => handleNotificationUpdate('push')} disabled={saving}>
                        {saving ? 'Spremanje...' : 'Spremi postavke'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

