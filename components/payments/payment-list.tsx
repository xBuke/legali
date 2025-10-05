'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  status: string;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  createdAt: string;
}

interface PaymentListProps {
  invoiceId: string;
  invoiceNumber: string;
  invoiceTotal: number;
  onPaymentsUpdated: () => void;
}

export function PaymentList({ invoiceId, invoiceNumber, invoiceTotal, onPaymentsUpdated }: PaymentListProps) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [invoiceId]);

  const loadPayments = async () => {
    try {
      const response = await fetch(`/api/payments?invoiceId=${invoiceId}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        toast({
          title: 'Greška',
          description: 'Greška pri učitavanju plaćanja',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju plaćanja',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovo plaćanje?')) {
      return;
    }

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Plaćanje je obrisano',
        });
        loadPayments();
        onPaymentsUpdated();
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Greška pri brisanju plaćanja',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Greška',
        description: 'Greška pri brisanju plaćanja',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONFIRMED: { variant: 'default' as const, label: 'Potvrđeno' },
      PENDING: { variant: 'secondary' as const, label: 'Na čekanju' },
      FAILED: { variant: 'destructive' as const, label: 'Neuspješno' },
      REFUNDED: { variant: 'outline' as const, label: 'Vraćeno' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CONFIRMED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodLabels = {
      BANK_TRANSFER: 'Bankovni transfer',
      CASH: 'Gotovina',
      CARD: 'Kartica',
      CHECK: 'Ček',
    };
    
    return methodLabels[method as keyof typeof methodLabels] || method;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: hr });
  };

  const totalPaid = payments
    .filter(p => p.status === 'CONFIRMED')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const remainingAmount = invoiceTotal - totalPaid;

  if (loading) {
    return <div className="text-center py-4">Učitavanje plaćanja...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold">{invoiceTotal.toFixed(2)} EUR</div>
          <div className="text-sm text-muted-foreground">Ukupno</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalPaid.toFixed(2)} EUR</div>
          <div className="text-sm text-muted-foreground">Plaćeno</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{remainingAmount.toFixed(2)} EUR</div>
          <div className="text-sm text-muted-foreground">Preostalo</div>
        </div>
      </div>

      {/* Add Payment Button */}
      {remainingAmount > 0 && (
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj plaćanje
        </Button>
      )}

      {/* Payments Table */}
      {payments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Iznos</TableHead>
              <TableHead>Način</TableHead>
              <TableHead>Referenca</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dodao</TableHead>
              <TableHead>Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                <TableCell className="font-medium">
                  {payment.amount.toFixed(2)} EUR
                </TableCell>
                <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                <TableCell>{payment.reference || '-'}</TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell>
                  {payment.createdBy.firstName} {payment.createdBy.lastName}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(payment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nema plaćanja za ovaj račun
        </div>
      )}

      {/* Add Payment Form */}
      {showAddForm && (
        <PaymentForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          invoiceId={invoiceId}
          invoiceNumber={invoiceNumber}
          invoiceTotal={invoiceTotal}
          currentPaidAmount={totalPaid}
          onPaymentCreated={() => {
            loadPayments();
            onPaymentsUpdated();
          }}
        />
      )}

      {/* Payment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalji plaćanja</DialogTitle>
            <DialogDescription>
              Pregled detalja plaćanja
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Iznos</label>
                  <p className="text-lg font-bold">{selectedPayment.amount.toFixed(2)} EUR</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Datum</label>
                  <p>{formatDate(selectedPayment.paymentDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Način plaćanja</label>
                  <p>{getPaymentMethodLabel(selectedPayment.paymentMethod)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div>{getStatusBadge(selectedPayment.status)}</div>
                </div>
                {selectedPayment.reference && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Referenca</label>
                    <p>{selectedPayment.reference}</p>
                  </div>
                )}
                {selectedPayment.notes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Napomene</label>
                    <p className="whitespace-pre-wrap">{selectedPayment.notes}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Dodao</label>
                  <p>{selectedPayment.createdBy.firstName} {selectedPayment.createdBy.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Datum kreiranja</label>
                  <p>{formatDate(selectedPayment.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import the PaymentForm component
import { PaymentForm } from './payment-form';
