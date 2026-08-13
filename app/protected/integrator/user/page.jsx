'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Table } from '../../../../src/components/elements/table/table';
import { Button } from 'react-bootstrap';
import { FaDatabase } from 'react-icons/fa';
import { useUser } from '../../../../hooks/useUser';
import Badge from 'react-bootstrap/Badge';
import { MdDelete } from 'react-icons/md';
import { TiEdit, TiDocument } from 'react-icons/ti';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import RenderUserOffcanvas from './renderUserOffcanvas';
import RenderDocumentOffcanvas from './renderDocumentOffcanvas';
import Tooltip from '@mui/material/Tooltip';
import { userValidator } from '../rules';
import StyledImage from '@/components/reuseable/StyledImage';
import { setPageHelpContext } from '../help/guides';

const capitalizeValue = (value) => {
  const text = String(value || '').trim();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}` : '—';
};

const User = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [show, setShow] = useState(false);
  const [showUserDocument, setShowUserDocument] = useState(false);
  const [fields, setFields] = useState(userValidator.fields);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const {
    data,
    error,
    editData,
    loading,
    totalCount,
    handleFetchUsers,
    handleDeleteUser,
    handleEdit,
    handleEditUser,
    handleSaveUser,
    handleReset,
    success
  } = useUser(debouncedSearchQuery, false);

  const handleClose = useCallback(() => {
    handleReset();
    setShow(false);
    setFields(userValidator.reset());
  }, [handleReset]);
  const handleShow = useCallback(() => {
    setPageHelpContext('engineers');
    handleReset();
    setShow(true);
    setFields(userValidator.reset());
  }, [handleReset]);

  const handleCloseUserDocument = () => {
    setShowUserDocument(false);
  };

  const seedEngineers = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedError('');
    try {
      const response = await fetch('/api/user/seed', { method: 'POST', credentials: 'include' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to seed engineers');
      setSearchQuery('');
      await handleFetchUsers({ pageIndex: 0, pageSize: 10, sortBy: [], searchQuery: '' });
    } catch (seedRequestError) {
      setSeedError(seedRequestError.message || 'Unable to seed engineers');
    } finally {
      setSeeding(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Avatar',
        accessor: '',
        headerClassName: 'text-center actions-header',
        className: 'text-center actions-cell',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-start align-items-center">
            <StyledImage url={row?.original?.secure_url} height="45" width="45" roundedCircle />
          </div>
        )
      },
      { Header: 'Firstname', accessor: 'first_name', sortType: 'basic' },
      { Header: 'Lastname', accessor: 'last_name', sortType: 'basic' },
      { Header: 'Mobile', accessor: 'mobile', sortType: 'basic' },
      { Header: 'Email', accessor: 'email' },
      { Header: 'Role', accessor: 'role', Cell: ({ value }) => capitalizeValue(value) },
      { Header: 'Visibility', accessor: 'visible', Cell: ({ value }) => capitalizeValue(value) },
      {
        Header: 'Chat Status',
        accessor: 'chat_status',
        headerClassName: 'text-center actions-header',
        className: 'text-center actions-cell',
        Cell: ({ value }) => (
          <div className="d-flex justify-content-center align-items-center">
            {value ? (
              <Badge bg="success" className="p-2">
                Yes
              </Badge>
            ) : (
              <Badge bg="danger" className="p-2">
                No
              </Badge>
            )}
          </div>
        )
      },
      {
        Header: 'Status',
        accessor: 'user_status',
        headerClassName: 'text-center actions-header',
        className: 'text-center actions-cell',
        Cell: ({ value }) => (
          <div className="d-flex justify-content-center align-items-center">
            {value ? (
              <Badge bg="success" className="p-2">
                Yes
              </Badge>
            ) : (
              <Badge bg="danger" className="p-2">
                No
              </Badge>
            )}
          </div>
        )
      },
      {
        Header: 'Actions',
        disableSortBy: true,
        headerClassName: 'text-center actions-header',
        className: 'text-center actions-cell',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center align-items-center">
            <Tooltip title="Edit User" arrow>
              <span className="p-0">
                <TiEdit
                  size={30}
                  className="pointer"
                  onClick={() => {
                    handleShow();
                    handleEdit(row.original);
                  }}
                />
              </span>
            </Tooltip>
            <Tooltip title="Delete User" arrow>
              <span className="p-0">
                <DeleteConfirmation
                  onConfirm={async (id) => {
                    handleDeleteUser(id);
                  }}
                  onCancel={() => {}}
                  itemId={row.original._id}
                >
                  <MdDelete size={30} className="pointer" />
                </DeleteConfirmation>
              </span>
            </Tooltip>
            <Tooltip title="View user documents" arrow>
              <span className="p-0">
                <TiDocument
                  size={30}
                  className="pointer"
                  onClick={() => {
                    setPageHelpContext('documents');
                    setShowUserDocument(true);
                    setUserId(row.original._id);
                  }}
                />
              </span>
            </Tooltip>
          </div>
        )
      }
    ],
    [handleDeleteUser, handleEdit, handleShow]
  );

  return (
    <>
      <div className={`ms-5 me-5 mt-2 ${loading ? 'overlay__block' : ''}`}>
        <div className="card-body">
          <h5 className="card-title ms-2 mb-2">Users</h5>
          <div className="d-flex justify-content-between align-items-center mb-3">
            {/* Search Box */}
            <input
              type="text"
              className="form-control w-25"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="d-flex align-items-center gap-2">
              {process.env.NODE_ENV === 'development' && (
                <Button type="button" size="sm" variant="outline-secondary" onClick={seedEngineers} disabled={seeding}>
                  <FaDatabase className="me-1" /> {seeding ? 'Seeding…' : 'Seed 5 engineers'}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  handleShow();
                }}
              >
                + Add User
              </Button>
            </div>
          </div>
          {seedError && (
            <div className="alert alert-danger py-2" role="alert">
              {seedError}
            </div>
          )}
          <Table
            data={data}
            columns={columns}
            pageCount={totalCount}
            loading={loading}
            fetchData={handleFetchUsers}
            searchQuery={debouncedSearchQuery}
          />
        </div>
      </div>
      {loading && <span className="overlay__block" />}
      {error && <ErrorDialogue showError={error} onClose={handleReset} />}
      <RenderUserOffcanvas
        handleClose={handleClose}
        show={show}
        success={success}
        userData={editData}
        fields={fields}
        setFields={setFields}
        handleEditUser={handleEditUser}
        handleSaveUser={handleSaveUser}
        userValidator={userValidator}
        loading={loading}
      />
      <RenderDocumentOffcanvas handleClose={handleCloseUserDocument} show={showUserDocument} userId={userId} />
    </>
  );
};

export default User;
