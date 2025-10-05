import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/invoices/[id] - Get a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
            taxId: true,
          }
        },
        timeEntries: {
          select: {
            id: true,
            date: true,
            duration: true,
            description: true,
            hourlyRate: true,
            amount: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        expenses: {
          select: {
            id: true,
            date: true,
            description: true,
            category: true,
            amount: true,
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Račun nije pronađen' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju računa' },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices/[id] - Update an invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      dueDate,
      notes,
      terms,
      paidDate,
      amountPaid,
    } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Check if invoice exists and belongs to organization
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Račun nije pronađen' }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (notes !== undefined) updateData.notes = notes;
    if (terms !== undefined) updateData.terms = terms;
    if (paidDate !== undefined) updateData.paidDate = paidDate ? new Date(paidDate) : null;
    if (amountPaid !== undefined) updateData.amountPaid = amountPaid;

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
            taxId: true,
          }
        },
        timeEntries: {
          select: {
            id: true,
            date: true,
            duration: true,
            description: true,
            hourlyRate: true,
            amount: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        expenses: {
          select: {
            id: true,
            date: true,
            description: true,
            category: true,
            amount: true,
          }
        }
      }
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju računa' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Check if invoice exists and belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Račun nije pronađen' }, { status: 404 });
    }

    // Check if invoice is already paid
    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Ne možete brisati već plaćene račune' },
        { status: 400 }
      );
    }

    // Mark time entries and expenses as unbilled
    await prisma.timeEntry.updateMany({
      where: { invoiceId: params.id },
      data: { 
        isBilled: false,
        invoiceId: null 
      }
    });

    await prisma.expense.updateMany({
      where: { invoiceId: params.id },
      data: { 
        isBilled: false,
        invoiceId: null 
      }
    });

    // Delete the invoice
    await prisma.invoice.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Račun je uspješno obrisan' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju računa' },
      { status: 500 }
    );
  }
}
