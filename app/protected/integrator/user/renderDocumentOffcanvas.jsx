'use client';

import React from 'react';
import { Offcanvas, ListGroup, Alert } from 'react-bootstrap';
import { useUserDocument } from '../../../../hooks/useUserDocument';
import { MdEditDocument } from 'react-icons/md';
import { FaChevronCircleRight } from 'react-icons/fa';
import { IoChevronForwardCircleOutline } from 'react-icons/io5';

import Tooltip from '@mui/material/Tooltip';

const RenderDocumentOffcanvas = ({ show, handleClose, userId }) => {
  const { data, error } = useUserDocument(userId);
  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title></Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {error && (
          <div className="row">
            <div className="col-md-12">
              <Alert variant={'danger'}>{error}</Alert>
            </div>
          </div>
        )}

        <div>
          <div className="mt-1">
            <div className="ms-1 mb-4">
              <h4>Documents({data.length}) </h4>
            </div>
            <ListGroup>
              {data?.map((document, index) => {
                return (
                  <ListGroup.Item
                    key={`${index}-${document._id}`}
                    as="li"
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex flex-column justify-content-start align-items-start ">
                      <div className="fw-bold">
                      {document.name}
                      </div>
                      <div className="fw-normal">{document.description}</div>
                    </div>

                    <Tooltip title="View document" arrow>
                      <a href={document.secure_url} target="_blank" rel="noopener noreferrer">
                        <IoChevronForwardCircleOutline size={48} className="pointer" />
                      </a>
                    </Tooltip>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </div>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default RenderDocumentOffcanvas;
