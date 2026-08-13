'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaDatabase, FaEye, FaFileCsv, FaFileInvoice, FaSearch } from 'react-icons/fa';
import { MdChevronLeft, MdChevronRight, MdFirstPage, MdLastPage, MdDateRange, MdClose } from 'react-icons/md';
import { useInvoice } from '../../../../hooks/useInvoice';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import { dateFormatted, formatCurrency } from '../../../../utils/helpers';
import { RenderInvoiceOffcanvas } from './renderInvoiceOffcanvas';
import styles from './invoice.module.scss';
import { setPageHelpContext } from '../help/guides';

const statusClass = (status) => styles[`status${status}`] || styles.statusDefault;

const Invoice = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [show, setShow] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, error, loading, totalCount, handleFetch, handleEditInvoice, success, handleReset } = useInvoice();
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));
  const registerExportUrl = useMemo(() => {
    const params = new URLSearchParams({ format: 'csv', scope: 'register' });
    if (debouncedSearchQuery) params.set('searchQuery', debouncedSearchQuery);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return `/api/invoice/export?${params.toString()}`;
  }, [dateFrom, dateTo, debouncedSearchQuery]);

  useEffect(() => {
    handleFetch({ pageIndex: page, pageSize, sortBy: [{ id: 'createdAt', desc: true }], searchQuery: debouncedSearchQuery, dateFrom, dateTo });
  }, [dateFrom, dateTo, debouncedSearchQuery, handleFetch, page, pageSize]);

  useEffect(() => setPage(1), [dateFrom, dateTo, debouncedSearchQuery, pageSize]);

  const pageSummary = useMemo(() => ({
    paid: data.filter((item) => item.status === 'Paid').length,
    outstanding: data.filter((item) => item.status === 'Unpaid').length,
    value: data.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
  }), [data]);

  const handleClose = () => {
    setShow(false);
    handleReset();
  };

  const openInvoice = (selectedInvoice) => {
    setPageHelpContext('invoices');
    setInvoice(selectedInvoice);
    setShow(true);
  };

  const seedInvoices = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedError('');
    try {
      const response = await fetch('/api/invoice/seed', { method: 'POST', credentials: 'include' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to seed invoices');
      setPage(1);
      setSearchQuery('');
      setDateFrom('');
      setDateTo('');
      await handleFetch({ pageIndex: 1, pageSize, sortBy: [{ id: 'createdAt', desc: true }], searchQuery: '' });
    } catch (seedError) {
      setSeedError(seedError.message || 'Unable to seed invoices');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Billing workspace</span>
          <h1>Invoices</h1>
          <p>Review billing records, amounts and payment status from one place.</p>
        </div>
        <div className={styles.heroActions}>
          {process.env.NODE_ENV === 'development' && (
            <div className={styles.seedControl}>
              <button type="button" onClick={seedInvoices} disabled={seeding} className={styles.seedButton}>
                <FaDatabase /> {seeding ? 'Seeding…' : 'Seed 10 invoices'}
              </button>
              {seedError && <small role="alert">{seedError}</small>}
            </div>
          )}
          <div className={styles.heroIcon}><FaFileInvoice /></div>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <article><span>Total records</span><strong>{totalCount || 0}</strong><small>Across your organisation</small></article>
        <article><span>Paid on this page</span><strong>{pageSummary.paid}</strong><small>Completed invoices</small></article>
        <article><span>Outstanding on this page</span><strong>{pageSummary.outstanding}</strong><small>Requires attention</small></article>
        <article><span>Page value</span><strong>{formatCurrency('£', pageSummary.value)}</strong><small>Current results</small></article>
      </section>

      <section className={styles.invoicePanel}>
        <div className={styles.toolbar}>
          <div>
            <h2>Invoice register</h2>
            <p>{totalCount || 0} billing record{totalCount === 1 ? '' : 's'}</p>
          </div>
          <div className={styles.filters}>
            <a className={styles.exportRegister} href={registerExportUrl} download>
              <FaFileCsv /> Export CSV
            </a>
            <div className={styles.dateRange}>
              <MdDateRange />
              <label>From<input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
              <span>to</span>
              <label>To<input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
              {(dateFrom || dateTo) && <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); }} aria-label="Clear date range"><MdClose /></button>}
            </div>
            <div className={styles.searchBox}>
              <FaSearch />
              <input
                type="search"
                placeholder="Search invoices"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search invoices"
              />
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className="table table-bordered table-striped">
            <thead><tr><th>Invoice</th><th>Engineer</th><th>Issued</th><th>Type</th><th className={styles.numeric}>Subtotal</th><th className={styles.numeric}>Tax</th><th className={styles.numeric}>Total</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {!loading && data.map((item) => (
                <tr key={item._id}>
                  <td><button className={styles.invoiceNumber} onClick={() => openInvoice(item)}>#{item._id?.slice(-8).toUpperCase()}</button><small>{item.invoice_description || 'Invoice record'}</small></td>
                  <td><strong>{item.user ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() : 'Unassigned'}</strong></td>
                  <td>{dateFormatted(item.issueDate)}</td>
                  <td><span className={styles.typeBadge}>{item.invoice_type}</span></td>
                  <td className={styles.numeric}>{formatCurrency('£', item.subtotal || 0)}</td>
                  <td className={styles.numeric}>{formatCurrency('£', item.tax || 0)}</td>
                  <td className={`${styles.numeric} ${styles.total}`}>{formatCurrency('£', item.totalAmount || 0)}</td>
                  <td><span className={`${styles.status} ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td><button className={styles.viewButton} onClick={() => openInvoice(item)} aria-label={`View invoice ${item._id?.slice(-8)}`}><FaEye /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className={styles.loadingState}><span /><p>Loading invoices…</p></div>}
          {!loading && data.length === 0 && <div className={styles.emptyState}><FaFileInvoice /><h3>No invoices found</h3><p>{searchQuery ? 'Try a different search term.' : 'Invoice records will appear here when they are created.'}</p></div>}
        </div>

        <footer className={styles.pagination}>
          <div className={styles.pageButtons}>
            <button onClick={() => setPage(1)} disabled={page <= 1 || loading} aria-label="First page"><MdFirstPage /></button>
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} aria-label="Previous page"><MdChevronLeft /></button>
            <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || loading} aria-label="Next page"><MdChevronRight /></button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages || loading} aria-label="Last page"><MdLastPage /></button>
          </div>
          <span>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
          <label className={styles.goToPage}>Go to page:
            <input type="number" min="1" max={totalPages} value={page} onChange={(event) => setPage(Math.min(totalPages, Math.max(1, Number(event.target.value) || 1)))} />
          </label>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Invoices per page"><option value={10}>Show 10</option><option value={20}>Show 20</option><option value={50}>Show 50</option></select>
        </footer>
      </section>

      {error && <ErrorDialogue showError={error} onClose={handleReset} />}
      {invoice && <RenderInvoiceOffcanvas show={show} success={success} loading={loading} handleEditInvoice={handleEditInvoice} handleClose={handleClose} invoice={invoice} />}
    </main>
  );
};

export default Invoice;
