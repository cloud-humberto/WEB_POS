import { jsPDF } from 'jspdf';
import { formatCurrency, formatDateTime } from './formatters';

/**
 * Generates an 80mm POS customer receipt PDF and opens it in a new browser tab.
 * @param {Object} sale - The completed sale record.
 * @param {Window} targetWindow - Optional pre-opened browser window to bypass popup blockers.
 */
export function openReceiptPdfInNewTab(sale, targetWindow = null) {
  try {
    if (!sale) return;
    const items = sale.items || [];
    const itemHeight = 9;
    const baseHeight = 135;
    const totalHeight = Math.max(160, baseHeight + (items.length * itemHeight));

    // 80mm width thermal roll format
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, totalHeight]
    });

    doc.setFont('courier', 'normal');
    let y = 10;

    // Header
    doc.setFontSize(11);
    doc.setFont('courier', 'bold');
    doc.text('NOVAPOS RETAIL STORE', 40, y, { align: 'center' });
    y += 5;

    doc.setFontSize(7.5);
    doc.setFont('courier', 'normal');
    doc.text('STORE #0101 - TERMINAL ' + (sale.posStation || '01'), 40, y, { align: 'center' });
    y += 4;
    doc.text('100 MAIN STREET, SAN FRANCISCO, CA', 40, y, { align: 'center' });
    y += 4;
    doc.text('TEL: (415) 555-0199', 40, y, { align: 'center' });
    y += 4;

    doc.text('========================================', 40, y, { align: 'center' });
    y += 4;

    doc.setFont('courier', 'bold');
    doc.text('CUSTOMER RECEIPT #' + String(sale.saleNumber).padStart(6, '0'), 40, y, { align: 'center' });
    y += 4;
    doc.setFont('courier', 'normal');
    doc.text('========================================', 40, y, { align: 'center' });
    y += 5;

    // Metadata
    doc.setFontSize(7);
    doc.text('DATE: ' + formatDateTime(sale.timestamp), 5, y);
    y += 4;
    doc.text('OPERATOR: ' + (sale.operator || 'CASHIER'), 5, y);
    y += 4;
    if (sale.customer && sale.customer.phone) {
      doc.text('CUSTOMER: ' + sale.customer.phone, 5, y);
      y += 4;
    }

    doc.text('----------------------------------------', 40, y, { align: 'center' });
    y += 4;

    // Items Table Header
    doc.setFont('courier', 'bold');
    doc.text('QTY  DESCRIPTION', 5, y);
    doc.text('TOTAL', 75, y, { align: 'right' });
    y += 3;
    doc.setFont('courier', 'normal');
    doc.text('----------------------------------------', 40, y, { align: 'center' });
    y += 4;

    // Items
    sale.items.forEach((item) => {
      doc.setFont('courier', 'bold');
      const itemDesc = `${item.qty}x ${item.name.slice(0, 22)}`;
      doc.text(itemDesc, 5, y);
      doc.text(formatCurrency(item.total), 75, y, { align: 'right' });
      y += 3.5;

      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.text(`   SKU: ${item.barcode.slice(-6)} @ ${formatCurrency(item.price)}`, 5, y);
      if (item.discount > 0) {
        doc.text(`(DISC -${formatCurrency(item.discount)})`, 55, y);
      }
      y += 4.5;
      doc.setFontSize(7);
    });

    doc.text('----------------------------------------', 40, y, { align: 'center' });
    y += 4;

    // Totals
    const totalItems = sale.items.reduce((acc, it) => acc + it.qty, 0);
    doc.text('TOTAL ITEMS SOLD:', 5, y);
    doc.text(String(totalItems), 75, y, { align: 'right' });
    y += 4;

    doc.text('SUBTOTAL:', 5, y);
    doc.text(formatCurrency(sale.subtotal), 75, y, { align: 'right' });
    y += 4;

    if (sale.discountTotal > 0) {
      doc.text('DISCOUNT APPLIED:', 5, y);
      doc.text('-' + formatCurrency(sale.discountTotal), 75, y, { align: 'right' });
      y += 4;
    }

    doc.text('SALES TAX (8.0%):', 5, y);
    doc.text(formatCurrency(sale.taxAmount || 0), 75, y, { align: 'right' });
    y += 4;

    doc.text('========================================', 40, y, { align: 'center' });
    y += 4.5;

    doc.setFontSize(9);
    doc.setFont('courier', 'bold');
    doc.text('TOTAL DUE:', 5, y);
    doc.text(formatCurrency(sale.totalAmount), 75, y, { align: 'right' });
    y += 5;

    doc.setFontSize(7);
    doc.setFont('courier', 'normal');
    doc.text('========================================', 40, y, { align: 'center' });
    y += 4;

    // Payment Tender
    const paymentMethod = String(sale.payment?.method || 'CASH').toUpperCase();
    doc.text('TENDER METHOD:', 5, y);
    doc.text(paymentMethod, 75, y, { align: 'right' });
    y += 4;

    if (sale.payment?.method === 'cash') {
      doc.text('AMOUNT TENDERED:', 5, y);
      doc.text(formatCurrency(sale.payment.receivedAmount), 75, y, { align: 'right' });
      y += 4;

      doc.setFont('courier', 'bold');
      doc.text('CHANGE DUE:', 5, y);
      doc.text(formatCurrency(sale.payment.change || 0), 75, y, { align: 'right' });
      y += 4;
      doc.setFont('courier', 'normal');
    }

    doc.text('----------------------------------------', 40, y, { align: 'center' });
    y += 5;

    // Footer
    doc.setFontSize(7.5);
    doc.setFont('courier', 'bold');
    doc.text('THANK YOU FOR YOUR BUSINESS!', 40, y, { align: 'center' });
    y += 4;
    doc.setFontSize(6.5);
    doc.setFont('courier', 'normal');
    doc.text('RETURN WITHIN 30 DAYS WITH RECEIPT', 40, y, { align: 'center' });
    y += 4;
    doc.text('*' + sale.id + '*', 40, y, { align: 'center' });

    // Open PDF directly in a new tab via blob URL and embedded viewer
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const saleNum = String(sale.saleNumber || '').padStart(6, '0');

    const renderViewerHtml = (title, url) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RECEIPT #${saleNum} - NOVAPOS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0f172a; font-family: monospace; }
    .pdf-bar { height: 44px; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 2px solid #334155; }
    .pdf-title { font-size: 13px; font-weight: 800; letter-spacing: 0.05em; color: #38bdf8; }
    .pdf-actions { display: flex; gap: 8px; }
    .pdf-btn { background: #334155; color: #fff; border: 1px solid #475569; padding: 5px 12px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 2px; text-decoration: none; display: inline-flex; align-items: center; font-family: monospace; }
    .pdf-btn:hover { background: #475569; }
    .pdf-btn.print { background: #15803d; border-color: #16a34a; }
    .pdf-btn.print:hover { background: #166534; }
    iframe { width: 100%; height: calc(100% - 44px); border: none; background: #525659; display: block; }
  </style>
</head>
<body>
  <div class="pdf-bar">
    <div class="pdf-title">NOVAPOS &bull; 80MM CUSTOMER RECEIPT #${saleNum}</div>
    <div class="pdf-actions">
      <button class="pdf-btn print" onclick="const f=document.getElementById('receiptFrame'); if(f && f.contentWindow) { f.contentWindow.focus(); f.contentWindow.print(); } else { window.print(); }">PRINT RECEIPT [P]</button>
      <a class="pdf-btn" href="${url}" download="Receipt-${saleNum}.pdf">DOWNLOAD PDF</a>
      <button class="pdf-btn" onclick="window.close()">CLOSE TAB [ESC]</button>
    </div>
  </div>
  <iframe id="receiptFrame" src="${url}"></iframe>
</body>
</html>`;

    if (targetWindow && !targetWindow.closed) {
      try {
        targetWindow.document.open();
        targetWindow.document.write(renderViewerHtml(saleNum, blobUrl));
        targetWindow.document.close();
        return blobUrl;
      } catch (err) {
        console.warn('Could not inject into targetWindow:', err);
      }
    }

    // Fallback: If targetWindow wasn't provided or was closed, try to open new window
    try {
      const newWin = window.open('', '_blank');
      if (newWin && !newWin.closed) {
        newWin.document.open();
        newWin.document.write(renderViewerHtml(saleNum, blobUrl));
        newWin.document.close();
        return blobUrl;
      }
    } catch (e) {
      console.warn('Window open fallback failed:', e);
    }

    // Absolute fallback: download the PDF directly
    try {
      doc.save(`Receipt-${saleNum}.pdf`);
    } catch (e) {}

    return blobUrl;
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
  }
}
