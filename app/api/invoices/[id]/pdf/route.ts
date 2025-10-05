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
    const gray = rgb(0.5, 0.5, 0.5);
    const darkGray = rgb(0.3, 0.3, 0.3);

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

    // Helper function to draw line
    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: 1,
        color: gray,
      });
    };

    // Header - Organization info
    drawText(user.organization.name, 50, height - 50, { size: 20, font: boldFont });
    if (user.organization.address) {
      drawText(user.organization.address, 50, height - 70, { size: 10 });
    }
    if (user.organization.email) {
      drawText(user.organization.email, 50, height - 85, { size: 10 });
    }
    if (user.organization.phone) {
      drawText(user.organization.phone, 50, height - 100, { size: 10 });
    }
    if (user.organization.taxId) {
      drawText(`OIB: ${user.organization.taxId}`, 50, height - 115, { size: 10 });
    }

    // Invoice title
    drawText('RAČUN', width - 150, height - 50, { size: 24, font: boldFont });
    drawText(`Broj: ${invoice.invoiceNumber}`, width - 150, height - 75, { size: 12, font: boldFont });

    // Invoice dates
    const issueDate = format(new Date(invoice.issueDate), 'dd.MM.yyyy', { locale: hr });
    const dueDate = format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: hr });
    
    drawText(`Datum izdavanja: ${issueDate}`, width - 150, height - 95, { size: 10 });
    drawText(`Datum dospijeća: ${dueDate}`, width - 150, height - 110, { size: 10 });

    // Client info section
    const clientY = height - 180;
    drawText('KUPAC:', 50, clientY, { size: 12, font: boldFont });
    
    const clientName = invoice.client.companyName || 
      `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim();
    drawText(clientName, 50, clientY - 20, { size: 11, font: boldFont });
    
    if (invoice.client.address) {
      drawText(invoice.client.address, 50, clientY - 35, { size: 10 });
    }
    if (invoice.client.city && invoice.client.postalCode) {
      drawText(`${invoice.client.postalCode} ${invoice.client.city}`, 50, clientY - 50, { size: 10 });
    }
    if (invoice.client.taxId) {
      drawText(`OIB: ${invoice.client.taxId}`, 50, clientY - 65, { size: 10 });
    }

    // Line separator
    drawLine(50, clientY - 85, width - 50, clientY - 85);

    // Items table header
    const tableY = clientY - 110;
    drawText('Opis', 50, tableY, { size: 10, font: boldFont });
    drawText('Datum', 200, tableY, { size: 10, font: boldFont });
    drawText('Količina', 280, tableY, { size: 10, font: boldFont });
    drawText('Cijena', 350, tableY, { size: 10, font: boldFont });
    drawText('Ukupno', 450, tableY, { size: 10, font: boldFont });

    // Table header line
    drawLine(50, tableY - 5, width - 50, tableY - 5);

    let currentY = tableY - 25;


    // Expenses
    for (const expense of invoice.expenses) {
      const expenseDate = format(new Date(expense.date), 'dd.MM.yyyy', { locale: hr });
      
      drawText(expense.description, 50, currentY, { size: 9 });
      drawText(expenseDate, 200, currentY, { size: 9 });
      drawText('1', 280, currentY, { size: 9 });
      drawText(`${expense.amount.toFixed(2)} EUR`, 350, currentY, { size: 9 });
      drawText(`${expense.amount.toFixed(2)} EUR`, 450, currentY, { size: 9 });
      
      // Add category below description
      drawText(`(${expense.category})`, 50, currentY - 12, { size: 8, color: gray });
      
      currentY -= 30;
    }

    // Totals section
    const totalsY = currentY - 20;
    drawLine(350, totalsY, width - 50, totalsY);

    drawText('Ukupno bez PDV-a:', 350, totalsY - 20, { size: 10, font: boldFont });
    drawText(`${invoice.subtotal.toFixed(2)} EUR`, 450, totalsY - 20, { size: 10, font: boldFont });

    drawText(`PDV (${invoice.taxRate}%):`, 350, totalsY - 40, { size: 10, font: boldFont });
    drawText(`${invoice.taxAmount.toFixed(2)} EUR`, 450, totalsY - 40, { size: 10, font: boldFont });

    drawLine(350, totalsY - 50, width - 50, totalsY - 50);

    drawText('UKUPNO ZA PLAĆANJE:', 350, totalsY - 70, { size: 12, font: boldFont });
    drawText(`${invoice.total.toFixed(2)} EUR`, 450, totalsY - 70, { size: 12, font: boldFont });

    // Payment info
    const paymentY = totalsY - 120;
    drawText('NAČIN PLAĆANJA:', 50, paymentY, { size: 10, font: boldFont });
    drawText('Bankovni transfer', 50, paymentY - 20, { size: 10 });
    
    // Add notes if available
    if (invoice.notes) {
      drawText('NAPOMENE:', 50, paymentY - 50, { size: 10, font: boldFont });
      const notesLines = invoice.notes.split('\n');
      let notesY = paymentY - 70;
      for (const line of notesLines) {
        drawText(line, 50, notesY, { size: 9 });
        notesY -= 15;
      }
    }

    // Terms if available
    if (invoice.terms) {
      const termsY = paymentY - (invoice.notes ? 120 : 50);
      drawText('UVJETI PLAĆANJA:', 50, termsY, { size: 10, font: boldFont });
      const termsLines = invoice.terms.split('\n');
      let currentTermsY = termsY - 20;
      for (const line of termsLines) {
        drawText(line, 50, currentTermsY, { size: 9 });
        currentTermsY -= 15;
      }
    }

    // Footer
    const footerY = 50;
    drawText('Hvala vam na povjerenju!', width / 2 - 80, footerY, { size: 10, font: boldFont });

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
    return NextResponse.json(
      { error: 'Greška pri generiranju PDF-a' },
      { status: 500 }
    );
  }
}
