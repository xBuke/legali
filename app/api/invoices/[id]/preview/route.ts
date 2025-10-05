import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';

// GET /api/invoices/[id]/preview - Preview PDF for an invoice in browser
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
        organization: {
          select: {
            id: true,
            name: true,
            address: true,
            taxId: true,
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
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Račun nije pronađen' }, { status: 404 });
    }

    // Validate required fields
    if (!invoice.invoiceNumber || !invoice.client) {
      return NextResponse.json({ 
        error: 'Račun nema sve potrebne podatke za generiranje PDF-a' 
      }, { status: 400 });
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

    // Helper function to convert Croatian characters to ASCII
    const toAscii = (text: string) => {
      return text
        .replace(/Č/g, 'C')
        .replace(/č/g, 'c')
        .replace(/Ć/g, 'C')
        .replace(/ć/g, 'c')
        .replace(/Đ/g, 'D')
        .replace(/đ/g, 'd')
        .replace(/Š/g, 'S')
        .replace(/š/g, 's')
        .replace(/Ž/g, 'Z')
        .replace(/ž/g, 'z');
    };

    // Header with organization info
    drawText(toAscii(invoice.organization.name || 'Law Firm'), 50, height - 40, { size: 18, font: boldFont });
    if (invoice.organization.address) {
      drawText(toAscii(invoice.organization.address), 50, height - 60, { size: 10 });
    }
    if (invoice.organization.taxId) {
      drawText(`OIB: ${invoice.organization.taxId}`, 50, height - 75, { size: 10 });
    }

    // Invoice title and number
    drawText('RACUN', 400, height - 40, { size: 24, font: boldFont });
    drawText(`Broj: ${invoice.invoiceNumber}`, 400, height - 65, { size: 12, font: boldFont });
    
    // Safe date formatting
    const issueDate = invoice.issueDate ? format(new Date(invoice.issueDate), 'dd.MM.yyyy') : 'N/A';
    const dueDate = invoice.dueDate ? format(new Date(invoice.dueDate), 'dd.MM.yyyy') : 'N/A';
    
    drawText(`Datum izdavanja: ${issueDate}`, 400, height - 85, { size: 10 });
    drawText(`Datum dospijeca: ${dueDate}`, 400, height - 100, { size: 10 });

    // Client info section
    const clientY = height - 140;
    drawText('KUPAC:', 50, clientY, { size: 12, font: boldFont });
    const clientName = invoice.client.companyName || 
      `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim() || 'Nepoznat klijent';
    drawText(toAscii(clientName), 50, clientY - 20, { size: 11, font: boldFont });
    
    if (invoice.client.address) {
      drawText(toAscii(invoice.client.address), 50, clientY - 35, { size: 10 });
    }
    if (invoice.client.city && invoice.client.postalCode) {
      drawText(`${invoice.client.postalCode} ${toAscii(invoice.client.city)}`, 50, clientY - 50, { size: 10 });
    }
    if (invoice.client.taxId) {
      drawText(`OIB: ${invoice.client.taxId}`, 50, clientY - 65, { size: 10 });
    }

    // Services table header
    const tableY = clientY - 100;
    drawText('OPIS USLUGE', 50, tableY, { size: 10, font: boldFont });
    drawText('DATUM', 250, tableY, { size: 10, font: boldFont });
    drawText('SATI', 320, tableY, { size: 10, font: boldFont });
    drawText('CIJENA/SAT', 380, tableY, { size: 10, font: boldFont });
    drawText('IZNOS', 480, tableY, { size: 10, font: boldFont });

    // Draw line under header
    page.drawLine({
      start: { x: 50, y: tableY - 5 },
      end: { x: 550, y: tableY - 5 },
      thickness: 1,
      color: black,
    });

    // Services table content
    let currentY = tableY - 25;
    let totalHours = 0;
    
    if (invoice.timeEntries && invoice.timeEntries.length > 0) {
      invoice.timeEntries.forEach((entry) => {
        const hours = entry.duration / 60;
        totalHours += hours;
        
        // Description (wrap if too long)
        const description = toAscii(entry.description);
        const maxDescWidth = 180;
        if (description.length > 30) {
          const words = description.split(' ');
          let line = '';
          let lineY = currentY;
          
          for (const word of words) {
            if ((line + word).length > 30) {
              drawText(line.trim(), 50, lineY, { size: 9 });
              line = word + ' ';
              lineY -= 12;
            } else {
              line += word + ' ';
            }
          }
          if (line.trim()) {
            drawText(line.trim(), 50, lineY, { size: 9 });
          }
          currentY = lineY - 5;
        } else {
          drawText(description, 50, currentY, { size: 9 });
        }
        
        // Date
        const entryDate = format(new Date(entry.date), 'dd.MM.yyyy');
        drawText(entryDate, 250, currentY, { size: 9 });
        
        // Hours
        drawText(hours.toFixed(1), 320, currentY, { size: 9 });
        
        // Rate
        drawText(`${entry.hourlyRate.toFixed(2)} EUR`, 380, currentY, { size: 9 });
        
        // Amount
        drawText(`${entry.amount.toFixed(2)} EUR`, 480, currentY, { size: 9 });
        
        currentY -= 20;
      });
    } else {
      // Fallback if no time entries
      drawText('Pravne usluge', 50, currentY, { size: 9 });
      drawText('N/A', 250, currentY, { size: 9 });
      drawText('N/A', 320, currentY, { size: 9 });
      drawText('N/A', 380, currentY, { size: 9 });
      drawText(`${invoice.subtotal.toFixed(2)} EUR`, 480, currentY, { size: 9 });
      currentY -= 20;
    }

    // Totals section
    const totalsY = currentY - 30;
    
    // Draw line above totals
    page.drawLine({
      start: { x: 350, y: totalsY + 10 },
      end: { x: 550, y: totalsY + 10 },
      thickness: 1,
      color: black,
    });

    drawText('Ukupno sati:', 350, totalsY, { size: 10, font: boldFont });
    drawText(totalHours.toFixed(1), 480, totalsY, { size: 10, font: boldFont });

    drawText('Osnovica:', 350, totalsY - 20, { size: 10, font: boldFont });
    drawText(`${invoice.subtotal.toFixed(2)} EUR`, 480, totalsY - 20, { size: 10, font: boldFont });

    drawText(`PDV (${invoice.taxRate}%):`, 350, totalsY - 40, { size: 10, font: boldFont });
    drawText(`${invoice.taxAmount.toFixed(2)} EUR`, 480, totalsY - 40, { size: 10, font: boldFont });

    // Draw line above total
    page.drawLine({
      start: { x: 350, y: totalsY - 50 },
      end: { x: 550, y: totalsY - 50 },
      thickness: 1,
      color: black,
    });

    drawText('UKUPNO ZA PLACANJE:', 350, totalsY - 70, { size: 12, font: boldFont });
    drawText(`${invoice.total.toFixed(2)} EUR`, 480, totalsY - 70, { size: 12, font: boldFont });

    // Payment info
    if (invoice.amountPaid > 0) {
      drawText(`Placeno: ${invoice.amountPaid.toFixed(2)} EUR`, 350, totalsY - 90, { size: 10 });
      drawText(`Preostalo: ${(invoice.total - invoice.amountPaid).toFixed(2)} EUR`, 350, totalsY - 105, { size: 10 });
    }

    // Notes section
    if (invoice.notes) {
      const notesY = totalsY - 140;
      drawText('NAPOMENE:', 50, notesY, { size: 10, font: boldFont });
      drawText(toAscii(invoice.notes), 50, notesY - 15, { size: 9 });
    }

    // Terms section
    if (invoice.terms) {
      const termsY = totalsY - 180;
      drawText('UVJETI PLACANJA:', 50, termsY, { size: 10, font: boldFont });
      drawText(toAscii(invoice.terms), 50, termsY - 15, { size: 9 });
    }

    // Footer
    drawText('Hvala vam na povjerenju!', 50, 50, { size: 10, font: boldFont });
    drawText(`Izdano: ${issueDate}`, 400, 50, { size: 9 });

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Return PDF as response for preview (inline display)
    return new NextResponse(pdfBytes as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="racun-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Error generating PDF preview:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      invoiceId: params.id,
    });
    return NextResponse.json(
      { 
        error: 'Greška pri generiranju PDF pregleda',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
