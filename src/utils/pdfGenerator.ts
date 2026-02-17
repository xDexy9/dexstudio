import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, Invoice, CompanySettings, QuoteLineItem, Job } from '@/lib/types';
import { format } from 'date-fns';
import { printDocumentHTML } from './invoiceHtmlTemplate';

interface PDFDocumentData {
  type: 'quote' | 'invoice';
  documentNumber: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  customer: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
    postCode?: string;
    region?: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    vin?: string;
    color?: string;
    fuelType?: string;
    mileage?: number;
  };
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
  notes?: string;
  customerNotes?: string;
  paymentStatus?: string;

  // Job context for enhanced PDF layout
  jobDescription?: string;
  faultCategories?: string[];
  estimatedDuration?: number; // in minutes
  mechanicFindings?: Array<{ description: string; requiresReplacement: boolean }>;
}

const FUEL_LABELS: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
  lpg: 'LPG',
  other: 'Other',
};

/**
 * Generate PDF for Quote or Invoice
 */
export const generatePDF = async (
  data: PDFDocumentData,
  companySettings: CompanySettings
): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  const currencySymbol = data.currency === 'EUR' ? '€' : data.currency;

  // Helper: check if we need a page break
  const checkPageBreak = (needed: number) => {
    if (yPos + needed > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Helper: draw a section header bar
  const drawSectionHeader = (title: string) => {
    checkPageBreak(15);
    doc.setFillColor(51, 51, 51);
    doc.rect(margin, yPos, contentWidth, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 4, yPos + 5);
    yPos += 10;
    doc.setTextColor(0, 0, 0);
  };

  // Helper: draw a bullet point
  const drawBullet = (text: string, options?: { color?: [number, number, number]; suffix?: string }) => {
    checkPageBreak(10);
    doc.setFillColor(80, 80, 80);
    doc.circle(margin + 5, yPos - 1, 0.8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const textLines = doc.splitTextToSize(text, contentWidth - 14);
    doc.text(textLines, margin + 9, yPos);
    if (options?.suffix) {
      const lastLineWidth = doc.getTextWidth(textLines[textLines.length - 1]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(options.color || [220, 53, 69]));
      doc.text(options.suffix, margin + 9 + lastLineWidth + 2, yPos + (textLines.length - 1) * 4.5);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
    }
    yPos += textLines.length * 4.5 + 2;
  };

  // ─── 1. COMPANY HEADER (left) + TITLE & DATES (right) ───

  // Company logo
  if (companySettings.logoUrl) {
    try {
      const img = await loadImage(companySettings.logoUrl);
      doc.addImage(img, 'PNG', margin, yPos, 40, 20);
      yPos += 25;
    } catch (e) {
      // Skip logo if loading fails
    }
  }

  // Company name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(companySettings.companyName, margin, yPos);
  yPos += 7;

  // Company address & contact
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const addressLines = [
    companySettings.address.street,
    `${companySettings.address.postalCode} ${companySettings.address.city}`,
    companySettings.address.country,
    companySettings.phone,
    companySettings.email,
  ].filter(Boolean);

  addressLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  if (companySettings.taxId) {
    doc.text(`VAT: ${companySettings.taxId}`, margin, yPos);
    yPos += 4;
  }

  // Document title (right side)
  const titleY = 20;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const title = data.type === 'quote' ? 'QUOTE' : 'INVOICE';
  doc.text(title, pageWidth - margin, titleY, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.documentNumber, pageWidth - margin, titleY + 10, { align: 'right' });

  // Date info (right side)
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  let dateY = titleY + 20;
  doc.text(`Date: ${format(new Date(data.issueDate), 'dd/MM/yyyy')}`, pageWidth - margin, dateY, { align: 'right' });

  if (data.type === 'quote' && data.validUntil) {
    dateY += 5;
    doc.text(`Valid Until: ${format(new Date(data.validUntil), 'dd/MM/yyyy')}`, pageWidth - margin, dateY, { align: 'right' });
  }

  if (data.type === 'invoice' && data.dueDate) {
    dateY += 5;
    doc.text(`Due Date: ${format(new Date(data.dueDate), 'dd/MM/yyyy')}`, pageWidth - margin, dateY, { align: 'right' });
  }

  yPos = Math.max(yPos, dateY + 15);

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ─── 2. CUSTOMER + VEHICLE (two columns) ───

  const colWidth = (contentWidth - 10) / 2;

  // Calculate vehicle box lines to determine height
  const vehicleLines: string[] = [
    `${data.vehicle.brand} ${data.vehicle.model} (${data.vehicle.year})`,
    `Plate: ${data.vehicle.licensePlate}`,
  ];
  if (data.vehicle.mileage) vehicleLines.push(`Kilometers: ${data.vehicle.mileage.toLocaleString()} km`);
  if (data.vehicle.fuelType) vehicleLines.push(`Fuel: ${FUEL_LABELS[data.vehicle.fuelType] || data.vehicle.fuelType}`);
  if (data.vehicle.color) vehicleLines.push(`Color: ${data.vehicle.color}`);
  if (data.vehicle.vin) vehicleLines.push(`VIN: ${data.vehicle.vin}`);

  const customerLines: string[] = [data.customer.name, data.customer.phone];
  if (data.customer.email) customerLines.push(data.customer.email);
  if (data.customer.address) customerLines.push(data.customer.address);
  if (data.customer.postCode || data.customer.region) {
    customerLines.push([data.customer.postCode, data.customer.region].filter(Boolean).join(' '));
  }

  const boxContentLines = Math.max(customerLines.length, vehicleLines.length);
  const boxHeight = 10 + boxContentLines * 5 + 4; // header + lines + padding

  // Customer box
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, yPos, colWidth, boxHeight, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CUSTOMER', margin + 5, yPos + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  let cY = yPos + 14;
  customerLines.forEach(line => {
    doc.text(line, margin + 5, cY);
    cY += 5;
  });

  // Vehicle box
  const vehicleX = margin + colWidth + 10;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(vehicleX, yPos, colWidth, boxHeight, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('VEHICLE', vehicleX + 5, yPos + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  let vY = yPos + 14;
  vehicleLines.forEach((line, i) => {
    // Use smaller font for VIN
    if (line.startsWith('VIN:')) {
      doc.setFontSize(7);
      doc.text(line, vehicleX + 5, vY);
      doc.setFontSize(9);
    } else {
      doc.text(line, vehicleX + 5, vY);
    }
    vY += 5;
  });

  yPos += boxHeight + 8;

  // ─── 3. CUSTOMER NOTES ───

  if (data.customerNotes) {
    drawSectionHeader('Customer Notes');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(data.customerNotes, contentWidth - 8);
    checkPageBreak(noteLines.length * 4.5 + 6);
    doc.text(noteLines, margin + 4, yPos);
    yPos += noteLines.length * 4.5 + 6;
  }

  // ─── 4. PROBLEMS REPORTED ───

  if (data.jobDescription) {
    drawSectionHeader('Problems Reported');

    // Split into individual problems (by newline) or show as single item
    const problems = data.jobDescription
      .split(/\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    problems.forEach(problem => {
      drawBullet(problem);
    });

    // Fault categories as tags
    if (data.faultCategories && data.faultCategories.length > 0) {
      checkPageBreak(10);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text('Categories: ' + data.faultCategories.join(', '), margin + 4, yPos);
      yPos += 6;
    }

    yPos += 4;
  }

  // ─── 5. ESTIMATED DURATION ───

  if (data.estimatedDuration && data.estimatedDuration > 0) {
    checkPageBreak(18);
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    const hours = Math.floor(data.estimatedDuration / 60);
    const mins = data.estimatedDuration % 60;
    let durationText: string;
    if (hours > 0 && mins > 0) {
      durationText = `${hours}h ${mins}m`;
    } else if (hours > 0) {
      durationText = `${hours}h`;
    } else {
      durationText = `${mins} minutes`;
    }
    doc.text(`Estimated Duration: ${durationText}`, margin + 5, yPos + 8);
    doc.setTextColor(0, 0, 0);
    yPos += 18;
  }

  // ─── 6. MECHANIC FINDINGS ───

  if (data.mechanicFindings && data.mechanicFindings.length > 0) {
    drawSectionHeader('Mechanic Findings');

    data.mechanicFindings.forEach(finding => {
      if (finding.requiresReplacement) {
        drawBullet(finding.description, {
          suffix: ' [REPLACEMENT REQUIRED]',
          color: [220, 53, 69],
        });
      } else {
        drawBullet(finding.description);
      }
    });

    yPos += 4;
  }

  // ─── 7. PARTS & SERVICES TABLE ───

  checkPageBreak(40);
  drawSectionHeader('Parts & Services');

  const tableData = data.lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    `${currencySymbol}${item.unitPrice.toFixed(2)}`,
    item.discount > 0 ? `${item.discount}%` : '-',
    `${item.taxRate}%`,
    `${currencySymbol}${item.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Unit Price', 'Discount', 'VAT', 'Total']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [60, 60, 60],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ─── 8. TOTALS ───

  checkPageBreak(40);
  const totalsX = pageWidth - margin - 80;
  const valuesX = pageWidth - margin;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  doc.text('Subtotal:', totalsX, yPos);
  doc.text(`${currencySymbol}${data.subtotal.toFixed(2)}`, valuesX, yPos, { align: 'right' });
  yPos += 6;

  if (data.discountTotal > 0) {
    doc.text('Discount:', totalsX, yPos);
    doc.setTextColor(220, 53, 69);
    doc.text(`-${currencySymbol}${data.discountTotal.toFixed(2)}`, valuesX, yPos, { align: 'right' });
    doc.setTextColor(100, 100, 100);
    yPos += 6;
  }

  doc.text('VAT:', totalsX, yPos);
  doc.text(`${currencySymbol}${data.taxTotal.toFixed(2)}`, valuesX, yPos, { align: 'right' });
  yPos += 8;

  // Grand total line
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, yPos - 2, valuesX, yPos - 2);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL:', totalsX, yPos + 5);
  doc.text(`${currencySymbol}${data.grandTotal.toFixed(2)}`, valuesX, yPos + 5, { align: 'right' });

  yPos += 20;

  // Payment status badge for invoices
  if (data.type === 'invoice' && data.paymentStatus) {
    const statusColors: Record<string, [number, number, number]> = {
      unpaid: [255, 193, 7],
      partial: [23, 162, 184],
      paid: [40, 167, 69],
      overdue: [220, 53, 69],
    };
    const color = statusColors[data.paymentStatus] || [100, 100, 100];

    doc.setFillColor(...color);
    doc.roundedRect(pageWidth - margin - 40, yPos - 15, 40, 10, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(data.paymentStatus.toUpperCase(), pageWidth - margin - 20, yPos - 8, { align: 'center' });
  }

  // ─── 9. INTERNAL NOTES ───

  if (data.notes) {
    checkPageBreak(20);
    yPos += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Notes:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const splitNotes = doc.splitTextToSize(data.notes, contentWidth);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 4.5 + 4;
  }

  // ─── 10. TERMS & CONDITIONS ───

  if (data.type === 'quote' && companySettings.termsAndConditions) {
    const remainingSpace = pageHeight - yPos;
    if (remainingSpace < 50) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos = Math.max(yPos + 10, pageHeight - 55);
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Terms & Conditions:', margin, yPos);
    yPos += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const terms = doc.splitTextToSize(companySettings.termsAndConditions, contentWidth);
    const maxLines = Math.min(terms.length, 8);
    doc.text(terms.slice(0, maxLines), margin, yPos);
  }

  // Invoice footer
  if (data.type === 'invoice' && companySettings.invoiceFooter) {
    yPos = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(companySettings.invoiceFooter, pageWidth / 2, yPos, { align: 'center' });
  }

  return doc;
};

/**
 * Build PDFDocumentData from Quote, with optional Job context
 */
const buildQuotePDFData = (quote: Quote, job?: Job): PDFDocumentData => {
  return {
    type: 'quote',
    documentNumber: quote.quoteNumber,
    issueDate: quote.issueDate,
    validUntil: quote.validUntil,
    customer: quote.customer,
    vehicle: {
      ...quote.vehicle,
      ...(job && {
        fuelType: job.vehicleFuelType,
        mileage: job.mileage || job.vehicleMileage,
      }),
    },
    lineItems: quote.lineItems,
    subtotal: quote.subtotal,
    discountTotal: quote.discountTotal,
    taxTotal: quote.taxTotal,
    grandTotal: quote.grandTotal,
    currency: quote.currency,
    customerNotes: quote.customerNotes,
    notes: quote.notes,
    // Job context
    ...(job && {
      jobDescription: job.problemDescription,
      faultCategories: job.faultCategory?.split(',').map(c => c.trim()).filter(Boolean),
      estimatedDuration: job.estimatedDuration,
      mechanicFindings: job.workOrderData?.findings?.map(f => ({
        description: f.description,
        requiresReplacement: f.requiresReplacement,
      })),
    }),
  };
};

/**
 * Build PDFDocumentData from Invoice, with optional Job context
 */
const buildInvoicePDFData = (invoice: Invoice, job?: Job): PDFDocumentData => {
  return {
    type: 'invoice',
    documentNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    customer: invoice.customer,
    vehicle: {
      ...invoice.vehicle,
      ...(job && {
        fuelType: job.vehicleFuelType,
        mileage: job.mileage || job.vehicleMileage,
      }),
    },
    lineItems: invoice.lineItems,
    subtotal: invoice.subtotal,
    discountTotal: invoice.discountTotal,
    taxTotal: invoice.taxTotal,
    grandTotal: invoice.grandTotal,
    currency: invoice.currency,
    notes: invoice.notes,
    paymentStatus: invoice.paymentStatus,
    // Job context
    ...(job && {
      jobDescription: job.problemDescription,
      faultCategories: job.faultCategory?.split(',').map(c => c.trim()).filter(Boolean),
      estimatedDuration: job.estimatedDuration,
      mechanicFindings: job.workOrderData?.findings?.map(f => ({
        description: f.description,
        requiresReplacement: f.requiresReplacement,
      })),
    }),
  };
};

/**
 * Generate and download PDF for a Quote
 */
export const downloadQuotePDF = async (
  quote: Quote,
  companySettings: CompanySettings,
  job?: Job
): Promise<void> => {
  const pdfData = buildQuotePDFData(quote, job);
  const doc = await generatePDF(pdfData, companySettings);
  doc.save(`${quote.quoteNumber}.pdf`);
};

/**
 * Generate and download PDF for an Invoice
 */
export const downloadInvoicePDF = async (
  invoice: Invoice,
  companySettings: CompanySettings,
  job?: Job
): Promise<void> => {
  const pdfData = buildInvoicePDFData(invoice, job);
  const doc = await generatePDF(pdfData, companySettings);
  doc.save(`${invoice.invoiceNumber}.pdf`);
};

/**
 * Open print dialog for Quote
 */
export const printQuotePDF = async (
  quote: Quote,
  companySettings: CompanySettings,
  job?: Job
): Promise<void> => {
  const pdfData = buildQuotePDFData(quote, job);
  const doc = await generatePDF(pdfData, companySettings);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

/**
 * Open print dialog for Invoice
 */
export const printInvoicePDF = async (
  invoice: Invoice,
  companySettings: CompanySettings,
  job?: Job
): Promise<void> => {
  const pdfData = buildInvoicePDFData(invoice, job);
  const doc = await generatePDF(pdfData, companySettings);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

/**
 * Print Quote using HTML layout (matches reference invoice style)
 */
export const printQuoteHTML = async (
  quote: Quote,
  companySettings: CompanySettings,
  job?: Job
): Promise<void> => {
  const pdfData = buildQuotePDFData(quote, job);
  printDocumentHTML(pdfData, companySettings);
};

/**
 * Print Invoice using HTML layout (matches reference invoice style)
 */
export const printInvoiceHTML = async (
  invoice: Invoice,
  companySettings: CompanySettings,
  job?: Job
): Promise<void> => {
  const pdfData = buildInvoicePDFData(invoice, job);
  printDocumentHTML(pdfData, companySettings);
};

/**
 * Load image from URL for PDF
 */
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};
