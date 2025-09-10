'use client';

import React, { useState } from 'react';
import { Offcanvas, Form, Table } from 'react-bootstrap';
import { formatCurrency, formatReadableDate } from '../../../../utils/helpers';
import { OkDialogue } from '../../../../src/components/elements/ConfirmDialogue';
import { MdCancel } from 'react-icons/md';

const RenderInvoiceOffcanvas = ({ show, success, handleClose, invoice, handleEditInvoice }) => {
  const [status, setStatus] = useState(invoice?.status);

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const getStatusBadgeClass = () => {
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

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          <p className="text-dark fw-normal fs-18">
            Invoice - <strong>{invoice?._id?.toString().slice(-8) || ''}</strong>{' '}
          </p>
          <span
            className={`badge rounded-pill me-2 px-3 text-white fw-normal fs-12 text-uppercase ${getStatusBadgeClass()}`}
          >
            {status}
          </span>
        </div>
        <div>
          <MdCancel size={48} color="black" onClick={handleClose} className="pointer" />
        </div>
      </div>
      <Offcanvas.Body>
        <Form.Label htmlFor="invoice_description" className="text-dark">
          Description
        </Form.Label>
        <Form.Control
          className="text-dark "
          readOnly
          value={invoice.invoice_description}
          id="invoice_description"
          aria-describedby="invoice_description"
        />
        <Form.Label htmlFor="issueDate" className="text-dark mt-2">
          Issue Date
        </Form.Label>
        <Form.Control
          className="text-dark "
          readOnly
          value={formatReadableDate(invoice.issueDate)}
          id="issueDate"
          aria-describedby="issueDate"
        />

        <div className="table-responsive mt-4">
          <Table striped bordered hover>
            <thead className="thead-light">
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Unit</th>
                <th className="text-end">Time</th>
                <th className="text-end">Rate</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item._id}>
                  <td className="text-dark">{item.date}</td>
                  <td className="text-dark">{item.description}</td>
                  <td className="text-dark">{item.unit}</td>
                  <td className="text-end text-dark">{item.duration}</td>
                  <td className="text-end text-dark">{formatCurrency('£', item.rate || 0)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div className="row p-2">
          <div className="col-md-4"></div>
          <div className="col-md-4"></div>
          <div className="col-md-4">
            <div className="d-flex justify-content-between">
              <span className="text-dark">Subtotal</span>
              <span className="fw-bold text-dark">{formatCurrency('£', invoice.subtotal || 0)} </span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-dark">Tax</span>
              <span className="fw-bold text-dark">{formatCurrency('£', invoice.tax || 0)} </span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="fw-bold text-dark">Total</span>
              <span className="fw-bold text-dark">{formatCurrency('£', invoice.totalAmount || 0)} </span>
            </div>
          </div>
        </div>

        <Form.Label htmlFor="notes">Note</Form.Label>
        <Form.Control value={invoice.notes} id="notes" aria-describedby="notes" className='border-dark' />
        <div className="row">
          <div className="col-md-4">
            <div className="d-flex flex-column justify-content-md-start gap-2 mt-3">
              <select
                className="form-select w-auto border-dark"
                value={status}
                onChange={handleStatusChange}
                aria-label="Invoice status"
              >
                <option value="Paid">PAID</option>
                <option value="Unpaid">UNPAID</option>
                <option value="Cancelled">CANCELLED</option>
              </select>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleEditInvoice && handleEditInvoice({ status: status }, invoice._id).then(() => { });
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <OkDialogue
          show={success}
          message="Your changes was save successfully"
          onConfirm={() => {
            handleClose();
          }}
        />
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export { RenderInvoiceOffcanvas };
