'use client';

import React, { useMemo, useState } from 'react';
import { Table } from '@/components/elements/table/table';
import { Button } from 'react-bootstrap';
import { useUser } from '../../../../hooks/useUser';
import Badge from 'react-bootstrap/Badge';
import { MdDelete } from 'react-icons/md';
import { TiEdit } from 'react-icons/ti';
import { useParams } from 'next/navigation';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import RenderUserOffcanvas from '../renderUserOffcanvas';

const User = () => { 
  const params = useParams()
  const { integratorId } = params;
  const [searchQuery, setSearchQuery] = useState('');
  const [show, setShow] = useState(false);
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
    handleReset
  } = useUser(debouncedSearchQuery, integratorId);

  const handleClose = () => {
    handleReset();
    setShow(false);
  };
  const handleShow = () => {
    handleReset();
    setShow(true);
  };

  const columns = useMemo(
    () => [
      { Header: 'Firstname', accessor: 'first_name', sortType: 'basic' },
      { Header: 'Lastname', accessor: 'last_name', sortType: 'basic' },
      { Header: 'Mobile', accessor: 'mobile', sortType: 'basic' },
      { Header: 'Email', accessor: 'email' },
      { Header: 'Role', accessor: 'role' },
      {
        Header: 'Status',
        accessor: 'user_status',
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
        headerClassName: { textAlign: 'center' },
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center align-items-center">
            <TiEdit
              size={30}
              className="pointer me-2"
              onClick={() => {
                handleShow();
                handleEdit(row.original);
              }}
            />
            <DeleteConfirmation
              onConfirm={async (id) => {
                handleDeleteUser(id);
              }}
              onCancel={() => {}}
              itemId={row.original._id}
            >
              <MdDelete size={30} className="pointer" />
            </DeleteConfirmation>
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
      {error && <ErrorDialogue showError={error} onClose={() => {}} />}
      <RenderUserOffcanvas
        handleClose={handleClose}
        show={show}
        userData={editData}
        handleEditUser={handleEditUser}
        handleSaveUser={handleSaveUser}
      />
    </>
  );
};

export default User;
