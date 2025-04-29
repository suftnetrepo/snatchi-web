'use client';

import React, { useState } from 'react';
import { Offcanvas, Button, ListGroup, Form, Spinner, Alert } from 'react-bootstrap';
import { validate } from '../../../../validator/validator';
import { useDocument } from '../../../../hooks/useDocument';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import { MdDelete } from 'react-icons/md';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faFileWord, faImage } from '@fortawesome/free-solid-svg-icons';
import Tooltip from '@mui/material/Tooltip';
import { MdCancel } from 'react-icons/md';

const RenderDocumentOffcanvas = ({ show, handleClose, id }) => {
  const { data, error, loading, rules, fields, handleChange, handleUpload, handleDelete, handleReset } =
    useDocument(id);
  const [errorMessages, setErrorMessages] = useState({});
  const [file, setFile] = useState(null);

  const getIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return faFilePdf;
      case 'word':
        return faFileWord;
      case 'image':
        return faImage;
      default:
        return faFilePdf;
    }
  };

  const getIconColor = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return '#ff6699';
      case 'word':
        return '#1a8cff';
      case 'image':
        return '#00b3b3';
      default:
        return faFilePdf;
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const onsubmit = async () => {
    setErrorMessages({});
    const validationResult = validate(fields, rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', fields.document_type);
    formData.append('document_name', fields.document_name);
    formData.append('id', id);

    const reset = () => {
      handleReset();
      setFile(null);
    };

    handleUpload(formData).then((result) => {
      result && reset();
    });
  };

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          <p className="text-dark fw-bold fs-18"> Documents</p>
        </div>
        <div>
          <MdCancel size={48} color="black" onClick={handleClose} className="pointer" />
        </div>
      </div>
      <Offcanvas.Body>
        {error && (
          <div className="row">
            <div className="col-md-12">
              <Alert variant={'danger'}>{error}</Alert>
            </div>
          </div>
        )}
        <Form>
          <div className="row">
            <div className="col-md-12">
              <Form.Group controlId="formName" className="mb-1">
                <Form.Label className="text-dark">Document Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter document name"
                  name="name"
                  value={fields?.document_name}
                  onChange={(e) => handleChange('document_name', e.target.value)}
                  className="border-dark"
                />
                {errorMessages?.document_name?.message && (
                  <span className="text-danger fs-13 ms-1">{errorMessages?.document_name?.message}</span>
                )}
              </Form.Group>
            </div>
            <div className="col-md-12">
              <Form.Group controlId="formLastName" className="mb-3">
                <Form.Label className="text-dark">Document Type</Form.Label>
                <Form.Select
                  className="border-dark"
                  aria-label="Select Status"
                  value={fields?.document_type}
                  onChange={(e) => handleChange('document_type', e.target.value)}
                >
                  <option>Select Document Type</option>
                  <option value="Pdf">Pdf</option>
                  <option value="Word">Word</option>
                  <option value="Image">Image</option>
                </Form.Select>
                {errorMessages?.document_type?.message && (
                  <span className="text-danger fs-13 ms-1">{errorMessages?.document_type?.message}</span>
                )}
              </Form.Group>
            </div>
            <div className="col-md-12">
              <div className="d-flex justify-content-start align-items-center mb-2">
                <Tooltip title="Select document to upload" arrow>
                  <span className="p-0">
                    <Form.Group controlId="formFileLg" className="mb-3">
                      {/* <Form.Label> Select File</Form.Label> */}
                      <Form.Control
                        type="file"
                        size="lg"
                        id="file-input"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </Form.Group>
                  </span>
                </Tooltip>

                {loading ? (
                  <Form.Group controlId="formFileLg" className="mb-3 ms-2">
                    {/* <Form.Label> </Form.Label> */}
                    <Button variant="secondary">
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="visually-hidden">uploading...</span>
                    </Button>
                  </Form.Group>
                ) : (
                  <Tooltip title="Upload document" arrow>
                    <span className="p-0 ps-2">
                      <Form.Group controlId="formFileLg" className="mb-3 ms-2">
                        {/* <Form.Label> Upload File</Form.Label> */}
                        <Button variant={!file ? 'secondary' : 'success'} onClick={() => onsubmit()} disabled={!file}>
                          Upload
                        </Button>
                      </Form.Group>
                    </span>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
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
                      <div className="d-flex justify-content-start align-items-center me-auto">
                        <FontAwesomeIcon
                          icon={getIcon(document.document_type)}
                          style={{ color: getIconColor(document.document_type), fontSize: '20px' }}
                        ></FontAwesomeIcon>
                        <div className="fw-normal ms-1">
                          {' '}
                          <a href={document.secure_url} target="_blank" rel="noopener noreferrer">
                            {document.document_name}
                          </a>
                        </div>
                      </div>

                      <Tooltip title="Delete document" arrow>
                        <span className="p-0">
                          <DeleteConfirmation
                            onConfirm={async () => {
                              handleDelete(document._id);
                            }}
                            onCancel={() => {}}
                            itemId={document._id}
                          >
                            <MdDelete size={30} className="pointer" />
                          </DeleteConfirmation>
                        </span>
                      </Tooltip>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </div>
          </div>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default RenderDocumentOffcanvas;
