'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Shield, Bell, Globe, Database } from 'lucide-react';
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

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Here you would implement profile update API
      toast({
        title: 'Uspjeh',
        description: 'Profil je uspješno ažuriran'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri ažuriranju profila',
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
                    defaultValue={user?.firstName || ''}
                    placeholder="Vaše ime"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Prezime</Label>
                  <Input
                    id="lastName"
                    defaultValue={user?.lastName || ''}
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
                <Button variant="outline" size="sm">
                  Promijeni lozinku
                </Button>
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
                  Test Law Firm
                </p>
                <Button variant="outline" size="sm">
                  Uredi organizaciju
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Članovi tima</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Upravljajte članovima vašeg tima
                </p>
                <Button variant="outline" size="sm">
                  Upravljaj članovima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <Button variant="outline" size="sm">
                  Konfiguriraj
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push obavještenja</h4>
                  <p className="text-sm text-gray-600">
                    Primajte obavještenja u aplikaciji
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Konfiguriraj
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

