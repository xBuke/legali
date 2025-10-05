import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await db.invoiceTemplate.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching invoice template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
          id: { not: params.id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await db.invoiceTemplate.update({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      data: {
        name,
        description,
        templateType,
        items: JSON.stringify(items),
        terms,
        notes,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating invoice template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.invoiceTemplate.delete({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
