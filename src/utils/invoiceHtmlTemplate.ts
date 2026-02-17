import { CompanySettings, QuoteLineItem } from '@/lib/types';
import { format } from 'date-fns';

interface DocumentData {
  type: 'quote' | 'invoice';
  documentNumber: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  customer: { name: string; email?: string; phone: string; address?: string; postCode?: string; region?: string };
  vehicle: {
    brand: string; model: string; year: number;
    licensePlate: string; vin?: string; color?: string;
    fuelType?: string; mileage?: number;
  };
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
  notes?: string;
  customerNotes?: string;
}

const fmt = (n: number) => n.toFixed(2).replace('.', ',');

const fmtDate = (d: string) => {
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
};

const fmtTime = (d: string) => {
  try { return format(new Date(d), 'HH:mm'); } catch { return ''; }
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FUEL_LABELS: Record<string, string> = {
  petrol: 'SP', diesel: 'GO', electric: 'EL', hybrid: 'HY', lpg: 'GPL', other: '-',
};

// Extract code from description like "Brake Pads (BRK-443)" → "BRK-443"
const extractCode = (description: string): string | null => {
  const match = description.match(/\(([^)]+)\)$/);
  return match ? match[1] : null;
};

function renderLineItems(items: QuoteLineItem[], sym: string): string {
  let rows = '';

  for (const item of items) {
    const puHtBrut   = item.unitPrice;
    const puHtRemise = item.unitPrice * (1 - item.discount / 100);
    const totalHt    = item.subtotal - item.discountAmount;
    const hasDiscount = item.discount > 0;

    rows += `
      <tr class="row-main">
        <td class="td-ref">${esc(item.code || extractCode(item.description) || '-')}</td>
        <td class="td-name">${esc(item.description)}</td>
        <td class="td-qty">${fmt(item.quantity)}</td>
        <td class="td-total">${sym}${fmt(item.total)}</td>
      </tr>`;

    if (hasDiscount) {
      rows += `
      <tr class="row-price">
        <td class="td-ref-label">Prix unitaire HT brut</td>
        <td class="td-price-detail">
          ${fmt(puHtBrut)} &nbsp;&nbsp; Prix unitaire HT avec remise &nbsp;&nbsp; ${fmt(puHtRemise)}
          &nbsp;*&nbsp; ${fmt(item.quantity)} = &nbsp;&nbsp; ${fmt(totalHt)} (Total HT)
        </td>
        <td class="td-tva">Tva : ${fmt(item.taxRate)}%</td>
        <td class="td-remise-pct">Remise saisie (ligne) -${fmt(item.discount)}%</td>
      </tr>
      <tr class="row-remise-ht">
        <td>( Remise HT : ${fmt(item.discountAmount)} )</td>
        <td colspan="3"></td>
      </tr>`;
    } else {
      rows += `
      <tr class="row-price">
        <td></td>
        <td class="td-price-detail">
          ${fmt(puHtBrut)} (P.U.HT) &nbsp;*&nbsp; ${fmt(item.quantity)} = &nbsp;&nbsp; ${fmt(totalHt)} (Total HT)
        </td>
        <td class="td-tva">Tva : ${fmt(item.taxRate)}%</td>
        <td></td>
      </tr>`;
    }
  }

  rows += `<tr class="row-close"><td colspan="4"></td></tr>`;
  return rows;
}

export function generateInvoiceHTML(data: DocumentData, settings: CompanySettings): string {
  const sym       = data.currency === 'EUR' ? '€' : data.currency;
  const isInvoice = data.type === 'invoice';
  const docLabel  = isInvoice ? 'FACTURE' : 'DEVIS';
  const addr      = settings.address;

  const postalCityLine = [addr.postalCode, addr.city, `(${addr.country})`]
    .filter(Boolean).join(' ');

  const fuelCode = FUEL_LABELS[data.vehicle.fuelType || ''] || data.vehicle.fuelType || '-';

  const logoHtml = settings.logoUrl
    ? `<img src="${esc(settings.logoUrl)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;">`
    : `<span class="logo-text">${esc(settings.companyName?.charAt(0) || 'G')}</span>`;

  const dueOrValid = isInvoice && data.dueDate
    ? `<div>Échéance : ${fmtDate(data.dueDate)}</div>`
    : !isInvoice && data.validUntil
      ? `<div>Valable jusqu'au : ${fmtDate(data.validUntil)}</div>`
      : '';

  const discountRow = data.discountTotal > 0
    ? `<tr><td class="lbl">Remises accordées</td><td class="val">-${sym}${fmt(data.discountTotal)}</td></tr>`
    : '';

  const customerNotesHtml = data.customerNotes
    ? `<div class="notes-section">
         <div class="notes-label">Notes client</div>
         <div class="notes-body">${esc(data.customerNotes)}</div>
       </div>`
    : '';

  const internalNotesHtml = data.notes
    ? `<div class="notes-section">
         <div class="notes-label">Notes internes</div>
         <div class="notes-body">${esc(data.notes)}</div>
       </div>`
    : '';

  const footerQuote = settings.invoiceFooter
    ? esc(settings.invoiceFooter)
    : `"Il appartient au conducteur d'entretenir son véhicule selon le plan d'entretien du constructeur"`;

  const lineItemsHtml = renderLineItems(data.lineItems, sym);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${docLabel} ${esc(data.documentNumber)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; color: #000; background: #fff; }
  .page { width: 210mm; min-height: 297mm; padding: 7mm 9mm; background: #fff; }

  /* LOGO */
  .header-logo-row { display: flex; justify-content: center; align-items: center; padding-bottom: 3pt; }
  .logo-wrapper {
    width: 52pt; height: 52pt; border-radius: 50%; border: 1.5pt solid #aaa;
    overflow: hidden; display: flex; align-items: center; justify-content: center;
  }
  .logo-text { font-size: 14pt; font-weight: bold; color: #333; }

  /* COMPANY + META */
  .company-meta-row {
    display: flex; justify-content: space-between; align-items: flex-start;
    border: 0.75pt solid #000; padding: 3pt 5pt; margin-bottom: 2.5pt;
  }
  .company-info { line-height: 1.35; }
  .company-name { font-size: 10pt; font-weight: bold; letter-spacing: 0.2pt; }
  .company-address { font-size: 7.5pt; }
  .company-contact { font-size: 7pt; }
  .meta-info { text-align: right; line-height: 1.5; }
  .meta-exemplaire { font-weight: bold; font-size: 9pt; }
  .meta-datetime { font-size: 7.5pt; }

  /* OR BAR */
  .or-bar { border: 0.75pt solid #000; padding: 2.5pt 5pt; font-size: 9pt; font-weight: bold; margin-bottom: 2.5pt; }

  /* VEHICLE + CUSTOMER */
  .vehicle-customer-block { display: flex; border: 0.75pt solid #000; margin-bottom: 3pt; }
  .vehicle-info { flex: 1; border-right: 0.75pt solid #000; padding: 3pt 5pt; font-size: 7.5pt; line-height: 1.45; }
  .vehicle-model { font-size: 8.5pt; font-weight: bold; margin-bottom: 1.5pt; }
  .vehicle-phone { border-top: 0.75pt solid #000; padding-top: 2pt; margin-top: 2pt; font-size: 7.5pt; }
  .customer-info { width: 46%; padding: 3pt 6pt; font-size: 7.5pt; line-height: 1.5; }
  .customer-ref { font-size: 8.5pt; font-weight: bold; }

  /* ESTIMATIF */
  .estimatif-line { font-size: 7.5pt; margin-bottom: 3pt; }

  /* NOTES */
  .notes-section { margin-bottom: 3pt; }
  .notes-label { font-size: 7pt; font-weight: bold; text-transform: uppercase; color: #555; margin-bottom: 1pt; }
  .notes-body { font-size: 7.5pt; border-left: 2pt solid #ccc; padding-left: 4pt; }

  /* TABLE */
  .invoice-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
  .invoice-table thead tr th { border: 0.75pt solid #000; padding: 2.5pt 3pt; font-size: 8pt; font-weight: bold; }
  .invoice-table thead .th-ref   { text-align: left; width: 21mm; }
  .invoice-table thead .th-desg  { text-align: center; }
  .invoice-table thead .th-qty   { text-align: right; width: 14mm; }
  .invoice-table thead .th-total { text-align: right; width: 22mm; }
  .invoice-table tbody td {
    border-left: 0.3pt solid #bbb; border-right: 0.3pt solid #bbb;
    padding: 1pt 3pt; vertical-align: top;
  }

  .row-main td { border-top: 0.3pt solid #bbb; padding-top: 2.5pt; padding-bottom: 1pt; }
  .row-main .td-ref   { font-size: 7.5pt; font-weight: bold; }
  .row-main .td-name  { font-size: 8.5pt; font-weight: bold; }
  .row-main .td-qty   { text-align: right; font-size: 8pt; }
  .row-main .td-total { text-align: right; font-size: 8.5pt; font-weight: bold; }

  .row-price td { border-top: none; padding-top: 0.5pt; padding-bottom: 0.5pt; font-size: 7pt; }
  .row-price .td-ref-label    { font-size: 7pt; white-space: nowrap; }
  .row-price .td-price-detail { font-size: 7pt; }
  .row-price .td-tva          { text-align: right; white-space: nowrap; font-size: 7pt; }
  .row-price .td-remise-pct   { text-align: right; white-space: nowrap; font-size: 6.5pt; }

  .row-remise-ht td { border-top: none; padding-top: 0; padding-bottom: 1.5pt; font-size: 6.5pt; font-style: italic; }
  .row-close td     { border-top: 0.75pt solid #000; border-left: 0.3pt solid #bbb; border-right: 0.3pt solid #bbb; padding: 0; height: 0; line-height: 0; font-size: 0; }

  /* TOTALS */
  .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 3pt; margin-bottom: 4pt; }
  .totals-table { border-collapse: collapse; font-size: 7.5pt; width: 75mm; }
  .totals-table td { border: 0.75pt solid #000; padding: 2pt 4pt; }
  .totals-table .lbl { text-align: left; }
  .totals-table .val { text-align: right; min-width: 22mm; }
  .totals-table .row-grand td { font-weight: bold; font-size: 8pt; }

  /* FOOTER */
  .footer-quote { text-align: center; font-size: 7pt; font-style: italic; border-top: 0.75pt solid #000; padding: 3pt 0 1pt 0; line-height: 1.4; }
  .footer-legal-bar { border-top: 0.75pt solid #000; text-align: center; font-size: 6.5pt; padding-top: 2pt; line-height: 1.5; }
  .footer-bottom-bar { display: flex; align-items: center; justify-content: space-between; margin-top: 3pt; }
  .footer-logo-badge { display: flex; align-items: center; gap: 4pt; }
  .footer-logo-small { width: 20pt; height: 20pt; border-radius: 50%; border: 0.75pt solid #000; display: flex; align-items: center; justify-content: center; font-size: 6pt; font-weight: bold; overflow: hidden; }
  .feuillet-badge { border: 0.75pt solid #000; padding: 1pt 3pt; font-size: 6pt; font-weight: bold; letter-spacing: 0.5pt; }

  @media print {
    @page { size: A4 portrait; margin: 0; }
    html, body { width: 210mm; }
    .page { width: 210mm; min-height: 297mm; padding: 7mm 9mm; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- LOGO ROW -->
  <div class="header-logo-row">
    <div class="logo-wrapper">${logoHtml}</div>
  </div>

  <!-- COMPANY INFO + META -->
  <div class="company-meta-row">
    <div class="company-info">
      <div class="company-name">${esc(settings.companyName)}</div>
      <div class="company-address">${esc(addr.street)}</div>
      <div class="company-address">${esc(postalCityLine)}</div>
      <div class="company-contact">Tél : ${esc(settings.phone)}${settings.email ? ` / Email : ${esc(settings.email)}` : ''}</div>
      ${settings.taxId ? `<div class="company-contact">TVA : ${esc(settings.taxId)}</div>` : ''}
    </div>
    <div class="meta-info">
      <div class="meta-exemplaire">${esc(docLabel)} N° ${esc(data.documentNumber)}</div>
      <div class="meta-datetime">${fmtDate(data.issueDate)} &nbsp;&nbsp; ${fmtTime(data.issueDate)}</div>
      ${dueOrValid}
    </div>
  </div>

  <!-- OR REFERENCE BAR -->
  <div class="or-bar">O.R. N° ${esc(data.documentNumber)}</div>

  <!-- VEHICLE + CUSTOMER BLOCK -->
  <div class="vehicle-customer-block">
    <div class="vehicle-info">
      <div class="vehicle-model">${esc(data.vehicle.brand)} - ${esc(data.vehicle.model)}</div>
      <div>Année : ${data.vehicle.year}${data.vehicle.vin ? ` &nbsp;&nbsp; Série : ${esc(data.vehicle.vin)}` : ''}</div>
      <div>Immatriculation : <strong>${esc(data.vehicle.licensePlate)}</strong> &nbsp;&nbsp; Energie : ${esc(fuelCode)}${data.vehicle.mileage ? ` &nbsp;&nbsp; KM : ${data.vehicle.mileage.toLocaleString('fr-FR')}` : ''}</div>
      ${data.vehicle.color ? `<div>Couleur : ${esc(data.vehicle.color)}</div>` : ''}
      ${data.customer.phone ? `<div class="vehicle-phone">Téléphone : ${esc(data.customer.phone)}</div>` : ''}
    </div>
    <div class="customer-info">
      <div class="customer-ref">${esc(data.customer.name)}</div>
      ${data.customer.address ? `<div>${esc(data.customer.address)}</div>` : ''}
      ${(data.customer.postCode || data.customer.region) ? `<div>${[data.customer.postCode, data.customer.region].filter(Boolean).map(esc).join(' ')}</div>` : ''}
      ${data.customer.email ? `<div>${esc(data.customer.email)}</div>` : ''}
    </div>
  </div>

  <!-- ESTIMATIF LINE -->
  <div class="estimatif-line">${isInvoice ? 'Facture de réparation automobile.' : 'Devis estimatif, sous réserve de démontage.'}</div>

  <!-- CUSTOMER NOTES -->
  ${customerNotesHtml}

  <!-- MAIN TABLE -->
  <table class="invoice-table">
    <thead>
      <tr>
        <th class="th-ref">Référence</th>
        <th class="th-desg">Désignation</th>
        <th class="th-qty">Qté</th>
        <th class="th-total">Total TTC</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>

  <!-- TOTALS -->
  <div class="totals-wrapper">
    <table class="totals-table">
      <tr><td class="lbl">Total HT</td><td class="val">${sym}${fmt(data.subtotal)}</td></tr>
      ${discountRow}
      <tr><td class="lbl">TVA</td><td class="val">${sym}${fmt(data.taxTotal)}</td></tr>
      <tr class="row-grand"><td class="lbl">Total TTC</td><td class="val">${sym}${fmt(data.grandTotal)}</td></tr>
    </table>
  </div>

  <!-- INTERNAL NOTES -->
  ${internalNotesHtml}

  <!-- FOOTER -->
  <div class="footer-quote">${footerQuote}</div>
  <div class="footer-legal-bar">
    <div>${esc(settings.companyName)} &nbsp;·&nbsp; ${esc(addr.street)} ${esc(postalCityLine)} &nbsp;·&nbsp; Tél. ${esc(settings.phone)}</div>
    <div>
      ${settings.registrationNumber ? `Siret ${esc(settings.registrationNumber)} &nbsp;·&nbsp; ` : ''}${settings.taxId ? `Code TVA ${esc(settings.taxId)}` : ''}
    </div>
  </div>
  <div class="footer-bottom-bar">
    <div class="footer-logo-badge">
      <div class="footer-logo-small">
        ${settings.logoUrl ? `<img src="${esc(settings.logoUrl)}" width="18" height="18" style="object-fit:contain;">` : esc(settings.companyName?.charAt(0) || 'G')}
      </div>
      <div class="feuillet-badge">${esc(docLabel)}</div>
    </div>
    <div style="font-size:6pt;color:#666;">${esc(data.documentNumber)}</div>
  </div>

</div>
</body>
</html>`;
}

export function printDocumentHTML(
  data: Parameters<typeof generateInvoiceHTML>[0],
  settings: CompanySettings
): void {
  const html = generateInvoiceHTML(data, settings);
  const win = window.open('', '_blank');
  if (!win) {
    console.error('Popup blocked. Allow popups for this site to print.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}
