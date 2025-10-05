import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

// GET /api/invoices/[id]/pdf - Generate PDF for an invoice
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

    // Get invoice with all related data
    const invoice = await db.invoice.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
            taxId: true,
            clientType: true,
          }
        },
        timeEntries: {
          select: {
            id: true,
            date: true,
            duration: true,
            description: true,
            hourlyRate: true,
            amount: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        expenses: {
          select: {
            id: true,
            date: true,
            description: true,
            category: true,
            amount: true,
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Račun nije pronađen' }, { status: 404 });
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors
    const black = rgb(0, 0, 0);

    // Helper function to draw text
    const drawText = (text: string, x: number, y: number, options: any = {}) => {
      page.drawText(text, {
        x,
        y,
        size: options.size || 10,
        font: options.font || font,
        color: options.color || black,
      });
    };

    // Simple invoice content
    drawText('RAČUN', 50, height - 50, { size: 24, font: boldFont });
    drawText(`Broj: ${invoice.invoiceNumber}`, 50, height - 80, { size: 12, font: boldFont });
    
    const issueDate = format(new Date(invoice.issueDate), 'dd.MM.yyyy', { locale: hr });
    const dueDate = format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: hr });
    
    drawText(`Datum izdavanja: ${issueDate}`, 50, height - 100, { size: 10 });
    drawText(`Datum dospijeća: ${dueDate}`, 50, height - 115, { size: 10 });

    // Client info
    drawText('KUPAC:', 50, height - 150, { size: 12, font: boldFont });
    const clientName = invoice.client.companyName || 
      `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim();
    drawText(clientName, 50, height - 170, { size: 11, font: boldFont });

    // Simple totals
    drawText('UKUPNO ZA PLAĆANJE:', 50, height - 250, { size: 12, font: boldFont });
    drawText(`${invoice.total.toFixed(2)} EUR`, 50, height - 270, { size: 12, font: boldFont });

    // Footer
    drawText('Hvala vam na povjerenju!', 50, 50, { size: 10, font: boldFont });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Return PDF as response
    return new NextResponse(pdfBytes as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="racun-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      invoiceId: params.id,
    });
    return NextResponse.json(
      { 
        error: 'Greška pri generiranju PDF-a',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
