'use client';

import React, { useEffect } from 'react';
import { Offcanvas, ListGroup, Form, Alert } from 'react-bootstrap';
import { useTaskTeam } from '../../../../hooks/useTaskTeam';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import { MdDelete, MdCancel } from 'react-icons/md';
import Select from 'react-select';
import Tooltip from '@mui/material/Tooltip';

const RenderTeamOffcanvas = ({ show, handleClose, projectId, taskId }) => {
  const { data, error, customStyles, options, handleSelect, fields, handleChange, handleFetchOptions, handleDelete } =
    useTaskTeam(projectId, taskId);

  useEffect(() => {
    handleFetchOptions(projectId);
  }, []);

  const onChange = (id) => {
    handleSelect(id);
    handleChange('id', id);
  };

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          <p className="text-dark fw-bold fs-18">Teams</p>
        </div>
        <div>
          <MdCancel size={48} color="black" onClick={() => handleClose()} className="pointer" />
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
        <Form>
          <div className="row">
            <div className="col-md-12">
              <Form.Group controlId="formName" className="mb-1">
                <Select
                  options={options}
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
                            width="40"
                            height="40"
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

                      <Tooltip title="Remove from Task" arrow>
                        <span className="p-0">
                          <DeleteConfirmation
                            onConfirm={async () => {
                              handleDelete(team._id);
                            }}
                            onCancel={() => {}}
                            itemId={team._id}
                          >
                            <MdDelete size={30} className="pointer" />
                          </DeleteConfirmation>
                        </span>
                      </Tooltip>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </div>
          </div>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export { RenderTeamOffcanvas };
