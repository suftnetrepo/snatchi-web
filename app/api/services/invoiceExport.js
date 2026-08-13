const cleanText = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/[^\x20-\x7E]/g, '').trim();
const pdfEscape = (value) => cleanText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const money = (value) => `GBP ${Number(value || 0).toFixed(2)}`;
const dateText = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
const shortId = (invoice) => String(invoice?._id || '').slice(-8).toUpperCase();

const textCommand = (text, x, y, size = 10, font = 'F1') =>
  `BT /${font} ${size} Tf 0.063 0.165 0.263 rg ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;

const buildPageStream = (invoice, items, pageNumber, pageCount) => {
  const commands = [
    '0.035 0.498 0.451 rg 0 740 612 52 re f',
    '0.071 0.204 0.302 rg 0 0 612 740 re f',
    '1 1 1 rg 35 35 542 675 re f',
    textCommand('SNATCHI', 52, 765, 11, 'F2'),
    textCommand(`INVOICE #${shortId(invoice)}`, 52, 690, 22, 'F2'),
    textCommand(`Status: ${invoice.status}`, 52, 666, 10, 'F2'),
    textCommand(`Issue date: ${dateText(invoice.issueDate)}`, 385, 690, 10),
    textCommand(`Due date: ${dateText(invoice.due_on)}`, 385, 673, 10),
    textCommand(`Engineer: ${cleanText(`${invoice.user?.first_name || ''} ${invoice.user?.last_name || ''}`) || 'Unassigned'}`, 52, 625, 11, 'F2'),
    textCommand(cleanText(invoice.invoice_description || 'Invoice'), 52, 605, 10),
    '0.88 0.91 0.93 RG 52 580 m 560 580 l S',
    textCommand('DATE', 52, 560, 9, 'F2'), textCommand('DESCRIPTION', 125, 560, 9, 'F2'),
    textCommand('QTY', 390, 560, 9, 'F2'), textCommand('RATE', 445, 560, 9, 'F2'), textCommand('AMOUNT', 505, 560, 9, 'F2')
  ];

  let y = 536;
  items.forEach((item) => {
    commands.push(textCommand(item.date || '', 52, y, 9));
    commands.push(textCommand(cleanText(item.description || 'Service').slice(0, 42), 125, y, 9));
    commands.push(textCommand(`${Number(item.duration || 0)} ${item.unit || ''}`, 390, y, 9));
    commands.push(textCommand(money(item.rate), 445, y, 9));
    commands.push(textCommand(money(Number(item.duration || 0) * Number(item.rate || 0)), 505, y, 9));
    y -= 24;
  });

  if (pageNumber === pageCount) {
    commands.push('0.94 0.97 0.98 rg 350 155 210 125 re f');
    commands.push(textCommand('Subtotal', 370, 245, 10), textCommand(money(invoice.subtotal), 475, 245, 10, 'F2'));
    commands.push(textCommand('Tax', 370, 220, 10), textCommand(money(invoice.tax), 475, 220, 10, 'F2'));
    if (Number(invoice.discount || 0)) commands.push(textCommand('Discount', 370, 195, 10), textCommand(`-${money(invoice.discount)}`, 475, 195, 10, 'F2'));
    commands.push('0.071 0.204 0.302 rg 350 110 210 45 re f');
    commands.push('BT /F2 12 Tf 1 1 1 rg 370 127 Td (TOTAL) Tj ET');
    commands.push(`BT /F2 13 Tf 1 1 1 rg 465 127 Td (${pdfEscape(money(invoice.totalAmount))}) Tj ET`);
    if (invoice.notes) commands.push(textCommand(`Notes: ${cleanText(invoice.notes).slice(0, 90)}`, 52, 125, 9));
  }
  commands.push(textCommand(`Page ${pageNumber} of ${pageCount}`, 500, 55, 8));
  return commands.join('\n');
};

const generateInvoicePdf = (invoice) => {
  const allItems = invoice.items?.length ? invoice.items : [{}];
  const pages = [];
  for (let index = 0; index < allItems.length; index += 14) pages.push(allItems.slice(index, index + 14));
  const objects = [null];
  const addObject = (content = '') => { objects.push(content); return objects.length - 1; };
  const catalogId = addObject();
  const pagesId = addObject();
  const regularFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const boldFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds = pages.map((items, index) => {
    const stream = buildPageStream(invoice, items, index + 1, pages.length);
    const streamId = addObject(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    return addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${streamId} 0 R >>`);
  });
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = Buffer.byteLength(pdf);
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
};

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const generateInvoiceCsv = (invoice) => {
  const headers = ['Invoice Number', 'Status', 'Type', 'Engineer', 'Issue Date', 'Due Date', 'Item Date', 'Description', 'Unit', 'Duration', 'Rate GBP', 'Line Total GBP', 'Subtotal GBP', 'Tax GBP', 'Discount GBP', 'Total GBP', 'Notes'];
  const engineer = cleanText(`${invoice.user?.first_name || ''} ${invoice.user?.last_name || ''}`) || 'Unassigned';
  const items = invoice.items?.length ? invoice.items : [{}];
  const rows = items.map((item) => [shortId(invoice), invoice.status, invoice.invoice_type, engineer, dateText(invoice.issueDate), dateText(invoice.due_on), item.date || '', item.description || '', item.unit || '', item.duration || 0, Number(item.rate || 0).toFixed(2), (Number(item.duration || 0) * Number(item.rate || 0)).toFixed(2), Number(invoice.subtotal || 0).toFixed(2), Number(invoice.tax || 0).toFixed(2), Number(invoice.discount || 0).toFixed(2), Number(invoice.totalAmount || 0).toFixed(2), invoice.notes || '']);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
};

const generateInvoiceRegisterCsv = (invoices) => {
  const headers = ['Invoice Number', 'Status', 'Type', 'Engineer', 'Issue Date', 'Due Date', 'Description', 'Subtotal GBP', 'Tax GBP', 'Discount GBP', 'Total GBP', 'Notes'];
  const rows = invoices.map((invoice) => {
    const engineer = cleanText(`${invoice.user?.first_name || ''} ${invoice.user?.last_name || ''}`) || 'Unassigned';
    return [shortId(invoice), invoice.status, invoice.invoice_type, engineer, dateText(invoice.issueDate), dateText(invoice.due_on), invoice.invoice_description || '', Number(invoice.subtotal || 0).toFixed(2), Number(invoice.tax || 0).toFixed(2), Number(invoice.discount || 0).toFixed(2), Number(invoice.totalAmount || 0).toFixed(2), invoice.notes || ''];
  });
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
};

export { generateInvoicePdf, generateInvoiceCsv, generateInvoiceRegisterCsv };
