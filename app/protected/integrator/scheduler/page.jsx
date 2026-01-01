'use client';

import React, { useMemo, useState } from 'react';
import { Table } from '@/components/elements/table/table';
import { Button } from 'react-bootstrap';
import { MdDelete } from 'react-icons/md';
import { TiEdit } from 'react-icons/ti';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import { dateFormatted, getStatusColorCode } from '../../../../utils/helpers';
import { validate } from '@/validator/validator';
import { useScheduler } from '../../../../hooks/useScheduler';
import { RenderScheduleOffcanvas } from './renderScheduleOffcanvas';
import { chose } from '../../../../utils/utils';
import Tooltip from '@mui/material/Tooltip';

const Scheduler = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [errorMessages, setErrorMessages] = useState({});
  const {
    handleSelectedUpdate,
    data,
    loading,
    error,
    totalCount,
    fields,
    rules,
    success,
    handleSave,
    handleChange,
    handleDelete,
    handleReset,
    handleEdit,
    handleFetchAll
  } = useScheduler(debouncedSearchQuery);
  const [show, setShow] = useState(false);

  console.log("...............data", data)

  const handleClose = () => {
    setShow(false);
    handleReset();
  };

  const handleSubmit = async () => {
    setErrorMessages({});

    const validationResult = validate(fields, rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    const body = chose(fields, ['_id', 'title', 'startDate', 'endDate', 'status', 'user', 'description']);

    if (fields._id) {
      await handleEdit(body, fields._id);
    } else {
      delete body._id;
      await handleSave(body);
    }
  };


  const columns = useMemo(
    () => [
      {
        Header: 'User',
        accessor: 'user',
        Cell: ({ value, row }) => (
          <div className="d-flex align-items-center">
            {value.first_name} {value.last_name}
          </div>
        )
      },
      { Header: 'Title', accessor: 'title', sortType: 'basic' },
      {
        Header: 'Start Date',
        accessor: 'startDate',
        Cell: ({ value, row }) => (
          <div className="d-flex align-items-center">
            {dateFormatted(value)}
          </div>
        )
      },
      {
        Header: 'End Date',
        accessor: 'endDate',
        Cell: ({ value }) => <div className="d-flex align-items-center">{dateFormatted(value)}</div>
      },
      {
        Header: 'Status',
        accessor: 'status',
        headerClassName: { textAlign: 'center' },
        Cell: ({ value }) => (
          <div className="d-flex justify-content-start align-items-center">
            <span className={`badge ${getStatusColorCode(value)}`}>{value}</span>
          </div>
        )
      },

      {
        Header: 'Actions',
        disableSortBy: true,
        headerClassName: { textAlign: 'center' },
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center align-items-center">
            <Tooltip title="Edit Project" arrow>
              <span className="p-0">
                <TiEdit
                  size={30}
                  className="pointer me-2"
                  onClick={() => {
                  handleSelectedUpdate(row.original)
                  setShow(true)
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
          <h3 className="card-title ms-2 mb-2">Schedules</h3>
          <div className="d-flex justify-content-between align-items-center mb-3">
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
               setShow(true)
              }}
            >
              + Add Schedule
            </Button>
          </div>
          <Table data={data} columns={columns} pageCount={totalCount} loading={loading} fetchData={handleFetchAll} />
        </div>
      </div>
      {!loading && <span className="overlay__block" />}
      {error && <ErrorDialogue showError={error} onClose={() => { }} />}
      <RenderScheduleOffcanvas
        error={error}
        fields={fields}
        errorMessages={errorMessages}
        handleChange={handleChange}
        success={success}
        handleSubmit={handleSubmit}
        show={show}
        handleClose={handleClose}
        handleDelete={handleDelete}
      />
    </>
  );
};

export default Scheduler;
