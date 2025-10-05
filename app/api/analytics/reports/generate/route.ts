import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

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

    const organizationId = user.organization.id;
    const { fields, filters, dateRange } = await request.json();

    // Build the report data based on selected fields
    const reportData = [];

    // Get data from different tables based on selected fields
    const hasClientFields = fields.some((f: any) => f.id.includes('client'));
    const hasCaseFields = fields.some((f: any) => f.id.includes('case'));
    const hasInvoiceFields = fields.some((f: any) => f.id.includes('invoice'));
    const hasTimeFields = fields.some((f: any) => f.id.includes('time'));
    const hasDocumentFields = fields.some((f: any) => f.id.includes('document'));

    // Build date filter
    const dateFilter: any = {};
    if (dateRange.from) {
      dateFilter.gte = new Date(dateRange.from);
    }
    if (dateRange.to) {
      dateFilter.lte = new Date(dateRange.to);
    }

    // Get cases with related data
    if (hasCaseFields || hasClientFields) {
      const cases = await db.case.findMany({
        where: {
          client: { organizationId },
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: {
          client: true,
          assignedTo: true,
          documents: hasDocumentFields,
          timeEntries: hasTimeFields,
          invoices: hasInvoiceFields,
        },
      });

      for (const case_ of cases) {
        const row: any = {};

        // Map case fields
        if (fields.some((f: any) => f.id === 'case_number')) {
          row.case_number = case_.caseNumber;
        }
        if (fields.some((f: any) => f.id === 'case_status')) {
          row.case_status = case_.status;
        }
        if (fields.some((f: any) => f.id === 'case_priority')) {
          row.case_priority = case_.priority;
        }
        if (fields.some((f: any) => f.id === 'created_date')) {
          row.created_date = case_.createdAt.toISOString().split('T')[0];
        }
        if (fields.some((f: any) => f.id === 'due_date')) {
          // Get the next upcoming deadline for this case
          const nextDeadline = await db.caseDeadline.findFirst({
            where: {
              caseId: case_.id,
              status: 'pending',
              dueDate: { gte: new Date() },
            },
            orderBy: { dueDate: 'asc' },
          });
          row.due_date = nextDeadline?.dueDate.toISOString().split('T')[0] || '';
        }

        // Map client fields
        if (fields.some((f: any) => f.id === 'client_name')) {
          row.client_name = case_.client.companyName || 
            `${case_.client.firstName || ''} ${case_.client.lastName || ''}`.trim();
        }

        // Map document fields
        if (fields.some((f: any) => f.id === 'document_count')) {
          row.document_count = case_.documents?.length || 0;
        }

        // Map time fields
        if (fields.some((f: any) => f.id === 'time_duration')) {
          const totalDuration = case_.timeEntries?.reduce((sum, entry) => sum + entry.duration, 0) || 0;
          row.time_duration = Math.round(totalDuration / 60); // Convert to hours
        }
        if (fields.some((f: any) => f.id === 'time_billable')) {
          const billableDuration = case_.timeEntries?.filter(entry => entry.isBillable)
            .reduce((sum, entry) => sum + entry.duration, 0) || 0;
          row.time_billable = Math.round(billableDuration / 60); // Convert to hours
        }

        // Map invoice fields
        if (fields.some((f: any) => f.id === 'invoice_amount')) {
          const totalAmount = case_.invoices?.reduce((sum, invoice) => sum + invoice.total, 0) || 0;
          row.invoice_amount = totalAmount;
        }
        if (fields.some((f: any) => f.id === 'invoice_status')) {
          const statuses = case_.invoices?.map(invoice => invoice.status) || [];
          row.invoice_status = statuses.join(', ') || 'Nema računa';
        }

        reportData.push(row);
      }
    }

    // Get standalone invoices if only invoice fields are selected
    if (hasInvoiceFields && !hasCaseFields) {
      const invoices = await db.invoice.findMany({
        where: {
          client: { organizationId },
          ...(Object.keys(dateFilter).length > 0 && { issueDate: dateFilter }),
        },
        include: {
          client: true,
        },
      });

      for (const invoice of invoices) {
        const row: any = {};

        if (fields.some((f: any) => f.id === 'invoice_amount')) {
          row.invoice_amount = invoice.total;
        }
        if (fields.some((f: any) => f.id === 'invoice_status')) {
          row.invoice_status = invoice.status;
        }
        if (fields.some((f: any) => f.id === 'client_name')) {
          row.client_name = invoice.client.companyName || 
            `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim();
        }
        if (fields.some((f: any) => f.id === 'created_date')) {
          row.created_date = invoice.issueDate.toISOString().split('T')[0];
        }

        reportData.push(row);
      }
    }

    // Get standalone time entries if only time fields are selected
    if (hasTimeFields && !hasCaseFields) {
      const timeEntries = await db.timeEntry.findMany({
        where: {
          case: { client: { organizationId } },
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
        include: {
          user: true,
          case: {
            include: {
              client: true,
            },
          },
        },
      });

      for (const entry of timeEntries) {
        const row: any = {};

        if (fields.some((f: any) => f.id === 'time_duration')) {
          row.time_duration = Math.round(entry.duration / 60); // Convert to hours
        }
        if (fields.some((f: any) => f.id === 'time_billable')) {
          row.time_billable = entry.isBillable ? 'Da' : 'Ne';
        }
        if (fields.some((f: any) => f.id === 'client_name') && entry.case) {
          row.client_name = entry.case.client.companyName || 
            `${entry.case.client.firstName || ''} ${entry.case.client.lastName || ''}`.trim();
        }
        if (fields.some((f: any) => f.id === 'case_number') && entry.case) {
          row.case_number = entry.case.caseNumber;
        }
        if (fields.some((f: any) => f.id === 'created_date')) {
          row.created_date = entry.date;
        }

        reportData.push(row);
      }
    }

    // Apply filters
    let filteredData = reportData;
    for (const filter of filters) {
      if (filter.field && filter.value) {
        filteredData = filteredData.filter((row: any) => {
          const fieldValue = row[filter.field];
          if (!fieldValue) return false;

          switch (filter.operator) {
            case 'equals':
              return fieldValue.toString().toLowerCase() === filter.value.toLowerCase();
            case 'contains':
              return fieldValue.toString().toLowerCase().includes(filter.value.toLowerCase());
            case 'greater':
              return parseFloat(fieldValue) > parseFloat(filter.value);
            case 'less':
              return parseFloat(fieldValue) < parseFloat(filter.value);
            default:
              return true;
          }
        });
      }
    }

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
