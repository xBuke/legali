'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  invoiceTotal: number;
  currentPaidAmount: number;
  onPaymentCreated: () => void;
}

interface PaymentFormData {
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  status: string;
}

export function PaymentForm({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  invoiceTotal,
  currentPaidAmount,
  onPaymentCreated,
}: PaymentFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: '',
    reference: '',
    notes: '',
    status: 'CONFIRMED',
  });

  const maxAmount = invoiceTotal - currentPaidAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.paymentMethod) {
      toast({
        title: 'Greška',
        description: 'Iznos i način plaćanja su obavezni',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: 'Greška',
        description: 'Iznos mora biti veći od 0',
        variant: 'destructive',
      });
      return;
    }

    if (amount > maxAmount) {
      toast({
        title: 'Greška',
        description: `Iznos ne može biti veći od ${maxAmount.toFixed(2)} EUR`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          amount,
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          reference: formData.reference || null,
          notes: formData.notes || null,
          status: formData.status,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Plaćanje je uspješno dodano',
        });
        onPaymentCreated();
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri dodavanju plaćanja',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri dodavanju plaćanja',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      paymentMethod: '',
      reference: '',
      notes: '',
      status: 'CONFIRMED',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj plaćanje</DialogTitle>
          <DialogDescription>
            Dodajte novo plaćanje za račun {invoiceNumber}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Iznos (EUR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maksimalno: {maxAmount.toFixed(2)} EUR
              </p>
            </div>
            
            <div>
              <Label htmlFor="paymentDate">Datum plaćanja</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Način plaćanja</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Odaberite način plaćanja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bankovni transfer</SelectItem>
                <SelectItem value="CASH">Gotovina</SelectItem>
                <SelectItem value="CARD">Kartica</SelectItem>
                <SelectItem value="CHECK">Ček</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reference">Referenca</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Broj transakcije ili referenca"
            />
          </div>

          <div>
            <Label htmlFor="notes">Napomene</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Dodatne napomene..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIRMED">Potvrđeno</SelectItem>
                <SelectItem value="PENDING">Na čekanju</SelectItem>
                <SelectItem value="FAILED">Neuspješno</SelectItem>
                <SelectItem value="REFUNDED">Vraćeno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Odustani
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Spremanje...' : 'Dodaj plaćanje'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
