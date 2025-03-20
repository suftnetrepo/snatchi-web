'use client';

import React, { useState } from 'react';
import { Offcanvas, Form, Table } from 'react-bootstrap';
import { formatCurrency, formatReadableDate } from '../../../../utils/helpers';

const RenderInvoiceOffcanvas = ({ show, handleClose, invoice, handleEditInvoice }) => {
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
      <Offcanvas.Header closeButton>
      
      </Offcanvas.Header>
      <Offcanvas.Body>
        <div>
        <Offcanvas.Title>
          Invoice - {invoice?._id?.toString().slice(-8) || ''} <br />{' '}
          <span
            className={`badge rounded-pill me-2 py-2 px-3 text-white fw-normal fs-12 text-uppercase ${getStatusBadgeClass()}`}
          >
            {status}
          </span>
        </Offcanvas.Title>
        </div>
        <Form.Label htmlFor="issueDate" className="">
          Issue Date
        </Form.Label>
        <Form.Control
          className="text-dark"
          readOnly
          value={formatReadableDate(invoice.issueDate)}
          id="inputPassword5"
          aria-describedby="passwordHelpBlock"
        />

        <div className="table-responsive mt-4">
          <Table striped bordered hover>
            <thead className="thead-light">
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th className="text-end">Hour</th>
                <th className="text-end">Rate</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item._id}>
                  <td className="text-dark">{item.date}</td>
                  <td className="text-dark">{item.description}</td>
                  <td className="text-end text-dark">{item.hour}</td>
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

        <Form.Label htmlFor="issueDate">Note</Form.Label>
        <Form.Control value={invoice.notes} id="inputPassword5" aria-describedby="passwordHelpBlock" />
        <div className="d-flex justify-content-md-start gap-2 mt-3">
          <select
            className="form-select w-auto"
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
              handleEditInvoice && handleEditInvoice({ status: status }, invoice._id).then(() => {});
            }}
          >
            SaveChanges
          </button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export { RenderInvoiceOffcanvas };
