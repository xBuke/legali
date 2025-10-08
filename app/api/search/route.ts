import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Fuse from 'fuse.js';

export const dynamic = 'force-dynamic';

// GET /api/search - Global search across all entities
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautoriziran pristup' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // Optional: filter by entity type

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        results: [],
        total: 0,
        query: query || ''
      });
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    const results: Record<string, unknown>[] = [];

    // Search clients
    if (!type || type === 'clients') {
      const clients = await db.client.findMany({
        where: {
          organizationId: user.organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          status: true,
        },
        take: 100, // Limit to prevent timeout
      });

      const clientFuse = new Fuse(clients, {
        keys: [
          { name: 'firstName', weight: 0.3 },
          { name: 'lastName', weight: 0.3 },
          { name: 'companyName', weight: 0.4 },
          { name: 'email', weight: 0.2 },
          { name: 'phone', weight: 0.1 },
          { name: 'address', weight: 0.1 },
          { name: 'city', weight: 0.1 },
        ],
        threshold: 0.4,
        includeScore: true,
      });

      const clientResults = clientFuse.search(query).map(result => ({
        ...result.item,
        type: 'client',
        score: result.score,
        displayName: result.item.companyName || `${result.item.firstName || ''} ${result.item.lastName || ''}`.trim(),
        url: `/dashboard/clients/${result.item.id}`,
      }));

      results.push(...clientResults);
    }

    // Search cases
    if (!type || type === 'cases') {
      const cases = await db.case.findMany({
        where: {
          organizationId: user.organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          caseNumber: true,
          title: true,
          description: true,
          caseType: true,
          status: true,
          priority: true,
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            }
          }
        },
        take: 100, // Limit to prevent timeout
      });

      const caseFuse = new Fuse(cases, {
        keys: [
          { name: 'caseNumber', weight: 0.4 },
          { name: 'title', weight: 0.3 },
          { name: 'description', weight: 0.2 },
          { name: 'caseType', weight: 0.1 },
        ],
        threshold: 0.4,
        includeScore: true,
      });

      const caseResults = caseFuse.search(query).map(result => ({
        ...result.item,
        type: 'case',
        score: result.score,
        displayName: `${result.item.caseNumber} - ${result.item.title}`,
        clientName: result.item.client.companyName || `${result.item.client.firstName || ''} ${result.item.client.lastName || ''}`.trim(),
        url: `/dashboard/cases/${result.item.id}`,
      }));

      results.push(...caseResults);
    }

    // Search documents
    if (!type || type === 'documents') {
      const documents = await db.document.findMany({
        where: {
          organizationId: user.organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          fileName: true,
          originalName: true,
          title: true,
          description: true,
          category: true,
          mimeType: true,
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
            }
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            }
          }
        },
        take: 100, // Limit to prevent timeout
      });

      const documentFuse = new Fuse(documents, {
        keys: [
          { name: 'fileName', weight: 0.3 },
          { name: 'originalName', weight: 0.3 },
          { name: 'title', weight: 0.2 },
          { name: 'description', weight: 0.1 },
          { name: 'category', weight: 0.1 },
        ],
        threshold: 0.4,
        includeScore: true,
      });

      const documentResults = documentFuse.search(query).map(result => ({
        ...result.item,
        type: 'document',
        score: result.score,
        displayName: result.item.title || result.item.originalName,
        caseName: result.item.case ? `${result.item.case.caseNumber} - ${result.item.case.title}` : null,
        clientName: result.item.client ? (result.item.client.companyName || `${result.item.client.firstName || ''} ${result.item.client.lastName || ''}`.trim()) : null,
        url: `/dashboard/documents`,
      }));

      results.push(...documentResults);
    }


    // Search time entries
    if (!type || type === 'time-entries') {
      const timeEntries = await db.timeEntry.findMany({
        where: {
          organizationId: user.organizationId,
        },
        select: {
          id: true,
          date: true,
          description: true,
          duration: true,
          amount: true,
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        take: 100, // Limit to prevent timeout
      });

      const timeEntryFuse = new Fuse(timeEntries, {
        keys: [
          { name: 'description', weight: 0.8 },
          { name: 'case.caseNumber', weight: 0.1 },
          { name: 'case.title', weight: 0.1 },
        ],
        threshold: 0.4,
        includeScore: true,
      });

      const timeEntryResults = timeEntryFuse.search(query).map(result => ({
        ...result.item,
        type: 'time-entry',
        score: result.score,
        displayName: result.item.description,
        caseName: result.item.case ? `${result.item.case.caseNumber} - ${result.item.case.title}` : null,
        userName: `${result.item.user.firstName || ''} ${result.item.user.lastName || ''}`.trim(),
        url: `/dashboard/time-tracking`,
      }));

      results.push(...timeEntryResults);
    }

    // Search invoices
    if (!type || type === 'invoices') {
      const invoices = await db.invoice.findMany({
        where: {
          organizationId: user.organizationId,
        },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          issueDate: true,
          dueDate: true,
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            }
          }
        },
        take: 100, // Limit to prevent timeout
      });

      const invoiceFuse = new Fuse(invoices, {
        keys: [
          { name: 'invoiceNumber', weight: 0.5 },
          { name: 'client.companyName', weight: 0.2 },
          { name: 'client.firstName', weight: 0.15 },
          { name: 'client.lastName', weight: 0.15 },
        ],
        threshold: 0.4,
        includeScore: true,
      });

      const invoiceResults = invoiceFuse.search(query).map(result => ({
        ...result.item,
        type: 'invoice',
        score: result.score,
        displayName: result.item.invoiceNumber,
        clientName: result.item.client.companyName || `${result.item.client.firstName || ''} ${result.item.client.lastName || ''}`.trim(),
        url: `/dashboard/invoices`,
      }));

      results.push(...invoiceResults);
    }

    // Sort results by score (lower is better)
    results.sort((a, b) => (a.score || 0) - (b.score || 0));

    // Limit results
    const limitedResults = results.slice(0, 50);

    return NextResponse.json({
      results: limitedResults,
      total: results.length,
      query: query,
      types: {
        clients: results.filter(r => r.type === 'client').length,
        cases: results.filter(r => r.type === 'case').length,
        documents: results.filter(r => r.type === 'document').length,
        'time-entries': results.filter(r => r.type === 'time-entry').length,
        invoices: results.filter(r => r.type === 'invoice').length,
      }
    });

  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { error: 'Greška pri pretraživanju' },
      { status: 500 }
    );
  }
}
