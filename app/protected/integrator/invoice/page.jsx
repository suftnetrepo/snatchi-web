'use client';

import React, { Fragment, useMemo, useState } from 'react';
import { Table } from '@/components/elements/table/table';
import { useInvoice } from '../../../../hooks/useInvoice';
import { FaEye } from 'react-icons/fa';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import { dateFormatted, formatCurrency } from '../../../../utils/helpers';
import Tooltip from '@mui/material/Tooltip';
import { RenderInvoiceOffcanvas } from './renderInvoiceOffcanvas';

const Invoice = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [show, setShow] = useState(false);
  const [invoice, setInvoice] = useState();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, error, loading, totalCount, handleFetch, handleEditInvoice, success,handleReset } = useInvoice(debouncedSearchQuery);

  console.log('Invoice data:', data);

  const handleClose = () => {
    setShow(false);
    handleReset()
  };
  const handleShow = () => {
    setShow(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-success';
      case 'Unpaid':
        return 'bg-warning';
      case 'Cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Invoice No',
        accessor: '_id',
        Cell: ({ value }) => <div className="d-flex align-items-center">{value?.toString().slice(-8)}</div>
      },
      {
        Header: 'Type',
        accessor: 'invoice_type',
        Cell: ({ value }) => <div className="d-flex align-items-center">{value}</div>
      },
      {
        Header: 'Engineer',
        accessor: 'user',
        headerClassName: { textAlign: 'center' },
        Cell: ({ value }) => (
          <div className="d-flex justify-content-start align-items-center">
            <span >{value.first_name} {value.last_name}</span>
          </div>
        )
      },
      {
        Header: 'Issue Date',
        accessor: 'issueDate',
        Cell: ({ value }) => <div className="d-flex align-items-center">{dateFormatted(value)}</div>
      },
      {
        Header: 'Subtotal',
        accessor: 'subtotal',
        Cell: ({ value }) => <div className="d-flex align-items-center">{formatCurrency('£', value|| 0)}</div>
      },
      {
        Header: 'Tax',
        accessor: 'tax',
        Cell: ({ value }) => <div className="d-flex align-items-center">{formatCurrency('£', value|| 0)}</div>
      },
      {
        Header: 'Total',
        accessor: 'totalAmount',
        Cell: ({ value }) => <div className="d-flex align-items-center">{formatCurrency('£', value|| 0)}</div>
      },
      {
        Header: 'Status',
        accessor: 'status',
        headerClassName: { textAlign: 'center' },
        Cell: ({ value }) => (
          <div className="d-flex justify-content-start align-items-center">
            <span className={`badge ${getStatusBadgeClass(value)}`}>{value}</span>
          </div>
        )
      },
      {
        Header: 'Actions',
        disableSortBy: true,
        textAlign: 'right',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center align-items-center">
            <Tooltip title="View Invoice" arrow>
              <span className="p-0">
                <FaEye
                  size={30}
                  className="pointer me-2"
                  onClick={() => {
                    setInvoice(row.original);
                    handleShow();
                  }}
                />
              </span>
            </Tooltip>
          </div>
        )
      }
    ],
    []
  );

  return (
    <Fragment key={show}>
      <div className={`ms-5 me-5 mt-2 ${!loading ? 'overlay__block' : null}`}>
        <div className="card-body">
          <h3 className="card-title ms-2 mb-2">Invoices</h3>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <input
              type="text"
              className="form-control w-25"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
         <Table data={data} columns={columns} pageCount={totalCount} loading={loading} fetchData={handleFetch} /> 
        </div>
      </div>
      {!loading && <span className="overlay__block" />}
      {error && <ErrorDialogue showError={error} onClose={() => {}} />}
      {invoice && <RenderInvoiceOffcanvas show={show} success={success} handleEditInvoice={handleEditInvoice} handleClose={handleClose} invoice={invoice} /> }
    </Fragment>
  );
};

export default Invoice;
