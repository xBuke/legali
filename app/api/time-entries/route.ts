import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/time-entries - List time entries
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const isBillable = searchParams.get('isBillable');
    const isBilled = searchParams.get('isBilled');

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    const where: any = {
      organizationId: user.organizationId,
    };

    if (caseId) {
      where.caseId = caseId;
    }

    if (isBillable !== null) {
      where.isBillable = isBillable === 'true';
    }

    if (isBilled !== null) {
      where.isBilled = isBilled === 'true';
    }

    const timeEntries = await db.timeEntry.findMany({
      where,
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
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju unosa vremena' },
      { status: 500 }
    );
  }
}

// POST /api/time-entries - Create a new time entry
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
      duration,
      description,
      hourlyRate,
      isBillable = true,
    } = body;

    // Validation
    if (!description || !duration || !hourlyRate) {
      return NextResponse.json(
        { error: 'Opis, trajanje i satnica su obavezni' },
        { status: 400 }
      );
    }

    if (duration <= 0) {
      return NextResponse.json(
        { error: 'Trajanje mora biti veće od 0' },
        { status: 400 }
      );
    }

    if (hourlyRate <= 0) {
      return NextResponse.json(
        { error: 'Satnica mora biti veća od 0' },
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

    // Calculate amount
    const amount = (duration / 60) * hourlyRate;

    // Create time entry
    const timeEntry = await db.timeEntry.create({
      data: {
        caseId: caseId || null,
        date: date ? new Date(date) : new Date(),
        duration,
        description,
        hourlyRate,
        amount,
        isBillable,
        userId: session.user.id,
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
        }
      }
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating time entry:', error);
    return NextResponse.json(
      { error: 'Greška pri stvaranju unosa vremena' },
      { status: 500 }
    );
  }
}
