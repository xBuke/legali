import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/expenses - List all expenses for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const category = searchParams.get('category');
    const isBillable = searchParams.get('isBillable');
    const isBilled = searchParams.get('isBilled');

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

    if (caseId) {
      where.caseId = caseId;
    }

    if (category) {
      where.category = category;
    }

    if (isBillable !== null && isBillable !== undefined) {
      where.isBillable = isBillable === 'true';
    }

    if (isBilled !== null && isBilled !== undefined) {
      where.isBilled = isBilled === 'true';
    }

    const expenses = await db.expense.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
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
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju troškova' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const body = await request.json();
    const {
      caseId,
      date,
      description,
      category,
      amount,
      receiptUrl,
      isBillable = true,
    } = body;

    // Validation
    if (!description || !category || !amount) {
      return NextResponse.json(
        { error: 'Opis, kategorija i iznos su obavezni' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Iznos mora biti veći od 0' },
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

    // Verify case exists and belongs to organization (if provided)
    if (caseId) {
      const caseExists = await db.case.findFirst({
        where: {
          id: caseId,
          organizationId: user.organizationId,
        }
      });

      if (!caseExists) {
        return NextResponse.json(
          { error: 'Predmet nije pronađen' },
          { status: 404 }
        );
      }
    }

    // Create expense
    const expense = await db.expense.create({
      data: {
        caseId: caseId || null,
        date: date ? new Date(date) : new Date(),
        description,
        category,
        amount,
        receiptUrl: receiptUrl || null,
        isBillable,
        organizationId: user.organizationId,
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
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
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          }
        }
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Greška pri stvaranju troška' },
      { status: 500 }
    );
  }
}
