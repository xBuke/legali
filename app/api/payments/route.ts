import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/payments - List all payments for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const status = searchParams.get('status');

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Build where clause
    const where: any = {
      organizationId: user.organizationId,
    };

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (status) {
      where.status = status;
    }

    const payments = await db.payment.findMany({
      where,
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
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju plaćanja' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const body = await request.json();
    const {
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      reference,
      notes,
      status = 'CONFIRMED',
    } = body;

    // Validation
    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Račun, iznos i način plaćanja su obavezni' },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Verify invoice exists and belongs to organization
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: user.organizationId,
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Račun nije pronađen' },
        { status: 404 }
      );
    }

    // Check if payment amount doesn't exceed invoice total
    const currentPaidAmount = await db.payment.aggregate({
      where: {
        invoiceId: invoiceId,
        status: 'CONFIRMED',
      },
      _sum: {
        amount: true,
      }
    });

    const totalPaid = (currentPaidAmount._sum.amount || 0) + amount;
    if (totalPaid > invoice.total) {
      return NextResponse.json(
        { error: 'Iznos plaćanja ne može biti veći od ukupnog iznosa računa' },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        amount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod,
        reference,
        notes,
        status,
        invoiceId,
        organizationId: user.organizationId,
        createdById: user.id,
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

    // Update invoice payment status
    const newTotalPaid = totalPaid;
    let invoiceStatus = invoice.status;
    
    if (newTotalPaid >= invoice.total) {
      invoiceStatus = 'PAID';
    } else if (newTotalPaid > 0) {
      invoiceStatus = 'PARTIAL';
    }

    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newTotalPaid,
        status: invoiceStatus,
        paidDate: newTotalPaid >= invoice.total ? new Date() : invoice.paidDate,
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Greška pri stvaranju plaćanja' },
      { status: 500 }
    );
  }
}
