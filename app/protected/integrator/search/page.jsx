'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Table } from '../../../../src/components/elements/table/table';
import { useSearchIntegrator } from '../../../../hooks/useAdmin';
import { TiEye } from 'react-icons/ti';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import RenderIntegratorOffcanvas from './renderIntegratorOffcanvas';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

const Search = () => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [show, setShow] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, error, loading, totalCount, handleFetchIntegrators, handleReset, handleSelect, viewData } =
  useSearchIntegrator(debouncedSearchQuery);
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  useEffect(() => {
    query && setSearchQuery(query);
  }, [query]);

  const handleClose = () => {
    handleReset();
    setShow(false);
  };
  const handleShow = () => {
    setShow(true);
  };

  const Avatar = ({ src, alt }) => {
    const [imgSrc, setImgSrc] = useState(src || '/img/blank.png');
  
    return (
      <Image
        src={imgSrc}
        alt={alt}
        width={40}
        height={40}
        roundedCircle
        className="me-2"
        onError={() => setImgSrc('/img/blank.png')}
      />
    );
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        Cell: ({ row }) => (
          <div className="d-flex align-items-center">
            {/* <img
              src={row.original.logo_url}
              alt={row.original.name}
              className="rounded-circle me-2"
              width="40"
              height="40"
              onError={(e) => {
                e.currentTarget.src = '/img/blank.png';
              }}
            /> */}
            <span>{row.original.name}</span>
          </div>
        )
      },
      { Header: 'Mobile', accessor: 'mobile', sortType: 'basic' },
      { Header: 'Email', accessor: 'email' },
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
          <h5 className="card-title ms-2 mb-2">Search Integrators</h5>
          <div className="d-flex justify-content-between align-items-center mb-3">
            {/* Search Box */}
            <input
              type="text"
              className="form-control w-25"
              placeholder="Search..."
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
      {!loading && <span className="overlay__block" />}
      {error && <ErrorDialogue showError={error} onClose={() => {}} />}
      <RenderIntegratorOffcanvas handleClose={handleClose} session={session} show={show} data={viewData} />
    </>
  );
};

export default Search;
