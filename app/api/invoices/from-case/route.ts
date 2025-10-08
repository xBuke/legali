import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/invoices/from-case?caseId=xxx
 * Preview unbilled time entries for a case
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: 'ID predmeta je obavezan' },
        { status: 400 }
      );
    }

    // Verify case exists
    const caseData = await db.case.findFirst({
      where: {
        id: caseId,
        organizationId: user.organizationId,
        deletedAt: null
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            clientType: true
          }
        }
      }
    });

    if (!caseData) {
      return NextResponse.json(
        { error: 'Predmet nije pronađen' },
        { status: 404 }
      );
    }

    // Find unbilled time entries
    const timeEntries = await db.timeEntry.findMany({
      where: {
        caseId: caseId,
        isBillable: true,
        isBilled: false,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Calculate summary
    const subtotal = timeEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const taxRate = 25.0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60;

    return NextResponse.json({
      case: caseData,
      timeEntries,
      summary: {
        totalEntries: timeEntries.length,
        totalHours,
        subtotal,
        taxRate,
        taxAmount,
        total
      }
    });

  } catch (error) {
    console.error('Error fetching unbilled time:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju podataka' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices/from-case
 * Generate invoice from unbilled time entries for a case
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Neovlašten pristup - potrebna je autentifikacija' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { caseId, notes, terms } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: 'ID predmeta je obavezan' },
        { status: 400 }
      );
    }

    // Verify case exists and belongs to organization
    const caseData = await db.case.findFirst({
      where: {
        id: caseId,
        organizationId: user.organizationId,
        deletedAt: null
      },
      include: {
        client: true
      }
    });

    if (!caseData) {
      return NextResponse.json(
        { error: 'Predmet nije pronađen' },
        { status: 404 }
      );
    }

    // Find all unbilled time entries for this case
    const timeEntries = await db.timeEntry.findMany({
      where: {
        caseId: caseId,
        isBillable: true,
        isBilled: false,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    if (timeEntries.length === 0) {
      return NextResponse.json(
        { error: 'Nema nenaplaćenih unosa vremena za ovaj predmet' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = timeEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const taxRate = 25.0; // Croatian PDV
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Generate invoice number
    const invoiceCount = await db.invoice.count({
      where: {
        organizationId: user.organizationId
      }
    });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate,
        subtotal,
        taxRate,
        taxAmount,
        total,
        amountPaid: 0,
        notes: notes || `Račun za predmet: ${caseData.caseNumber} - ${caseData.title}`,
        terms: terms || 'Plaćanje u roku od 14 dana',
        clientId: caseData.clientId,
        organizationId: user.organizationId
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            clientType: true
          }
        }
      }
    });

    // Update all time entries to mark them as billed
    await db.timeEntry.updateMany({
      where: {
        id: {
          in: timeEntries.map(entry => entry.id)
        }
      },
      data: {
        isBilled: true,
        invoiceId: invoice.id
      }
    });

    return NextResponse.json({
      invoice,
      timeEntries: timeEntries.length,
      message: `Račun kreiran za ${timeEntries.length} unosa vremena`
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating invoice from case:', error);
    return NextResponse.json(
      { error: 'Greška pri kreiranju računa' },
      { status: 500 }
    );
  }
}
