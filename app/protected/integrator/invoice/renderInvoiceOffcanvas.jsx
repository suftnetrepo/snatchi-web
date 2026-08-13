'use client';

import { useEffect, useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { MdClose, MdCalendarMonth, MdPersonOutline, MdPictureAsPdf } from 'react-icons/md';
import { FaFileCsv } from 'react-icons/fa';
import { formatCurrency, formatReadableDate } from '../../../../utils/helpers';
import { OkDialogue } from '../../../../src/components/elements/ConfirmDialogue';
import styles from './invoice.module.scss';

const RenderInvoiceOffcanvas = ({ show, success, loading, handleClose, invoice, handleEditInvoice }) => {
  const [status, setStatus] = useState(invoice?.status || 'Unpaid');

  useEffect(() => setStatus(invoice?.status || 'Unpaid'), [invoice]);

  const saveStatus = async () => {
    if (status === invoice.status) return;
    await handleEditInvoice({ status }, invoice._id);
  };

  const engineerName = invoice.user
    ? `${invoice.user.first_name || ''} ${invoice.user.last_name || ''}`.trim()
    : 'Unassigned';

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" className={styles.invoiceDrawer}>
      <header className={styles.drawerHeader}>
        <div>
          <span className={styles.eyebrow}>Invoice details</span>
          <h2>#{invoice?._id?.slice(-8).toUpperCase()}</h2>
          <span className={`${styles.status} ${styles[`status${status}`] || styles.statusDefault}`}>{status}</span>
        </div>
        <button type="button" onClick={handleClose} aria-label="Close invoice"><MdClose /></button>
      </header>

      <Offcanvas.Body className={styles.drawerBody}>
        <div className={styles.exportActions}>
          <a href={`/api/invoice/export?id=${invoice._id}&format=pdf`} download><MdPictureAsPdf /> Download PDF</a>
          <a href={`/api/invoice/export?id=${invoice._id}&format=csv`} download><FaFileCsv /> Download CSV</a>
        </div>
        <section className={styles.invoiceMeta}>
          <div><MdPersonOutline /><span>Engineer<small>{engineerName}</small></span></div>
          <div><MdCalendarMonth /><span>Issued<small>{formatReadableDate(invoice.issueDate)}</small></span></div>
          <div><MdCalendarMonth /><span>Due date<small>{formatReadableDate(invoice.due_on)}</small></span></div>
        </section>

        <section className={styles.detailSection}>
          <span className={styles.sectionTitle}>Description</span>
          <p>{invoice.invoice_description || 'No description provided.'}</p>
        </section>

        <section className={styles.detailSection}>
          <div className={styles.sectionHeading}><span className={styles.sectionTitle}>Line items</span><span>{invoice.items?.length || 0} item{invoice.items?.length === 1 ? '' : 's'}</span></div>
          <div className={styles.itemList}>
            {(invoice.items || []).map((item, index) => (
              <article key={item._id || index}>
                <div><strong>{item.description || 'Service item'}</strong><small>{item.date || 'Date not specified'} · {item.duration || 0} {item.unit || 'unit'}{Number(item.duration) === 1 ? '' : 's'}</small></div>
                <span>{formatCurrency('£', Number(item.rate || 0) * Number(item.duration || 0))}</span>
              </article>
            ))}
            {!invoice.items?.length && <div className={styles.noItems}>No line items are attached to this invoice.</div>}
          </div>
        </section>

        <section className={styles.totalsCard}>
          <div><span>Subtotal</span><strong>{formatCurrency('£', invoice.subtotal || 0)}</strong></div>
          {Number(invoice.discount || 0) > 0 && <div><span>Discount</span><strong>−{formatCurrency('£', invoice.discount)}</strong></div>}
          <div><span>Tax</span><strong>{formatCurrency('£', invoice.tax || 0)}</strong></div>
          <div className={styles.grandTotal}><span>Total</span><strong>{formatCurrency('£', invoice.totalAmount || 0)}</strong></div>
        </section>

        {invoice.notes && <section className={styles.detailSection}><span className={styles.sectionTitle}>Notes</span><p>{invoice.notes}</p></section>}

        <section className={styles.statusEditor}>
          <div><span className={styles.sectionTitle}>Invoice status</span><p>Keep the billing record aligned with its current outcome.</p></div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} disabled={loading} aria-label="Invoice status"><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option><option value="Cancelled">Cancelled</option></select>
          <button type="button" onClick={saveStatus} disabled={loading || status === invoice.status}>{loading ? 'Saving…' : 'Save status'}</button>
        </section>

        <OkDialogue show={success} message="Invoice status updated successfully." onConfirm={handleClose} />
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export { RenderInvoiceOffcanvas };
