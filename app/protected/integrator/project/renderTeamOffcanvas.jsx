'use client';

import React, { useEffect, useState } from 'react';
import { Offcanvas, ListGroup, Form, Alert, Button } from 'react-bootstrap';
import { useTeam } from '../../../../hooks/useTeam';
import { useFence } from '../../../../hooks/useFence';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import { MdMyLocation } from 'react-icons/md';
import { MdDelete, MdCancel, MdFilterList } from 'react-icons/md';
import Select from 'react-select';
import Tooltip from '@mui/material/Tooltip';
import { formattedTime, getFenceStatusColorCode } from '../../../../utils/helpers';

const RenderTeamOffcanvas = ({ show, project, handleClose, id }) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { data: fenceData, error: fenceError, loading, success, userId, handleReset, handleFetchByUser } = useFence();
  const { data, error, customStyles, teamData, handleSelect, fields, handleChange, handleDelete, handleFetchUsers } =
    useTeam(id);

  console.log('userId', userId);
  // console.log('data', data);
  // console.log('project', project);

  useEffect(() => {
    handleFetchUsers({ pageIndex: 1, pageSize: 100 });
  }, []);

  const onClose = () => {
    if (success) {
      handleReset();
    } else {
      handleClose();
    }
  };

  const onChange = (id) => {
    handleSelect(id);
    handleChange('id', id);
  };

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '40%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          {
            !success ? (<p className="text-dark fw-bold fs-18"> Teams</p>) :
              (<>
                <span className="text-dark fw-bold fs-18">Tracking Location</span>
                <span className="text-dark fw-normal fs-14">{project?.completeAddress}</span>
              </>)
          }

        </div>
        <div>
          <MdCancel size={48} color="black" onClick={() => onClose()} className="pointer" />
        </div>
      </div>
      <Offcanvas.Body>
        {error && (
          <div className="row">
            <div className="col-md-12">
              <Alert variant={'danger'}>{error}</Alert>
            </div>
          </div>
        )}
        {!success ? (
          <Form>
            <div className="row">
              <div className="col-md-12">
                <Form.Group controlId="formName" className="mb-1">
                  <Select
                    options={teamData}
                    value={fields.id}
                    onChange={(id) => onChange(id?.value)}
                    isSearchable={true}
                    placeholder="Select a user..."
                    styles={customStyles}
                  />
                </Form.Group>
              </div>
            </div>
            <div>
              <div className="mt-1">
                <ListGroup>
                  {data?.map((team, index) => {
                    return (
                      <ListGroup.Item
                        key={`${index}-${team._id}`}
                        as="li"
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div className="d-flex align-items-center">
                          {team.id.secure_url ? (
                            <img
                              src={team.id.secure_url}
                              alt={`${team?.id.first_name} ${team?.id.last_name}`}
                              className="rounded-circle me-2"
                              width="60"
                              height="60"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/img/blank.png';
                              }}
                            />
                          ) : (
                            <img
                              src={'http://'}
                              alt={`${team?.id.first_name} ${team?.id.last_name}`}
                              className="rounded-circle me-2"
                              width="60"
                              height="60"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/img/blank.png';
                              }}
                            />
                          )}
                          <div className="d-flex flex-column justify-content-start align-items-start">
                            <span>
                              {team?.id.first_name} {team?.id.last_name}
                            </span>
                            <span className={`badge bg-primary transparent`}>{team.id.role}</span>
                          </div>
                        </div>
                        <div className="d-flex flex-row justify-content-end align-items-end mx-3">
                          <Tooltip title="View Enigeer Site log" arrow className='me-2'>
                            <span className="p-0">
                              <MdMyLocation size={30} className="pointer" onClick={() => {
                                const today = new Date();
                                const formattedDate = today.toISOString().split('T')[0];
                                handleFetchByUser(team.id._id, id, formattedDate)
                              }} />
                            </span>
                          </Tooltip>
                          <Tooltip title="Remove from Project" arrow >
                            <span className="p-0">
                              <DeleteConfirmation
                                onConfirm={async () => {
                                  handleDelete(team._id);
                                }}
                                onCancel={() => { }}
                                itemId={team._id}
                              >
                                <MdDelete size={30} className="pointer" />
                              </DeleteConfirmation>
                            </span>
                          </Tooltip>
                        </div>

                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </div>
            </div>
          </Form>
        ) : (
          <div className='d-flex flex-column justify-content-start align-items-start'>
            <div className='d-flex flex-row justify-content-start align-items-start mb-2'>
              <Form.Control
                type="date"
               value={selectedDate ?? selectedDate?.split('T')[0]} 
                className="form-control border border-secondary rounded-3 "
                onChange={(e) => setSelectedDate(e.target.value)}
              /> <Button disabled={!userId} type="button" className='p-3 ms-2' variant="primary" onClick={() => {
              handleFetchByUser(userId, id, selectedDate);
              }}>
                <MdFilterList />
              </Button>
            </div>
            <div className='w-100'>
              <table class="table table-bordered">
                <thead class="table-light">
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Time</th>
                    <th scope="col">Status</th>
                    <th scope="col">Latitude</th>
                    <th scope="col">Longitude</th>
                    <th scope="col">Radius</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    fenceData?.map((fence, index) => {
                      return (
                        <tr key={`${index}-${fence._id}`} >
                          <td className='text-dark'>{new Date(fence.date).toDateString()}</td>
                          <td className='text-dark'>{formattedTime(fence.time)}</td>
                          <td className='text-dark'> <span className={`badge ${getFenceStatusColorCode(fence.status)}`}>{fence.status}</span></td>
                          <td className='text-dark'>{fence.latitude}</td>
                          <td className='text-dark'>{fence.longitude}</td>
                          <td className='text-dark'>{fence.radius}m</td>
                        </tr>
                      );
                    }
                    )
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

      </Offcanvas.Body>
    </Offcanvas>
  );
};

export { RenderTeamOffcanvas };
