'use client';

import React, { Fragment, useMemo, useState } from 'react';
import { Table } from '@/components/elements/table/table';
import { useAttendance } from '../../../../hooks/useAttendance';
import { FaEye } from 'react-icons/fa';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import { dateFormatted, getHourAndMinutes } from '../../../../utils/helpers';
import Tooltip from '@mui/material/Tooltip';

const Attendance = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, error, loading, totalCount, handleFetch } = useAttendance(debouncedSearchQuery);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'chechin':
        return 'bg-success';
      case 'checkout':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Date',
        accessor: 'date',
        Cell: ({ value }) => <div className="d-flex align-items-center">{dateFormatted(value)}</div>
      },
      {
        Header: 'Time',
        Cell: ({ row }) => <div className="d-flex align-items-center">{getHourAndMinutes(row.original.date)}</div>
      },
      { Header: 'Firstname', accessor: 'first_name', sortType: 'basic' },
      { Header: 'Lastname', accessor: 'last_name', sortType: 'basic' },
      { Header: 'Location', accessor: 'completeAddress', sortType: 'basic' },
      {
        Header: 'Status',
        accessor: 'status',
        headerClassName: { textAlign: 'center' },
        Cell: ({ value }) => (
          <div className="d-flex justify-content-start align-items-center">
            <span className={`badge ${getStatusBadgeClass(value)}`}>{value}</span>
          </div>
        )
      }
    ],
    []
  );

  return (
    <Fragment>
      <div className={`ms-5 me-5 mt-2 ${!loading ? 'overlay__block' : null}`}>
        <div className="card-body">
          <h3 className="card-title ms-2 mb-2">Attendance</h3>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <input
              type="text"
              className="form-control w-25"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
         <Table data={data} columns={columns} pageCount={totalCount} loading={loading} fetchData={handleFetch} /> 
        </div>
      </div>
      {!loading && <span className="overlay__block" />}
      {error && <ErrorDialogue showError={error} onClose={() => {}} />}
    </Fragment>
  );
};

export default Attendance;
