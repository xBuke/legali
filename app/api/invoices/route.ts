import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/invoices - List all invoices for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    // Get user's organization
    const user = await prisma.user.findUnique({
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

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
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
      },
      orderBy: {
        issueDate: 'desc'
      }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju računa' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientId,
      dueDate,
      notes,
      terms,
      timeEntryIds = [],
      expenseIds = [],
    } = body;

    // Validation
    if (!clientId || !dueDate) {
      return NextResponse.json(
        { error: 'Klijent i datum dospijeća su obavezni' },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: user.organizationId,
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Klijent nije pronađen' },
        { status: 404 }
      );
    }

    // Get time entries and expenses
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        id: { in: timeEntryIds },
        organizationId: user.organizationId,
        isBillable: true,
        isBilled: false,
      }
    });

    const expenses = await prisma.expense.findMany({
      where: {
        id: { in: expenseIds },
        organizationId: user.organizationId,
        isBillable: true,
        isBilled: false,
      }
    });

    // Calculate totals
    const timeEntriesTotal = timeEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const subtotal = timeEntriesTotal + expensesTotal;
    const taxRate = 25.00; // Croatian PDV
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    const invoiceNumber = lastInvoice 
      ? `INV-${String(parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1).padStart(6, '0')}`
      : 'INV-000001';

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        dueDate: new Date(dueDate),
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes,
        terms,
        clientId,
        organizationId: user.organizationId,
      }
    });

    // Update time entries and expenses to mark them as billed
    if (timeEntries.length > 0) {
      await prisma.timeEntry.updateMany({
        where: { id: { in: timeEntryIds } },
        data: { 
          isBilled: true,
          invoiceId: invoice.id 
        }
      });
    }

    if (expenses.length > 0) {
      await prisma.expense.updateMany({
        where: { id: { in: expenseIds } },
        data: { 
          isBilled: true,
          invoiceId: invoice.id 
        }
      });
    }

    // Return invoice with related data
    const createdInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
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

    return NextResponse.json(createdInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Greška pri stvaranju računa' },
      { status: 500 }
    );
  }
}
