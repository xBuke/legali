'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Unlock
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  twoFactorEnabled: boolean;
  twoFactorVerifiedAt: string | null;
  backupCodes: string[] | null;
}

export default function SecurityPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session, fetchUserData]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Greška',
        description: 'Neuspješno učitavanje podataka korisnika',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = () => {
    router.push('/dashboard/security/2fa');
  };

  const handleDisable2FA = async () => {
    if (!confirm(t('security.twoFactor.disableConfirm'))) {
      return;
    }

    try {
      const code = prompt(t('security.twoFactor.enterCode'));
      if (!code) return;

      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('security.twoFactor.disableSuccess')
        });
        fetchUserData();
      } else {
        toast({
          title: t('common.error'),
          description: data.error || t('security.twoFactor.disableError'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: t('common.error'),
        description: t('errors.serverError'),
        variant: 'destructive'
      });
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!confirm(t('security.backupCodes.regenerateConfirm'))) {
      return;
    }

    try {
      const response = await fetch('/api/auth/2fa/regenerate-codes', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('security.backupCodes.regenerateSuccess')
        });
        setUser(prev => prev ? { ...prev, backupCodes: data.data.backupCodes } : null);
        setShowBackupCodes(true);
      } else {
        toast({
          title: t('common.error'),
          description: data.error || t('security.backupCodes.regenerateError'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      toast({
        title: t('common.error'),
        description: t('security.backupCodes.regenerateError'),
        variant: 'destructive'
      });
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
          <Shield className="h-8 w-8 text-primary" />
          {t('navigation.security')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security settings and authentication methods
        </p>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.twoFactorEnabled ? 'Protected' : 'Basic'}
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.twoFactorEnabled ? '2FA enabled' : 'Password only'}
            </p>
            <Progress 
              value={user?.twoFactorEnabled ? 100 : 50} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Codes</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.backupCodes?.length || 0}/8
            </div>
            <p className="text-xs text-muted-foreground">
              Remaining codes
            </p>
            <Progress 
              value={((user?.backupCodes?.length || 0) / 8) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.twoFactorVerifiedAt ? 
                new Date(user.twoFactorVerifiedAt).toLocaleDateString() : 
                'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              2FA activated
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {/* 2FA Status Card */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Two-Factor Authentication (2FA)
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <StatusBadge 
                  status={user?.twoFactorEnabled ? 'active' : 'pending'} 
                  showDot 
                />
                <div>
                  <p className="font-medium">
                    {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  {user?.twoFactorEnabled && user?.twoFactorVerifiedAt && (
                    <p className="text-sm text-muted-foreground">
                      Activated: {new Date(user.twoFactorVerifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {user?.twoFactorEnabled ? (
                  <Button variant="destructive" onClick={handleDisable2FA}>
                    <Unlock className="h-4 w-4 mr-2" />
                    Disable 2FA
                  </Button>
                ) : (
                  <Button onClick={handleEnable2FA}>
                    <Lock className="h-4 w-4 mr-2" />
                    Enable 2FA
                  </Button>
                )}
              </div>
            </div>
            
            {user?.twoFactorEnabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Your account is protected with two-factor authentication
                </div>
                <Progress value={100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Codes Card */}
        {user?.twoFactorEnabled && (
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Backup Codes
              </CardTitle>
              <CardDescription>
                Use these codes if you lose access to your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge 
                      status={user.backupCodes?.length && user.backupCodes.length > 0 ? 'active' : 'pending'} 
                      showDot 
                    />
                    <span className="text-sm text-muted-foreground">
                      Remaining codes: {user.backupCodes?.length || 0}/8
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                    >
                      {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showBackupCodes ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateBackupCodes}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
                
                {user.backupCodes && user.backupCodes.length > 0 && (
                  <div className="space-y-2">
                    <Progress 
                      value={(user.backupCodes.length / 8) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {user.backupCodes.length} backup codes remaining
                    </p>
                  </div>
                )}
                
                {showBackupCodes && user.backupCodes && (
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <p className="text-sm font-medium mb-2">Your backup codes:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {user.backupCodes.map((code, index) => (
                        <code key={index} className="bg-white p-2 rounded border text-sm font-mono">
                          {code}
                        </code>
                      ))}
                    </div>
                    <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-800">
                        Save these codes in a secure place. Each code can only be used once.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Sigurnosni savjeti</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Koristite jaku lozinku s najmanje 12 znakova</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Omogućite 2FA za dodatnu sigurnost</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Spremite rezervne kodove na sigurno mjesto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Nikad ne dijelite svoje sigurnosne kodove</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Redovito ažurirajte aplikaciju za autentifikaciju</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

