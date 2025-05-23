import React, { useEffect } from 'react';
import { Offcanvas, ListGroup, Form, Alert } from 'react-bootstrap';
import { useUser } from '../../../../hooks/useUser';
import { MdAddCircleOutline } from 'react-icons/md';
import { MdCancel } from 'react-icons/md';
import Tooltip from '@mui/material/Tooltip';

const RenderUserOffcanvas = ({
  show,
  handleClose,
  currentUserChatId,
  currentUserId,
  error,
  firstname,
  handleCreateDirectChat
}) => {
  const { data, handleFetchUser } = useUser();

  useEffect(() => {
    handleFetchUser();
  }, []);

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
        <p className="text-dark fw-normal fs-18">Chat with user </p>
        </div>
        <div>
          <MdCancel size={48} color="black" onClick={handleClose} className="pointer" />
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
          <div>
            <div className="mt-1">
              <ListGroup>
                {data
                  .filter((j) => j._id !== currentUserId)
                  .map((user, index) => {
                    return (
                      <ListGroup.Item
                        key={`${index}-${user._id}`}
                        as="li"
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div className="d-flex align-items-center">
                          {user.secure_url ? (
                            <img
                              src={user.secure_url}
                              alt={user.name}
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
                              src={'/img/blank.png'}
                              alt={user.name}
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
                              {' '}
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="badge bg-pale-leaf text-leaf rounded-pill">{user.role}</span>
                          </div>
                        </div>

                        <Tooltip title="Create to chat" arrow>
                          <span className="p-0">
                            <MdAddCircleOutline
                              size={48}
                              className="pointer"
                              onClick={async () =>
                                await handleCreateDirectChat(
                                  currentUserChatId,
                                  user?.email,
                                  `${user.first_name}-${firstname}`
                                )
                              }
                            />
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

export { RenderUserOffcanvas };
