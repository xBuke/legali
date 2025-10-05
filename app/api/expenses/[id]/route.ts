import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/expenses/[id] - Get a specific expense
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

    const expense = await db.expense.findFirst({
      where: {
        id: params.id,
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

    if (!expense) {
      return NextResponse.json({ error: 'Trošak nije pronađen' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju troška' },
      { status: 500 }
    );
  }
}

// PATCH /api/expenses/[id] - Update an expense
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
      caseId,
      date,
      description,
      category,
      amount,
      receiptUrl,
      isBillable,
    } = body;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Check if expense exists and belongs to organization
    const existingExpense = await db.expense.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      }
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Trošak nije pronađen' }, { status: 404 });
    }

    // Check if expense is already billed
    if (existingExpense.isBilled) {
      return NextResponse.json(
        { error: 'Ne možete uređivati već naplaćene troškove' },
        { status: 400 }
      );
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

    const updateData: any = {};
    if (caseId !== undefined) updateData.caseId = caseId || null;
    if (date !== undefined) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = amount;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
    if (isBillable !== undefined) updateData.isBillable = isBillable;

    const expense = await db.expense.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju troška' },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete an expense
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

    // Check if expense exists and belongs to organization
    const expense = await db.expense.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Trošak nije pronađen' }, { status: 404 });
    }

    // Check if expense is already billed
    if (expense.isBilled) {
      return NextResponse.json(
        { error: 'Ne možete brisati već naplaćene troškove' },
        { status: 400 }
      );
    }

    // Delete the expense
    await db.expense.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Trošak je uspješno obrisan' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju troška' },
      { status: 500 }
    );
  }
}
