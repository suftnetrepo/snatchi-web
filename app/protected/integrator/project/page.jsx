'use client';

import React, { useMemo, useState } from 'react';
import { Table } from '@/components/elements/table/table';
import { Button } from 'react-bootstrap';
import { useProject } from '../../../../hooks/useProject';
import { useProjectEdit } from '../../../../hooks/useProject';
import { MdDelete } from 'react-icons/md';
import { TiEdit, TiDocument, TiUser } from 'react-icons/ti';
import { FaTasks } from 'react-icons/fa';
import { GiPlantSeed } from 'react-icons/gi';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import useDebounce from '../../../../hooks/useDebounce';
import { dateFormatted, getPriorityStatusColorCode, getStatusColorCode } from '../../../../utils/helpers';
import { useRouter } from 'next/navigation';
import { RenderTeamOffcanvas } from './renderTeamOffcanvas';
import Tooltip from '@mui/material/Tooltip';
import dynamic from 'next/dynamic';
import RenderProjectOffcanvas from '../../..//protected/guest/dashboard/renderProjectOffcanvas';

const IS_DEV = process.env.NODE_ENV === 'development';
const RenderDocumentOffcanvas = dynamic(() => import('./renderDocumentOffcanvas'), { ssr: false });

const SEED_PRIORITIES = ['Low', 'Medium', 'High'];
const SEED_STATUSES = ['Pending', 'Progress', 'Completed'];
const SEED_PPE = ['Hard Hat', 'Gloves', 'Hi-Vis Vest', 'Safety Boots', 'Goggles'];

async function generateSeedProjects(handleSave) {
  const { faker } = await import('@faker-js/faker');

  const results = [];
  for (let i = 0; i < 5; i++) {
    const startDate = faker.date.soon({ days: faker.number.int({ min: 5, max: 30 }) });
    const endDate = faker.date.soon({ days: faker.number.int({ min: 31, max: 90 }), refDate: startDate });

    const body = {
      name: faker.commerce.productName() + ' Project',
      project_number: 'PRJ-' + faker.string.alphanumeric({ length: 6, casing: 'upper' }),
      description: faker.lorem.paragraphs(2),
      status: SEED_STATUSES[faker.number.int({ min: 0, max: 2 })],
      priority: SEED_PRIORITIES[faker.number.int({ min: 0, max: 2 })],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      stakeholder: faker.person.fullName(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      mobile: faker.phone.number(),
      email: faker.internet.email(),
      ppe: faker.helpers.arrayElements(SEED_PPE, faker.number.int({ min: 1, max: 3 })),
      addressLine1: faker.location.streetAddress(),
      town: faker.location.city(),
      county: faker.location.county(),
      postcode: faker.location.zipCode(),
      country: 'United Kingdom',
      completeAddress: faker.location.streetAddress(true),
      notify: false,
      location: { type: 'Point', coordinates: [parseFloat(faker.location.longitude()), parseFloat(faker.location.latitude())] }
    };

    results.push(handleSave(body));
  }

  await Promise.all(results);
}

const Project = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [show, setShow] = useState(false);
  const [showTeamOffcanvas, setShowTeamOffcanvas] = useState(false);
  const [showProjectOffcanvas, setShowProjectOffcanvas] = useState(false);
  const [project, setProject] = useState({});
  const [seeding, setSeeding] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, error, loading, totalCount, handleDelete, handleFetch } = useProject(debouncedSearchQuery);
  const { handleSave } = useProjectEdit();

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await generateSeedProjects(handleSave);
      await handleFetch({ pageIndex: 1, pageSize: 10 });
    } finally {
      setSeeding(false);
    }
  };

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
  const handleCloseProjectOffcanvas = () => {
    setShowProjectOffcanvas(false);
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        sortType: 'basic',
        Cell: ({ value, row }) => (
          <div className="d-flex align-items-center">
            <a
              className="pointer"
              onClick={() => {
                setProject((prev) => ({ ...prev, original: row.original, projectId: row.original._id }));
                setShowProjectOffcanvas(true);
              }}
            >
              {value}
            </a>
          </div>
        )
      },
      {
        Header: 'Start Date',
        accessor: 'startDate',
        Cell: ({ value, row }) => <div className="d-flex align-items-center">{dateFormatted(value)}</div>
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
        accessor: 'actions',
        disableSortBy: true,
        headerClassName: 'text-center actions-header',
        className: 'text-center actions-cell',
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
            <Tooltip title="Add Documents to project" arrow>
              <span className="p-0">
                <TiDocument
                  size={30}
                  className="pointer ms-2"
                  onClick={() => {
                    setProject((prev) => ({ ...prev, projectId: row.original._id }));
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
                    setProject((prev) => ({ ...prev, original: row.original, projectId: row.original._id }));
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
            <div className="d-flex gap-2">
              {IS_DEV && (
                <Button
                  variant="outline-warning"
                  size="sm"
                  disabled={seeding}
                  onClick={handleSeed}
                  title="Seed 5 projects with future dates (dev only)"
                >
                  <GiPlantSeed className="me-1" />
                  {seeding ? 'Seeding...' : 'Seed Projects'}
                </Button>
              )}
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
          </div>
          <Table data={data} columns={columns} pageCount={totalCount} loading={loading} fetchData={handleFetch} />
        </div>
      </div>
      {!loading && <span className="overlay__block" />}
      {error && <ErrorDialogue showError={error} onClose={() => {}} />}
      <RenderDocumentOffcanvas show={show} handleClose={handleClose} id={project.original?._id} />
      <RenderTeamOffcanvas
        project={project.original}
        show={showTeamOffcanvas}
        handleClose={handleCloseTeamOffcanvas}
        id={project.original?._id}
      />
      <RenderProjectOffcanvas
        project={project.original}
        show={showProjectOffcanvas}
        handleClose={handleCloseProjectOffcanvas}
      />
    </>
  );
};

export default Project;
