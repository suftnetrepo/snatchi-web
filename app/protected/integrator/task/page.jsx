'use client';

import React, { useMemo, useState, Suspense } from 'react';
import { Table } from '@/components/elements/table/table';
import { Button } from 'react-bootstrap';
import { useTask } from '../../../../hooks/useTask';
import { MdArrowBack } from 'react-icons/md';
import { TiEdit, TiDocument, TiUser } from 'react-icons/ti';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import { dateFormatted } from '../../../../utils/helpers';
import { useRouter, useSearchParams } from 'next/navigation';
import { RenderTeamOffcanvas } from './renderTeamOffcanvas';
import Tooltip from '@mui/material/Tooltip';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import dynamic from 'next/dynamic';
import TaskCalendar from './calendar/TaskCalendar';
import { useTaskEdit } from '../../../../hooks/useTask';
import RenderTaskOffcanvas from './renderTaskOffcanvas';

const RenderDocumentOffcanvas = dynamic(() => import('./renderDocumentOffcanvas'), { ssr: true });

const RenderTask = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [searchQuery, setSearchQuery] = useState('');
  const [show, setShow] = useState(false);
  const [showTaskOffcanvas, setShowTaskOffcanvas] = useState(false);
  const [showTeamOffcanvas, setShowTeamOffcanvas] = useState(false);
  const [taskId, setTaskId] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, calenderData, error, deleteSuccess, loading, totalCount, handleDelete, handleFetch } = useTask(
    debouncedSearchQuery,
    projectId
  );
  const { handleSave, fields, handleChange, handleEdit, success, handleReset, handleSelect, taskError } = useTaskEdit(
    null,
    projectId
  );

  const handleClose = () => {
    setShow(false);
  };
  const handleShow = () => {
    setShow(true);
  };

  const handleCloseTeamOffcanvas = () => {
    setShowTeamOffcanvas(false);
  };
  const handleShowTeamOffcanvas = () => {
    setShowTeamOffcanvas(true);
  };

  const getStatusColorCode = (status) => {
    const colors = {
      Canceled: 'bg-danger',
      Progress: 'bg-warning',
      Pending: 'bg-info',
      Completed: 'bg-secondary'
    };
    return colors[status] || 'bg-secondary';
  };

  const getPriorityStatusColorCode = (priority) => {
    const colors = {
      High: 'bg-success',
      Low: 'bg-warning',
      Medium: 'bg-info'
    };
    return colors[priority] || 'bg-secondary';
  };

  const columns = useMemo(
    () => [
      { Header: 'Name', accessor: 'name', sortType: 'basic' },
      {
        Header: 'Priority',
        accessor: 'priority',
        headerClassName: { textAlign: 'center' },
        Cell: ({ value }) => (
          <div className="d-flex justify-content-start align-items-center">
            <span className={`badge ${getPriorityStatusColorCode(value)} transparent`}>{value}</span>
          </div>
        )
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
        Header: 'Start Date',
        accessor: 'startDate',
        Cell: ({ value }) => <div className="d-flex align-items-center">{dateFormatted(value)}</div>
      },
      {
        Header: 'End Date',
        accessor: 'endDate',
        Cell: ({ value }) => <div className="d-flex align-items-center">{dateFormatted(value)}</div>
      },
      {
        Header: 'Actions',
        disableSortBy: true,
        headerClassName: { textAlign: 'center' },
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center align-items-center">
            <Tooltip title="Edit Task" arrow>
              <span className="p-0">
                <TiEdit
                  size={30}
                  className="pointer me-2"
                  onClick={async () => {
                    setShowTaskOffcanvas(true);
                    await handleSelect(row.original._id);
                  }}
                />
              </span>
            </Tooltip>
            <Tooltip title="Task Documents" arrow>
              <span className="p-0">
                <TiDocument
                  size={30}
                  className="pointer ms-2"
                  onClick={() => {
                    handleShow();
                    setTaskId(row.original._id);
                  }}
                />
              </span>
            </Tooltip>
            <Tooltip title="Task Team" arrow>
              <span className="p-0">
                <TiUser
                  size={30}
                  className="pointer ms-2"
                  onClick={() => {
                    setTaskId(row.original._id);
                    handleShowTeamOffcanvas();
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
    <div className="ms-5 me-5 ">
      <div className="d-flex justify-content-start align-items-center mb-3">
        <Button variant="outline-secondary" onClick={() => router.push(`/protected/integrator/project`)}>
          <MdArrowBack size={24} /> Back
        </Button>
        <h3 className="card-title ms-2">Tasks</h3>
      </div>
      <Tabs key={success || deleteSuccess} defaultActiveKey="table" id="uncontrolled-tab-example" className="mb-3">
        <Tab eventKey="table" title="Table">
          <>
            <div className={`ms-1 me-1 mt-2 ${!loading ? 'overlay__block' : null}`}>
              <div className="card-body">
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
                    onClick={async () => {
                      setShowTaskOffcanvas(true);
                      handleReset();
                    }}
                  >
                    + Add Task
                  </Button>
                </div>
                <Table data={data} columns={columns} pageCount={totalCount} loading={loading} fetchData={handleFetch} />
              </div>
            </div>
            {!loading && <span className="overlay__block" />}
            {error && <ErrorDialogue showError={error} onClose={() => {}} />}
            <RenderDocumentOffcanvas show={show} handleClose={handleClose} projectId={projectId} taskId={taskId} />
            <RenderTeamOffcanvas
              show={showTeamOffcanvas}
              handleClose={handleCloseTeamOffcanvas}
              projectId={projectId}
              taskId={taskId}
            />
          </>
        </Tab>
        <Tab eventKey="calender" title="Calender">
          <TaskCalendar setShow={setShowTaskOffcanvas} data={calenderData} handleSelect={handleSelect} />
        </Tab>
      </Tabs>
      <RenderTaskOffcanvas
        fields={fields}
        handleChange={handleChange}
        handleSave={handleSave}
        handleEdit={handleEdit}
        handleReset={handleReset}
        handleDelete={handleDelete}
        show={showTaskOffcanvas}
        success={success}
        error={taskError}
        setShow={setShowTaskOffcanvas}
        projectId={projectId}
      />
    </div>
  );
};

export default function Task() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RenderTask />
    </Suspense>
  );
}
