'use client';

import React, { useMemo, useState } from 'react';
import { Table } from '../../../../src/components/elements/table/table';
import { TiEye } from 'react-icons/ti';
import { MdSearch } from 'react-icons/md';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import { useMultiUserSearch } from '../../../../hooks/useUser';
import { Form, Button } from 'react-bootstrap';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [show, setShow] = useState(false);
  const { data, error, loading, totalCount, handleSearchUsersByMultipleCriteria, handleReset } =
    useMultiUserSearch();

    console.log('Search data:', data);
        console.log('Search error:', error);

  const handleClose = () => {
    handleReset();
    setShow(false);
  };
  const handleShow = () => {
    setShow(true);
  };

  const columns = useMemo(
    () => [
      { Header: 'First Name', accessor: 'first_name', sortType: 'basic' },
      { Header: 'Last Name', accessor: 'last_name', sortType: 'basic' },
      {
        Header: 'Location',
        accessor: 'address',
        Cell: ({ value, row }) => (
          <div className="d-flex align-items-center">
            {row.original?.address?.completeAddress || 'N/A'}
          </div>
        )
      },
      {
        Header: 'Actions',
        disableSortBy: true,
        headerClassName: 'text-center',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-start align-items-start">
            <TiEye
              size={30}
              className="pointer me-8"
              onClick={() => {
                // handleShow();
                // handleSelect(row.original);
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
      <div className={`ms-5 me-5 mt-2 ${!loading ? 'overlay__block' : null}`}>
        <div className="card-body">
          <h5 className="card-title ms-2 mb-2">Search Engineers</h5>
          <div className="d-flex justify-content-start align-items-center mb-3">
            {/* Search Box */}
            <input
              type="text"
              className="form-control w-25"
              placeholder="Search..."
              value={searchQuery}
              maxLength={30}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => handleSearchUsersByMultipleCriteria({ searchQuery })}
              className="mt-0 d-flex justify-content-center align-items-center  ms-4"
            >
              <MdSearch
                size={24}
                className="pointer"
              />
            </Button>
          </div>
          <Table
            data={data}
            columns={columns}
            pageCount={totalCount}
            loading={loading}
            fetchData={handleSearchUsersByMultipleCriteria}
          />
        </div>
      </div>
      {!loading && <span className="overlay__block" />}
      {error && <ErrorDialogue message={error } showError={error} onClose={() => handleReset()} />}
      {/* <RenderIntegratorOffcanvas handleClose={handleClose} currentChatId={currentChatUser?.uid} session={session} show={show} data={viewData} /> */}
    </>
  );
};

export default Search;
