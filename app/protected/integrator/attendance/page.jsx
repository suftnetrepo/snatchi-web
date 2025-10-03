'use client';

import React, { Fragment, useMemo, useState, useRef } from 'react';
import { Table } from '@/components/elements/table/table';
import { useAttendance } from '../../../../hooks/useFence';
import { FaCalendar } from 'react-icons/fa';
import { MdCancel } from 'react-icons/md';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import { dateFormatted, getHourAndMinutes } from '../../../../utils/helpers';
import Tooltip from '@mui/material/Tooltip';
import { Form } from 'react-bootstrap';

const Attendance = () => {
  const inputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, error, loading, totalCount, handleFetch } = useAttendance(debouncedSearchQuery, selectedDate);

  const handleIconClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker();
    }
  };

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
          <div className="d-flex justify-content-start align-items-center mb-3 position-relative">
            <input
              type="text"
              className="form-control w-25 me-2"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Tooltip title="Filter attendance by date" arrow>
              <span className="p-0">
                <FaCalendar size={40} onClick={handleIconClick} />
              </span>
            </Tooltip>

            {selectedDate && (
              <div className="d-flex justify-content-start align-items-center position-relative">
                <span className={`text-white bg-success py-1 px-3 	rounded-4`}>{selectedDate}</span>
                <MdCancel
                  color="black"
                  size={32}
                  onClick={() => setSelectedDate('')}
                  style={{ cursor: 'pointer', position: 'absolute', top: -15, right: -10 }}
                />
              </div>
            )}

            <Form.Control
              type="date"
              ref={inputRef}
              style={{
                opacity: 0,
                width: '40px',
                height: '40px',
                position: 'absolute',
                top: '-20',
                left: '480px',
                zIndex: 5,
                cursor: 'pointer'
              }}
              onChange={(e) => setSelectedDate(e.target.value)}
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
