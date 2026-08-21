'use client';

import React, { useMemo, useState } from 'react';
import { Table } from '../../../../src/components/elements/table/table';
import { useAdmin } from '../../../../hooks/useAdmin';
import { TiEye, TiUser } from 'react-icons/ti';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import { dateFormatted } from '../../../../utils/helpers';
import RenderIntegratorOffcanvas from '../renderIntegratorOffcanvas';
import RenderIntegratorUserOffcanvas from '../renderIntegratorUserOffcanvas';

const Integrator = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [show, setShow] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, error, loading, totalCount, handleFetchIntegrators, handleReset, handleSelect, handleFetchUserById,handleUpdateUser, userData, viewData } =
    useAdmin(debouncedSearchQuery);

  const handleClose = () => {
    handleReset();
    setShow(false);
  };
  const handleShow = () => {
    setShow(true);
  };
  const handleCloseUsers = () => {
    handleReset();
    setShowUsers(false);
  };
  const handleShowUsers = () => {
    setShowUsers(true);
  };
 
  const getStatusColorCode = (status) => {
    const colors = {
      canceled: 'bg-danger',
      unpaid: 'bg-warning',
      inactive: 'bg-info',
      active: 'bg-primary',
      past_due: 'bg-secondary'
    };
    return colors[status] || 'bg-secondary';
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        Cell: ({ row }) => (
          <div className="d-flex align-items-center">
            <img
              src={row.original.secure_url || '/img/blank.png'}
              alt={row.original.name}
              className="rounded-circle me-2"
              width="40"
              height="40"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "/img/blank.png"; 
              }}
            />
            <span>{row.original.name}</span>
          </div>
        )
      },
      {
        Header: 'Date',
        accessor: 'createdAt',
        Cell: ({ value }) => <div className="d-flex align-items-center">{dateFormatted(value)}</div>
      },
      { Header: 'Mobile', accessor: 'mobile', sortType: 'basic' },
      { Header: 'Email', accessor: 'email' },
      { Header: 'Plan', accessor: 'plan' },
      {
        Header: 'Status',
        accessor: 'status',
        headerClassName: { textAlign: 'center' },
        Cell: ({ value }) => (
          <div className="d-flex justify-content-center align-items-center">
            <span className={`badge ${getStatusColorCode(value)}`}>{value}</span>
          </div>
        )
      },
      {
        Header: 'Actions',
        disableSortBy: true,
        headerClassName: 'text-center',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center align-items-center">
            <TiEye
              size={30}
              className="pointer me-2"
              onClick={() => {
                handleShow();
                handleSelect(row.original);
              }}
            />
            <TiUser
              size={30}
              className="pointer me-2"
              onClick={async () => {
                handleShowUsers()
                await handleFetchUserById(row.original?._id)
              }}
            />
          </div>
        )
      }
    ],
    []
  );

  return (
    <>
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
        <div className="card-body">
          <div className="mb-4">
            <div className="text-uppercase small fw-bold text-primary mb-1">Customer operations</div>
            <h1 className="h3 mb-1">Organisations</h1>
            <p className="text-muted mb-0">Monitor subscriptions and inspect the teams using Snatchi.</p>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            {/* Search Box */}
            <input
              type="text"
              className="form-control"
              style={{ maxWidth: 420 }}
              aria-label="Search organisations"
              placeholder="Search by name, email, mobile or plan"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Table
            data={data}
            columns={columns}
            pageCount={totalCount}
            loading={loading}
            fetchData={handleFetchIntegrators}
          />
        </div>
      </div>
      {loading && <span className="overlay__block" aria-label="Loading organisations" />}
      {error && <ErrorDialogue showError={error} onClose={() => {}} />}
      <RenderIntegratorOffcanvas handleClose={handleClose} show={show} data={viewData} />
      <RenderIntegratorUserOffcanvas handleClose={handleCloseUsers} show={showUsers} data={userData} handleUpdateUser={handleUpdateUser} />
    </>
  );
};

export default Integrator;
