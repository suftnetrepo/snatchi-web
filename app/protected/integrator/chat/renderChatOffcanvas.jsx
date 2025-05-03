import React from 'react';
import { Offcanvas, ListGroup, Form, Alert, InputGroup, Button } from 'react-bootstrap';
import { useUser } from '../../../../hooks/useUser';
import { MdAddCircleOutline } from 'react-icons/md';
import { MdCancel } from 'react-icons/md';
import { FaSearch } from 'react-icons/fa';
import Tooltip from '@mui/material/Tooltip';

const RenderChatOffcanvas = ({ show, handleClose, chatRoomId, addMemberToGroupChat, userId }) => {
  const { searchResults, error, searchTerm, handleSearchUser, handleChange } = useUser();

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          <p className="text-dark fw-normal fs-18">Add user to Chat group</p>
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
          <div className="row">
            <div className="col-md-12">
              <Form.Group controlId="formName" className="mb-1">
                <InputGroup className="mb-3">
                  <Form.Control
                    placeholder="Search users by name or email"
                    value={searchTerm}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchUser(searchTerm);
                      }
                    }}
                  />
                  <Button variant="outline-secondary" onClick={() => handleSearchUser(searchTerm)}>
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Form.Group>
            </div>
          </div>
          <div>
            <div className="mt-1">
              <ListGroup>
                {searchResults?.map((user, index) => {
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
                            src={'http://'}
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
                            {user.first_name} {user.last_name}
                          </span>
                          <span className="badge bg-pale-leaf text-leaf rounded-pill">{user.role}</span>
                        </div>
                      </div>

                      <Tooltip title="Add to chat" arrow>
                        <span className="p-0">
                          <MdAddCircleOutline
                            size={48}
                            className="pointer"
                            onClick={async () => addMemberToGroupChat(chatRoomId, user?.email, userId)}
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

export { RenderChatOffcanvas };
