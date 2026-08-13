'use client';

import { useRef, useState } from 'react';
import { Alert, Button, Form, ListGroup, Offcanvas, Spinner } from 'react-bootstrap';
import { FaFileAlt, FaFileCsv, FaFileImage, FaFilePdf, FaFileWord } from 'react-icons/fa';
import { MdCancel, MdDelete, MdOpenInNew } from 'react-icons/md';
import Tooltip from '@mui/material/Tooltip';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import { useUserDocument } from '../../../../hooks/useUserDocument';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain';

const documentIcon = (document) => {
  if (document.mime_type?.startsWith('image/')) return <FaFileImage color="#00a38f" />;
  if (document.mime_type === 'application/pdf' || document.document_type === 'PDF') return <FaFilePdf color="#e25563" />;
  if (document.document_type === 'Word') return <FaFileWord color="#3478c8" />;
  if (document.document_type === 'Spreadsheet') return <FaFileCsv color="#20895a" />;
  return <FaFileAlt color="#738397" />;
};

const formatFileSize = (bytes) => {
  if (!Number(bytes)) return '';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const RenderDocumentOffcanvas = ({ show, handleClose, userId }) => {
  const { data, error, loading, handleUpload, handleDelete, handleReset } = useUserDocument(userId, show);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setFile(null);
    setFormError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeDrawer = () => {
    resetForm();
    handleReset();
    handleClose();
  };

  const selectFile = (event) => {
    const selected = event.target.files?.[0] || null;
    setFormError('');
    if (selected && selected.size > MAX_FILE_SIZE) {
      event.target.value = '';
      setFile(null);
      setFormError('Files must be 15MB or smaller.');
      return;
    }
    setFile(selected);
    if (selected && !name.trim()) setName(selected.name.replace(/\.[^.]+$/, '').slice(0, 100));
  };

  const uploadDocument = async () => {
    setFormError('');
    if (!name.trim()) return setFormError('Document name is required.');
    if (name.trim().length > 100) return setFormError('Document name must not exceed 100 characters.');
    if (description.trim().length > 500) return setFormError('Description must not exceed 500 characters.');
    if (!file) return setFormError('Select a document to upload.');

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('file', file);
    if (await handleUpload(formData)) resetForm();
  };

  return (
    <Offcanvas show={show} onHide={closeDrawer} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          <p className="text-dark fw-bold fs-18 mb-0">User Documents</p>
          <small className="text-muted">Upload and manage files for this user.</small>
        </div>
        <MdCancel size={48} color="black" onClick={closeDrawer} className="pointer" aria-label="Close documents" />
      </div>
      <Offcanvas.Body>
        {(error || formError) && <Alert variant="danger" dismissible onClose={() => { handleReset(); setFormError(''); }}>{formError || error}</Alert>}

        <Form>
          <Form.Group className="mb-3" controlId="userDocumentName">
            <Form.Label className="text-dark">Name</Form.Label>
            <Form.Control className="border-dark" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="Enter document name" disabled={loading} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="userDocumentDescription">
            <Form.Label className="text-dark">Description <span className="text-muted">(optional)</span></Form.Label>
            <Form.Control className="border-dark" value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} placeholder="Add a short description" disabled={loading} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="userDocumentFile">
            <Form.Control ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={selectFile} disabled={loading} />
            <Form.Text className="text-muted">Phone images, PDF, Word, Excel, CSV or text files. Maximum 15MB.</Form.Text>
          </Form.Group>
          <div className="d-flex justify-content-end mb-4">
            <Button type="button" variant={file ? 'success' : 'secondary'} onClick={uploadDocument} disabled={loading || !file}>
              {loading ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Working…</> : 'Upload Document'}
            </Button>
          </div>
        </Form>

        <h4>Documents ({data.length})</h4>
        {loading && data.length === 0 && <div className="text-center py-4"><Spinner animation="border" size="sm" /><span className="ms-2 text-muted">Loading documents…</span></div>}
        {!loading && data.length === 0 && <Alert variant="light" className="text-center border">No documents have been added.</Alert>}
        <ListGroup>
          {data.map((document) => (
            <ListGroup.Item key={document._id} as="li" className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center me-auto overflow-hidden">
                <span className="fs-5 me-2">{documentIcon(document)}</span>
                <div className="overflow-hidden">
                  <div className="fw-bold text-truncate">{document.name}</div>
                  {document.description && <div className="fw-normal small text-muted text-truncate">{document.description}</div>}
                  {(document.document_type || document.bytes) && <small className="text-muted">{[document.document_type, formatFileSize(document.bytes)].filter(Boolean).join(' · ')}</small>}
                </div>
              </div>
              <div className="d-flex align-items-center ms-2">
                <Tooltip title="View document" arrow>
                  <a href={document.secure_url} target="_blank" rel="noopener noreferrer" className="p-1" aria-label={`View ${document.name}`}><MdOpenInNew size={25} /></a>
                </Tooltip>
                <Tooltip title="Delete document" arrow>
                  <span className="p-0">
                    <DeleteConfirmation onConfirm={() => handleDelete(document._id)} onCancel={() => {}} itemId={document._id}>
                      <MdDelete size={27} className="pointer" />
                    </DeleteConfirmation>
                  </span>
                </Tooltip>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default RenderDocumentOffcanvas;
