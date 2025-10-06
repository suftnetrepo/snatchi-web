'use client';

import React, { useEffect } from 'react';
import { Offcanvas, ListGroup, Form, Alert } from 'react-bootstrap';
import { useTeam } from '../../../../hooks/useTeam';
import { useFence } from '../../../../hooks/useFence';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import { MdMyLocation } from 'react-icons/md';
import { MdDelete, MdCancel } from 'react-icons/md';
import Select from 'react-select';
import Tooltip from '@mui/material/Tooltip';

const RenderTeamOffcanvas = ({ show, handleClose, id }) => {
  const { data: fenceData, error: fenceError, loading, success,handleReset, handleFetchByUser } = useFence();
  const { data, error, customStyles, teamData, handleSelect, fields, handleChange, handleDelete, handleFetchUsers } =
    useTeam(id);

  console.log('fenceData', fenceData);
  console.log('data', data);

  useEffect(() => {
    handleFetchUsers({ pageIndex: 1, pageSize: 100 });
  }, []);

  const onClose = () => {
   if (success) {
      handleReset();
   }else{
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
          <p className="text-dark fw-bold fs-18"> Teams</p>
        </div>
        <div>
          <MdCancel size={48} color="black" onClick={()=>onClose()} className="pointer" />
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
                              <MdMyLocation size={30} className="pointer" onClick={() => handleFetchByUser(team.id._id, id)} />
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
          <div class="table-responsive-md">
            <table class="table border-white">
            <thead class="table-light border-dark">
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time</th>
                  <th scope="col">Status</th>
                  <th scope="col">Latitude</th>
                  <th scope="col">Longitude</th>
                </tr>
              </thead>
              <tbody>
                {
                  fenceData?.map((fence, index) => {
                    return (
                      <tr key={`${index}-${fence._id}`} className={`${fence.status === "Enter" ? "bg-success" : "bg-danger"} `}>
                        <td className='text-white'>{new Date(fence.date).toDateString()}</td>
                        <td className='text-white'>{fence.time}</td>
                        <td className='text-white'>{fence.status}</td>
                        <td className='text-white'>{fence.latitude}</td>
                        <td className='text-white'>{fence.longitude}</td>
                      </tr>
                    );
                  }
                  )
                }
              </tbody>
            </table>
          </div>

        )}

      </Offcanvas.Body>
    </Offcanvas>
  );
};

export { RenderTeamOffcanvas };
