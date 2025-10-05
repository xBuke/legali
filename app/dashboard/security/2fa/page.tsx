'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, QrCode, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export default function TwoFactorSetupPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      initializeSetup();
    }
  }, [session]);

  const initializeSetup = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setSetup(data.data);
      } else {
        toast({
          title: 'Greška',
          description: data.error || 'Greška pri postavljanju 2FA',
          variant: 'destructive'
        });
        router.push('/dashboard/security');
      }
    } catch (error) {
      console.error('Error initializing 2FA setup:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri postavljanju 2FA',
        variant: 'destructive'
      });
      router.push('/dashboard/security');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: 'Greška',
        description: 'Molimo unesite kod',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('complete');
        toast({
          title: 'Uspjeh',
          description: '2FA je uspješno postavljena!'
        });
      } else {
        toast({
          title: 'Greška',
          description: data.error || 'Neispravan kod',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri verifikaciji koda',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard/security');
  };

  if (loading && !setup) {
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
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Postavite 2FA</h1>
        <p className="text-gray-600 mt-2">
          Dvofaktorska autentifikacija za dodatnu sigurnost
        </p>
      </div>

      {step === 'setup' && setup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Korak 1: Skenirajte QR kod
            </CardTitle>
            <CardDescription>
              Otvorite aplikaciju za autentifikaciju na svom telefonu i skenirajte QR kod
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <img 
                src={setup.qrCodeUrl} 
                alt="QR kod za 2FA" 
                className="mx-auto border rounded-lg"
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Preporučene aplikacije:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Google Authenticator (Android/iOS)</li>
                <li>• Microsoft Authenticator (Android/iOS)</li>
                <li>• Authy (Android/iOS)</li>
                <li>• 1Password (Android/iOS)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Važno:</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Spremite rezervne kodove na sigurno mjesto. Trebat će vam ako izgubite telefon.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/dashboard/security')}>
                Odustani
              </Button>
              <Button onClick={() => setStep('verify')}>
                Dalje
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'verify' && setup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Korak 2: Potvrdite postavljanje
            </CardTitle>
            <CardDescription>
              Unesite 6-znamenkasti kod iz aplikacije za autentifikaciju
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Kod za autentifikaciju</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Rezervni kodovi:</h4>
              <div className="grid grid-cols-2 gap-2">
                {setup.backupCodes.map((code, index) => (
                  <code key={index} className="bg-white p-2 rounded border text-sm font-mono">
                    {code}
                  </code>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                ⚠️ Spremite ove kodove na sigurno mjesto. Svaki kod se može koristiti samo jednom.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('setup')}>
                Natrag
              </Button>
              <Button onClick={handleVerification} disabled={loading}>
                {loading ? 'Provjera...' : 'Potvrdi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              2FA je uspješno postavljena!
            </CardTitle>
            <CardDescription>
              Vaš račun je sada zaštićen dvofaktorskom autentifikacijom
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Što slijedi:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Pri svakoj prijavi trebat ćete unijeti kod iz aplikacije</li>
                <li>• Koristite rezervne kodove ako izgubite telefon</li>
                <li>• Možete upravljati 2FA postavkama u sigurnosnim postavkama</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleComplete}>
                Završi postavljanje
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

