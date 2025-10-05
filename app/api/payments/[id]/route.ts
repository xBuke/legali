import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/payments/[id] - Get a specific payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    const payment = await db.payment.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Plaćanje nije pronađeno' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju plaćanja' },
      { status: 500 }
    );
  }
}

// PATCH /api/payments/[id] - Update a payment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      paymentDate,
      paymentMethod,
      reference,
      notes,
      status,
    } = body;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Check if payment exists and belongs to organization
    const existingPayment = await db.payment.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        invoice: true
      }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Plaćanje nije pronađeno' }, { status: 404 });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (paymentDate !== undefined) updateData.paymentDate = new Date(paymentDate);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (reference !== undefined) updateData.reference = reference;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const payment = await db.payment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // Recalculate invoice payment status
    const allPayments = await db.payment.aggregate({
      where: {
        invoiceId: existingPayment.invoiceId,
        status: 'CONFIRMED',
      },
      _sum: {
        amount: true,
      }
    });

    const totalPaid = allPayments._sum.amount || 0;
    let invoiceStatus = existingPayment.invoice.status;
    
    if (totalPaid >= existingPayment.invoice.total) {
      invoiceStatus = 'PAID';
    } else if (totalPaid > 0) {
      invoiceStatus = 'PARTIAL';
    } else {
      invoiceStatus = 'SENT';
    }

    await db.invoice.update({
      where: { id: existingPayment.invoiceId },
      data: {
        amountPaid: totalPaid,
        status: invoiceStatus,
        paidDate: totalPaid >= existingPayment.invoice.total ? new Date() : null,
      }
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju plaćanja' },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/[id] - Delete a payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Check if payment exists and belongs to organization
    const payment = await db.payment.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        invoice: true
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Plaćanje nije pronađeno' }, { status: 404 });
    }

    // Delete the payment
    await db.payment.delete({
      where: { id: params.id }
    });

    // Recalculate invoice payment status
    const allPayments = await db.payment.aggregate({
      where: {
        invoiceId: payment.invoiceId,
        status: 'CONFIRMED',
      },
      _sum: {
        amount: true,
      }
    });

    const totalPaid = allPayments._sum.amount || 0;
    let invoiceStatus = payment.invoice.status;
    
    if (totalPaid >= payment.invoice.total) {
      invoiceStatus = 'PAID';
    } else if (totalPaid > 0) {
      invoiceStatus = 'PARTIAL';
    } else {
      invoiceStatus = 'SENT';
    }

    await db.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        amountPaid: totalPaid,
        status: invoiceStatus,
        paidDate: totalPaid >= payment.invoice.total ? new Date() : null,
      }
    });

    return NextResponse.json({ message: 'Plaćanje je uspješno obrisano' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju plaćanja' },
      { status: 500 }
    );
  }
}
