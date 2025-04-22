'use client';

import React from 'react';
import { Offcanvas, ListGroup, Alert } from 'react-bootstrap';
import { useUserDocument } from '../../../../hooks/useUserDocument';
import { MdEditDocument } from 'react-icons/md';
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
            <div>
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
                    <div className="d-flex flex-column justify-content-start align-items-start me-auto">
                      <div className="fw-normal ms-1">{document.description}</div>
                      <div className="fw-normal ms-1">
                        {' '}
                        <a href={document.secure_url} target="_blank" rel="noopener noreferrer">
                          {document.name}
                        </a>
                      </div>
                    </div>

                    <Tooltip title="Delete document" arrow>
                      <MdEditDocument size={30} className="pointer" />
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
