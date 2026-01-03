'use client';

import React, { useMemo, useState } from 'react';
import { Table } from '@/components/elements/table/table';
import { Form, Button } from 'react-bootstrap';
import { TiEdit } from 'react-icons/ti';
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
    resources,
    model,
    modelRules,
    handleSave,
    handleChange,
    handleDelete,
    handleReset,
    handleEdit,
    handleFetchAll,
    handleSearchChange
  } = useScheduler(debouncedSearchQuery);
  const [show, setShow] = useState(false);

  console.log("...............resources", resources)

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

  const handleSearch = async () => {
    setErrorMessages({});

    const validationResult = validate(model, modelRules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
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
            <div className="d-flex justify-content-start align-items-center mb-3">
              <div className="row d-flex justify-content-between align-items-center ">
                <div className="col-md-4">
                  <Form.Group controlId="formStartDate">
                    <Form.Label className="text-light">Start Date</Form.Label>
                    <input
                      type="text"
                      className="form-control w-25"
                      placeholder="Search title, status, user ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Form.Group>
                </div>

                <div className="col-md-4 ms-6">
                  <Form.Group controlId="formLastName" >
                    <Form.Label className="text-light">.</Form.Label>
                    <Form.Select
                      className="border-dark"
                      aria-label="Select Engineer"
                      value={model?.user}
                      onChange={(e) => handleSearchChange('user', e.target.value)}
                    >
                      <option>Select Engineer</option>
                      {
                        resources.map((user, index) => (
                          <option key={index} value={user.id}>{user.name}</option>
                        ))
                      }

                    </Form.Select>
                    {errorMessages?.status?.message && (
                      <span className="text-danger fs-13">{errorMessages?.status?.message}</span>
                    )}
                  </Form.Group>
                </div>
              </div>

              <div className="row ms-2 ">
                <div className="col-md-5">
                  <Form.Group controlId="formStartDate">
                    <Form.Label className="text-dark">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={model?.startDate}
                      onChange={(e) => handleSearchChange('startDate', e.target.value)}
                      className="border-dark"
                    />
                  </Form.Group>
                  {errorMessages?.startDate?.message && (
                    <span className="text-danger fs-13">{errorMessages?.startDate?.message}</span>
                  )}
                </div>
                <div className="col-md-5">
                  <Form.Group controlId="formEndDate">
                    <Form.Label className="text-dark">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={model?.endDate}
                      onChange={(e) => handleSearchChange('endDate', e.target.value)}
                      className="border-dark"
                    />
                  </Form.Group>
                  {errorMessages?.endDate?.message && (
                    <span className="text-danger fs-13">{errorMessages?.endDate?.message}</span>
                  )}
                </div>
                <div className="col-md-2">
                  <Button
                    type="submit"
                    size="sm"
                    onClick={() => {
                      handleSearch()
                    }}
                    className='mt-8'
                  >
                    Filter
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              onClick={() => {
                setShow(true)
              }}
              className='mt-8'
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
