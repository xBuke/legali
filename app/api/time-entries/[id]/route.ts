import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/time-entries/[id] - Get single time entry
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

    const timeEntry = await db.timeEntry.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
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
            status: true,
          }
        }
      }
    });

    if (!timeEntry) {
      return NextResponse.json({ error: 'Unos vremena nije pronađen' }, { status: 404 });
    }

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error('Error fetching time entry:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju unosa vremena' },
      { status: 500 }
    );
  }
}

// PATCH /api/time-entries/[id] - Update time entry
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
      duration,
      description,
      hourlyRate,
      isBillable,
    } = body;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Check if time entry exists and belongs to organization
    const existingTimeEntry = await db.timeEntry.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      }
    });

    if (!existingTimeEntry) {
      return NextResponse.json({ error: 'Unos vremena nije pronađen' }, { status: 404 });
    }

    // Check if time entry is already billed
    if (existingTimeEntry.isBilled) {
      return NextResponse.json(
        { error: 'Ne možete uređivati već naplaćene unose vremena' },
        { status: 400 }
      );
    }

    // Verify case belongs to organization if provided
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

    // Calculate amount if duration or hourlyRate changed
    let amount = existingTimeEntry.amount;
    if (duration !== undefined || hourlyRate !== undefined) {
      const finalDuration = duration !== undefined ? duration : existingTimeEntry.duration;
      const finalHourlyRate = hourlyRate !== undefined ? hourlyRate : existingTimeEntry.hourlyRate;
      amount = (finalDuration / 60) * finalHourlyRate;
    }

    // Update time entry
    const updatedTimeEntry = await db.timeEntry.update({
      where: { id: params.id },
      data: {
        ...(caseId !== undefined && { caseId: caseId || null }),
        ...(date && { date: new Date(date) }),
        ...(duration !== undefined && { duration }),
        ...(description && { description }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(isBillable !== undefined && { isBillable }),
        ...(amount !== existingTimeEntry.amount && { amount }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
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
            status: true,
          }
        }
      }
    });

    return NextResponse.json(updatedTimeEntry);
  } catch (error) {
    console.error('Error updating time entry:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju unosa vremena' },
      { status: 500 }
    );
  }
}

// DELETE /api/time-entries/[id] - Delete time entry
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

    // Check if time entry exists and belongs to organization
    const timeEntry = await db.timeEntry.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      }
    });

    if (!timeEntry) {
      return NextResponse.json({ error: 'Unos vremena nije pronađen' }, { status: 404 });
    }

    // Check if time entry is already billed
    if (timeEntry.isBilled) {
      return NextResponse.json(
        { error: 'Ne možete brisati već naplaćene unose vremena' },
        { status: 400 }
      );
    }

    // Delete time entry
    await db.timeEntry.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Unos vremena je uspješno obrisan' });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju unosa vremena' },
      { status: 500 }
    );
  }
}
