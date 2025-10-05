'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Key, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function Verify2FAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);

  const email = searchParams.get('email');
  const sessionId = searchParams.get('sessionId');

  // Countdown timer for TOTP
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Molimo unesite kod');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: code.trim(),
          sessionId: sessionId,
          email: email
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 2FA verified successfully - complete login
        const completeLoginResponse = await fetch('/api/auth/2fa/complete-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            sessionId: sessionId
          }),
        });

        const completeLoginData = await completeLoginResponse.json();

        if (completeLoginResponse.ok && completeLoginData.success) {
          // 2FA completed successfully - create NextAuth session
          const signInResult = await signIn('credentials', {
            email: email,
            password: '2fa-verified', // Special password for 2FA flow
            redirect: false,
          });

          if (signInResult?.ok) {
            toast({
              title: 'Uspjeh',
              description: '2FA kod je verificiran i prijavljeni ste'
            });
            
            // Redirect to dashboard
            router.push('/dashboard');
            router.refresh();
          } else {
            setError('Greška pri kreiranju sesije');
          }
        } else {
          setError(completeLoginData.error || 'Greška pri dovršavanju prijave');
        }
      } else {
        setError(data.error || 'Neispravan kod');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError('Greška pri verifikaciji koda');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // For users who don't have 2FA enabled, allow them to proceed
    router.push('/dashboard');
    router.refresh();
  };

  if (!email || !sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Neispravan pristup</h2>
              <p className="text-gray-600 mb-4">
                Ova stranica zahtijeva valjanu sesiju za verifikaciju 2FA.
              </p>
              <Button onClick={() => router.push('/sign-in')}>
                Povratak na prijavu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Dvofaktorska autentifikacija</CardTitle>
            <CardDescription>
              Unesite 6-znamenkasti kod iz aplikacije za autentifikaciju
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Kod za autentifikaciju</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-widest"
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">
                Vrijeme do sljedećeg koda: {timeRemaining}s
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Rezervni kod</h4>
                  <p className="text-sm text-blue-800">
                    Ako nemate pristup aplikaciji, možete koristiti rezervni kod.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full"
              >
                {loading ? 'Provjera...' : 'Potvrdi kod'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="w-full"
              >
                Preskoči 2FA
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Učitavanje...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <Verify2FAContent />
    </Suspense>
  );
}
