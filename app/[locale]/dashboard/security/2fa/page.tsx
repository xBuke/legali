'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  QrCode, 
  Key, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Copy,
  Download,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export default function TwoFactorSetupPage() {
  const t = useTranslations();
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSetup(data.data);
      } else {
        toast({
          title: t('common.error'),
          description: data.error || t('security.twoFactor.setupError'),
          variant: 'destructive'
        });
        router.push('/dashboard/security');
      }
    } catch (error) {
      console.error('Error initializing 2FA setup:', error);
      toast({
        title: t('common.error'),
        description: t('security.twoFactor.setupError'),
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
        title: t('common.error'),
        description: t('security.twoFactor.enterCodeError'),
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
          title: t('common.success'),
          description: t('security.twoFactor.verificationSuccess')
        });
      } else {
        toast({
          title: t('common.error'),
          description: data.error || t('security.twoFactor.verificationError'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast({
        title: t('common.error'),
        description: t('errors.serverError'),
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/security')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('navigation.security')}</h1>
          <p className="text-muted-foreground">{t('security.twoFactor.title')}</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={step === 'setup' ? 'font-medium' : 'text-muted-foreground'}>
            {t('security.twoFactor.setup')}
          </span>
          <span className={step === 'verify' ? 'font-medium' : 'text-muted-foreground'}>
            {t('security.twoFactor.verify')}
          </span>
          <span className={step === 'complete' ? 'font-medium' : 'text-muted-foreground'}>
            {t('security.twoFactor.complete')}
          </span>
        </div>
        <Progress 
          value={step === 'setup' ? 33 : step === 'verify' ? 66 : 100} 
          className="h-2"
        />
      </div>

      {/* Setup Step */}
      {step === 'setup' && setup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {t('security.twoFactor.setup')}
            </CardTitle>
            <CardDescription>
              {t('security.twoFactor.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border">
                <img 
                  src={setup.qrCodeUrl} 
                  alt="2FA QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('security.twoFactor.manualEntry')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={setup.secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(setup.secret);
                    toast({
                      title: t('common.success'),
                      description: t('security.twoFactor.secretCopied')
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">{t('security.twoFactor.recommendedApps')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('security.twoFactor.appsDescription')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">{t('security.twoFactor.important')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('security.twoFactor.backupWarning')}
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setStep('verify')}
              className="w-full"
            >
              {t('common.next')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification Step */}
      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('security.twoFactor.verify')}
            </CardTitle>
            <CardDescription>
              {t('security.twoFactor.verifyDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="verification-code">
                {t('security.twoFactor.verificationCode')}
              </Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg font-mono"
              />
            </div>

            <Button 
              onClick={handleVerification}
              disabled={loading || verificationCode.length !== 6}
              className="w-full"
            >
              {loading ? t('common.loading') : t('security.twoFactor.verify')}
            </Button>

            {/* Backup Codes */}
            {setup?.backupCodes && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t('security.backupCodes.title')}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showBackupCodes ? t('security.backupCodes.hide') : t('security.backupCodes.show')}
                  </Button>
                </div>

                {showBackupCodes && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {setup.backupCodes.map((code, index) => (
                        <div
                          key={index}
                          className="p-2 bg-muted rounded text-center font-mono text-sm"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('security.backupCodes.warning')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('security.twoFactor.complete')}
            </CardTitle>
            <CardDescription>
              {t('security.twoFactor.completeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('security.twoFactor.success')}</h3>
                <p className="text-muted-foreground">
                  {t('security.twoFactor.successDescription')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">{t('security.twoFactor.whatsNext')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t('security.twoFactor.nextStep1')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t('security.twoFactor.nextStep2')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t('security.twoFactor.nextStep3')}
                </li>
              </ul>
            </div>

            <Button 
              onClick={handleComplete}
              className="w-full"
            >
              {t('security.twoFactor.complete')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}