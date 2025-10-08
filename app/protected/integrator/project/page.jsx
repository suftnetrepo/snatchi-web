'use client';

import React, { useMemo, useState } from 'react';
import { Table } from '@/components/elements/table/table';
import { Button } from 'react-bootstrap';
import { useProject } from '../../../../hooks/useProject';
import { MdDelete } from 'react-icons/md';
import { TiEdit, TiDocument, TiUser } from 'react-icons/ti';
import { FaTasks } from 'react-icons/fa';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import { dateFormatted } from '../../../../utils/helpers';
import { useRouter } from 'next/navigation';
import { RenderTeamOffcanvas } from './renderTeamOffcanvas';
import Tooltip from '@mui/material/Tooltip';
import dynamic from 'next/dynamic';
const RenderDocumentOffcanvas = dynamic(() => import('./renderDocumentOffcanvas'), { ssr: false });

const Project = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [show, setShow] = useState(false);
  const [showTeamOffcanvas, setShowTeamOffcanvas] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [project, setProject] = useState({});
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, error, loading, totalCount, handleDelete, handleFetch } = useProject(debouncedSearchQuery);

  console.log('project', project);

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
                    router.push(`/protected/integrator/project/${row.original._id}/edit`);
                  }}
                />
              </span>
            </Tooltip>

            <Tooltip title="Delete Project" arrow>
              <span className="p-0">
                <DeleteConfirmation
                  onConfirm={async (id) => {
                    handleDelete(id);
                  }}
                  onCancel={() => {}}
                  itemId={row.original._id}
                >
                  <MdDelete size={30} className="pointer" />
                </DeleteConfirmation>
              </span>
            </Tooltip>

            <Tooltip title="Add Tasks to project" arrow>
              <span className="p-0">
                <FaTasks
                  size={30}
                  className="pointer ms-2"
                  onClick={() => {
                          setProject(prev => ({ ...prev, projectId: row.original._id }));
                    router.push(`/protected/integrator/task?projectId=${row.original._id}`);
                  }}
                />
              </span>
            </Tooltip>

            <Tooltip title="Add Documents to project" arrow>
              <span className="p-0">
                <TiDocument
                  size={30}
                  className="pointer ms-2"
                  onClick={() => {
             setProject(prev => ({ ...prev, projectId: row.original._id }));
                    handleShow();
                  }}
                />
              </span>
            </Tooltip>

            <Tooltip title="Add Team to project" arrow>
              <span className="p-0">
                <TiUser
                  size={35}
                  className="pointer ms-2"
                  onClick={() => {
                    setProject(prev => ({ ...prev, original:row.original, projectId: row.original._id }));
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
    <>
      <div className={`ms-5 me-5 mt-2 ${!loading ? 'overlay__block' : null}`}>
        <div className="card-body">
          <h3 className="card-title ms-2 mb-2">Projects</h3>
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
                router.push('/protected/integrator/project/create');
              }}
            >
              + Add Project
            </Button>
          </div>
          <Table data={data} columns={columns} pageCount={totalCount} loading={loading} fetchData={handleFetch} />
        </div>
      </div>
      {!loading && <span className="overlay__block" />}
      {error && <ErrorDialogue showError={error} onClose={() => {}} />}
      <RenderDocumentOffcanvas show={show} handleClose={handleClose} id={project.projectId} />
      <RenderTeamOffcanvas project={project.original} show={showTeamOffcanvas} handleClose={handleCloseTeamOffcanvas} id={project.projectId} />
    </>
  );
};

export default Project;
