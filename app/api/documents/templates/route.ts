import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const category = searchParams.get('category');
    const caseType = searchParams.get('caseType');

    // Build where clause
    const whereClause: any = {
      OR: [
        { isPublic: true },
        { authorId: session.user.id },
      ],
    };

    if (category) {
      whereClause.category = category;
    }

    if (caseType) {
      whereClause.caseType = caseType;
    }

    // Get templates
    const templates = await db.documentTemplate.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });

    // Transform templates to include usage count
    const templatesWithUsage = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      caseType: template.caseType,
      content: template.content,
      variables: template.variables ? JSON.parse(template.variables) : [],
      isPublic: template.isPublic,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      author: template.author,
      usageCount: template._count.documents,
    }));

    return NextResponse.json(templatesWithUsage);
  } catch (error) {
    console.error('Error fetching document templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { name, description, category, caseType, content, isPublic } = await request.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    // Extract variables from content (e.g., [CLIENT_NAME], [CASE_NUMBER])
    const variableRegex = /\[([A-Z_]+)\]/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    // Create template
    const template = await db.documentTemplate.create({
      data: {
        name,
        description: description || '',
        category: category || 'Ostalo',
        caseType: caseType || 'Ostalo',
        content,
        variables: JSON.stringify(variables),
        isPublic: isPublic || false,
        authorId: session.user.id,
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
      variables: template.variables ? JSON.parse(template.variables) : [],
      isPublic: template.isPublic,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      author: template.author,
      usageCount: template._count.documents,
    };

    return NextResponse.json(templateWithUsage);
  } catch (error) {
    console.error('Error creating document template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
