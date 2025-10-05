'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  twoFactorEnabled: boolean;
  twoFactorVerifiedAt: string | null;
  backupCodes: string[] | null;
}

export default function SecurityPage() {
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
  }, [session]);

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
    if (!confirm('Jeste li sigurni da želite onemogućiti 2FA? Ovo će smanjiti sigurnost vašeg računa.')) {
      return;
    }

    try {
      const code = prompt('Unesite 6-znamenkasti kod iz aplikacije za autentifikaciju ili rezervni kod:');
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
          title: 'Uspjeh',
          description: '2FA je uspješno onemogućena'
        });
        fetchUserData();
      } else {
        toast({
          title: 'Greška',
          description: data.error || 'Greška pri onemogućavanju 2FA',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri onemogućavanju 2FA',
        variant: 'destructive'
      });
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!confirm('Jeste li sigurni da želite regenerirati rezervne kodove? Stari kodovi neće više raditi.')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/2fa/regenerate-codes', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Rezervni kodovi su uspješno regenerirani'
        });
        setUser(prev => prev ? { ...prev, backupCodes: data.data.backupCodes } : null);
        setShowBackupCodes(true);
      } else {
        toast({
          title: 'Greška',
          description: data.error || 'Greška pri regeneriranju rezervnih kodova',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri regeneriranju rezervnih kodova',
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sigurnosne postavke</h1>
        <p className="text-gray-600 mt-2">
          Upravljajte sigurnosnim postavkama vašeg računa
        </p>
      </div>

      <div className="grid gap-6">
        {/* 2FA Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Dvofaktorska autentifikacija (2FA)
            </CardTitle>
            <CardDescription>
              Dodatna sigurnosna mjera za zaštitu vašeg računa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={user?.twoFactorEnabled ? 'default' : 'secondary'}>
                  {user?.twoFactorEnabled ? 'Omogućena' : 'Onemogućena'}
                </Badge>
                {user?.twoFactorEnabled && user?.twoFactorVerifiedAt && (
                  <span className="text-sm text-gray-600">
                    Aktivna od {new Date(user.twoFactorVerifiedAt).toLocaleDateString('hr-HR')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {user?.twoFactorEnabled ? (
                  <Button variant="outline" onClick={handleDisable2FA}>
                    Onemogući 2FA
                  </Button>
                ) : (
                  <Button onClick={handleEnable2FA}>
                    Omogući 2FA
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Codes Card */}
        {user?.twoFactorEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Rezervni kodovi
              </CardTitle>
              <CardDescription>
                Koristite ove kodove ako izgubite pristup aplikaciji za autentifikaciju
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Preostali kodovi: {user.backupCodes?.length || 0}/8
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                    >
                      {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showBackupCodes ? 'Sakrij' : 'Prikaži'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateBackupCodes}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regeneriraj
                    </Button>
                  </div>
                </div>
                
                {showBackupCodes && user.backupCodes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Vaši rezervni kodovi:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {user.backupCodes.map((code, index) => (
                        <code key={index} className="bg-white p-2 rounded border text-sm font-mono">
                          {code}
                        </code>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      ⚠️ Spremite ove kodove na sigurno mjesto. Svaki kod se može koristiti samo jednom.
                    </p>
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

