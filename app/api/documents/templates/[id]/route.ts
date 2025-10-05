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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get template
    const template = await db.documentTemplate.findFirst({
      where: {
        id: params.id,
        OR: [
          { isPublic: true },
          { authorId: session.user.id },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const templateWithUsage = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      caseType: template.caseType,
      content: template.content,
      variables: template.variables,
      isPublic: template.isPublic,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      author: (template as any).author,
      usageCount: (template as any)._count?.documents || 0,
    };

    return NextResponse.json(templateWithUsage);
  } catch (error) {
    console.error('Error fetching document template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify template exists and user can edit it
    const existingTemplate = await db.documentTemplate.findFirst({
      where: {
        id: params.id,
        authorId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    const { name, description, category, caseType, content, isPublic } = await request.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    // Extract variables from content
    const variableRegex = /\[([A-Z_]+)\]/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    // Update template
    const template = await db.documentTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description: description || '',
        category: category || 'Ostalo',
        caseType: caseType || 'Ostalo',
        content,
        variables: variables ? JSON.stringify(variables) : null,
        isPublic: isPublic || false,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    const templateWithUsage = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      caseType: template.caseType,
      content: template.content,
      variables: template.variables,
      isPublic: template.isPublic,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      author: (template as any).author,
      usageCount: (template as any)._count?.documents || 0,
    };

    return NextResponse.json(templateWithUsage);
  } catch (error) {
    console.error('Error updating document template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify template exists and user can delete it
    const existingTemplate = await db.documentTemplate.findFirst({
      where: {
        id: params.id,
        authorId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    // Delete template
    await db.documentTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
