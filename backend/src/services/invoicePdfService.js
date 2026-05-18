const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function renderInvoiceHtml(snapshot) {
  const safeNum = (n) => (typeof n === 'number' ? n : 0);
  const itemsHtml = (snapshot.items || []).map(i => `
    <tr>
      <td>${i.description || 'Item'}</td>
      <td style="text-align:right">${safeNum(i.quantity)}</td>
      <td style="text-align:right">${safeNum(i.unitPrice).toFixed(2)}</td>
      <td style="text-align:right">${safeNum(i.total).toFixed(2)}</td>
    </tr>`).join('\n');

  return `
  <html>
  <head><meta charset="utf-8"><title>Invoice ${snapshot.invoiceNumber || 'Unknown'}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;font-size:12px}
    table{width:100%;border-collapse:collapse}
    th,td{padding:6px;border-bottom:1px solid #eee}
  </style>
  </head>
  <body>
    <h2>Invoice ${snapshot.invoiceNumber || 'Unknown'}</h2>
    <div>Generated: ${snapshot.generatedAt ? new Date(snapshot.generatedAt).toLocaleString() : 'N/A'}</div>
    <table>
      <thead><tr><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <div style="text-align:right;margin-top:12px">
      <div>Subtotal: ${safeNum(snapshot.subtotal).toFixed(2)}</div>
      <div>Taxes: ${safeNum(snapshot.taxes).toFixed(2)}</div>
      <div>Discount: ${safeNum(snapshot.discount).toFixed(2)}</div>
      <h3>Payable: ${safeNum(snapshot.finalAmount).toFixed(2)}</h3>
    </div>
  </body>
  </html>`;
}

async function generatePdf(snapshot) {
  const html = await renderInvoiceHtml(snapshot);
  const outDir = process.env.INVOICE_PDF_DIR || path.join(process.cwd(), 'storage', 'invoices');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filename = `invoice-${snapshot.invoiceNumber}-${Date.now()}.pdf`;
  const outPath = path.join(outDir, filename);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: outPath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }

  return { path: outPath, url: `/storage/invoices/${filename}` };
}

module.exports = { renderInvoiceHtml, generatePdf };
