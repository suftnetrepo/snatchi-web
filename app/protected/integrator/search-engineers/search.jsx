'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Table } from '../../../../src/components/elements/table/table';
import { TiEye } from 'react-icons/ti';
import { MdSearch } from 'react-icons/md';
import { MdArrowBack } from 'react-icons/md';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import { useMultiUserSearch } from '../../../../hooks/useUser';
import { Button } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';

const Search = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, error, loading, totalCount, handleSearchUsersByMultipleCriteria, handleReset } = useMultiUserSearch();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const previousSearchQuery = searchParams.get('searchQuery');

  useEffect(() => {
    if (previousSearchQuery) {
      setSearchQuery(previousSearchQuery);
      handleSearchUsersByMultipleCriteria({ searchQuery: previousSearchQuery });
    }
  }, [previousSearchQuery]);

  console.log('Search data:', projectId);
  console.log('Search error:', error);

  const columns = useMemo(
    () => [
      { Header: 'First Name', accessor: 'first_name', sortType: 'basic' },
      { Header: 'Last Name', accessor: 'last_name', sortType: 'basic' },
      {
        Header: 'Location',
        accessor: 'address',
        Cell: ({ value, row }) => (
          <div className="d-flex align-items-center">{row.original?.address?.completeAddress || 'N/A'}</div>
        )
      },
      {
        Header: 'Actions',
        disableSortBy: true,
        headerClassName: 'text-center',
        className: 'text-center align-middle',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center align-items-center">
            <TiEye
              size={30}
              className="pointer"
              onClick={() => {
                router.push(
                  `/protected/integrator/scheduler?projectId=${projectId}&userId=${row.original._id}&first_name=${row.original.first_name}&last_name=${row.original.last_name}&searchQuery=${searchQuery}&engineerId=${row.original._id}`
                );
              }}
            />
          </div>
        )
      }
    ],
    [projectId, searchQuery]
  );

  return (
    <>
      <div className={`ms-5 me-5 mt-2 ${!loading ? 'overlay__block' : null}`}>
        <div className="card-body">
          <div className="d-flex justify-content-start align-items-center mb-3">
            <Button
              variant="outline-secondary"
              onClick={() =>
                router.push(`/protected/integrator/project`)
              }
            >
              <MdArrowBack size={24} /> Back
            </Button>
            <h5 className="card-title ms-4">Search Engineers</h5>
          </div>
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
              <MdSearch size={24} className="pointer" />
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
      {error && <ErrorDialogue message={error} showError={error} onClose={() => handleReset()} />}
    </>
  );
};

export default Search;
