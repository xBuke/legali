import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/time-entries/[id] - Get a specific time entry
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

    const timeEntry = await prisma.timeEntry.findFirst({
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

// PATCH /api/time-entries/[id] - Update a time entry
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
      date,
      duration,
      description,
      hourlyRate,
      isBillable,
      caseId,
    } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    // Check if time entry exists and belongs to organization
    const existingTimeEntry = await prisma.timeEntry.findFirst({
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
      const caseExists = await prisma.case.findFirst({
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

    // Calculate new amount if duration or rate changed
    const newDuration = duration !== undefined ? parseInt(duration) : existingTimeEntry.duration;
    const newRate = hourlyRate !== undefined ? hourlyRate : existingTimeEntry.hourlyRate;
    const newAmount = (newDuration / 60) * newRate;

    const updateData: any = {};
    if (date !== undefined) updateData.date = new Date(date);
    if (duration !== undefined) updateData.duration = newDuration;
    if (description !== undefined) updateData.description = description;
    if (hourlyRate !== undefined) updateData.hourlyRate = newRate;
    if (isBillable !== undefined) updateData.isBillable = isBillable;
    if (caseId !== undefined) updateData.caseId = caseId;
    updateData.amount = newAmount;

    const timeEntry = await prisma.timeEntry.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error('Error updating time entry:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju unosa vremena' },
      { status: 500 }
    );
  }
}

// DELETE /api/time-entries/[id] - Delete a time entry
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

    // Check if time entry exists and belongs to organization
    const timeEntry = await prisma.timeEntry.findFirst({
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

    await prisma.timeEntry.delete({
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
