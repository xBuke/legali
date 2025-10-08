'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  Settings, 
  User, 
  Shield, 
  Globe, 
  Database, 
  Eye, 
  EyeOff, 
  CreditCard, 
  Check, 
  X,
  Building2,
  Users,
  Palette,
  Bell,
  Key,
  HardDrive,
  Crown
} from 'lucide-react';
import { TeamMemberManagement } from '@/components/team/team-member-management';
import { ThemePicker } from '@/components/theme-picker';
import { LanguageSwitcher } from '@/components/language-switcher';

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
  const t = useTranslations();
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
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Lozinka je uspješno promijenjena'
        });
        setPasswordModalOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri promjeni lozinke');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Greška',
        description: error instanceof Error ? error.message : 'Greška pri promjeni lozinke',
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
      const response = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: organizationForm.name,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Uspjeh',
          description: 'Organizacija je uspješno ažurirana'
        });
        setOrganizationModalOpen(false);
        // Optionally refresh subscription data to reflect changes
        fetchUserData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri ažuriranju organizacije');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Greška',
        description: error instanceof Error ? error.message : 'Greška pri ažuriranju organizacije',
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          {t('navigation.settings')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and organization settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Change Password</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
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
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
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
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Change Password'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Settings
              </CardTitle>
              <CardDescription>
                Manage your organization information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOrganizationSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    value={organizationForm.name}
                    onChange={(e) => setOrganizationForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter organization name"
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage team members and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMemberManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {subscriptionData && (
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Subscription Plan
                </CardTitle>
                <CardDescription>
                  Current plan: {subscriptionData.currentPlan.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">€{subscriptionData.currentPlan.price}</div>
                    <div className="text-sm text-muted-foreground">per {subscriptionData.currentPlan.interval}</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{subscriptionData.currentPlan.limits.users}</div>
                    <div className="text-sm text-muted-foreground">users</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{subscriptionData.currentPlan.storageLimitFormatted}</div>
                    <div className="text-sm text-muted-foreground">storage</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Storage Usage</span>
                    <span>{subscriptionData.currentPlan.storageUsagePercentage}%</span>
                  </div>
                  <Progress value={subscriptionData.currentPlan.storageUsagePercentage} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {subscriptionData.currentPlan.storageUsedFormatted} of {subscriptionData.currentPlan.storageLimitFormatted} used
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Plan Features</h4>
                  <ul className="space-y-1">
                    {subscriptionData.currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge 
                    status={user?.twoFactorEnabled ? 'active' : 'pending'} 
                    showDot 
                  />
                  <Link href="/dashboard/security/2fa">
                    <Button variant="outline" size="sm">
                      {user?.twoFactorEnabled ? 'Manage' : 'Enable'}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize your interface appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Theme</h4>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                </div>
                <ThemePicker />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Language</h4>
                  <p className="text-sm text-muted-foreground">Select your preferred language</p>
                </div>
                <LanguageSwitcher />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

