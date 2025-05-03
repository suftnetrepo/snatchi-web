'use client';

import React, { useMemo, useState } from 'react';
import { Table } from '../../../../src/components/elements/table/table';
import { Button } from 'react-bootstrap';
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
import { useUserChat } from '@/hooks/useUserChat';


const User = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [show, setShow] = useState(false);
  const [showUserDocument, setShowUserDocument] = useState(false);
  const [fields, setFields] = useState(userValidator.fields);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { handleSignUp } = useUserChat()
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
  } = useUser(debouncedSearchQuery);

  const handleClose = () => {
    handleReset();
    setShow(false);
    setFields(userValidator.reset())
  };
  const handleShow = () => {
    handleReset();
    setShow(true);
    setFields(userValidator.reset())
  };

  const handleCloseUserDocument = () => {
    setShowUserDocument(false);
  };

  const columns = useMemo(
    () => [
      { Header: 'Firstname', accessor: 'first_name', sortType: 'basic' },
      { Header: 'Lastname', accessor: 'last_name', sortType: 'basic' },
      { Header: 'Mobile', accessor: 'mobile', sortType: 'basic' },
      { Header: 'Email', accessor: 'email' },
      { Header: 'Role', accessor: 'role' },
      { Header: 'Visibility', accessor: 'visible' },
      {
        Header: 'Chat Status',
        accessor: 'chat_status',
        Cell: ({ value }) => (
          <div className="d-flex justify-content-start align-items-center">
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
        Cell: ({ value }) => (
          <div className="d-flex justify-content-start align-items-center">
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
        className: 'center',
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
                  onCancel={() => { }}
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
    []
  );

  return (
    <>
      <div className={`ms-5 me-5 mt-2 ${!loading ? 'overlay__block' : null}`}>
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
            <Button
              type="submit"
              size="sm"
              onClick={() => {
                handleShow();
              }}
            >
              + Add User
            </Button>
          </div>
          <Table data={data} columns={columns} pageCount={totalCount} loading={loading} fetchData={handleFetchUsers} />
        </div>
      </div>
      {!loading && <span className="overlay__block" />}
      {error && <ErrorDialogue showError={error} onClose={() => { }} />}
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
        handleSignUp={handleSignUp}
      />
       <RenderDocumentOffcanvas
        handleClose={handleCloseUserDocument}
        show={showUserDocument}
        userId={userId}
      />
    </>
  );
};

export default User;
