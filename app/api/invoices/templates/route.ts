import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await db.invoiceTemplate.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching invoice templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, templateType, items, terms, notes, isDefault } = body;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.invoiceTemplate.updateMany({
        where: {
          organizationId: session.user.organizationId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await db.invoiceTemplate.create({
      data: {
        name,
        description,
        templateType,
        items: JSON.stringify(items),
        terms,
        notes,
        isDefault: isDefault || false,
        organizationId: session.user.organizationId,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating invoice template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
