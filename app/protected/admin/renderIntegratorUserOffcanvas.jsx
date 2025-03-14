import React from 'react';
import { Container, Offcanvas, Table } from 'react-bootstrap';
import Badge from 'react-bootstrap/Badge';
import { FaRegCheckCircle, FaEraser } from 'react-icons/fa';
import { useUser } from '../../../hooks/useUser';

const RenderIntegratorUserOffcanvas = ({ show, handleClose, data, handleUpdateUser }) => {
  const { handleEditUser } = useUser();

  const onSubmit = async (user, status) => {
    const body = {
      ...user,
      user_status: status === 'no' ? true : false
    };

    handleEditUser(body, user._id).then((result) => {
      handleUpdateUser(user._id, body);
    });
  };

  return (
    <Container className="mt-5">
      <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '40%', backgroundColor: 'white' }}>
        <Offcanvas.Header closeButton></Offcanvas.Header>
        <Offcanvas.Body>
          <div className="table-responsive mt-4">
            <Table className="table  table-striped">
              <thead>
                <tr>
                  <th>FirstName</th>
                  <th>LastName</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((user) => (
                  <tr key={user._id}>
                    <td>{user.first_name}</td>
                    <td>{user.last_name}</td>
                    <td>{user.role}</td>
                    <td>
                      <div className="d-flex justify-content-start align-items-center">
                        {user.user_status ? (
                          <Badge bg="success" className="p-2">
                            Yes
                          </Badge>
                        ) : (
                          <Badge bg="danger" className="p-2">
                            No
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex justify-content-start align-items-center">
                        <FaRegCheckCircle
                          size={30}
                          className="pointer me-2"
                          onClick={() => onSubmit(user, 'no')}
                        ></FaRegCheckCircle>
                        <FaEraser size={30} className="pointer" onClick={() => onSubmit(user, 'yes')}></FaEraser>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

export default RenderIntegratorUserOffcanvas;
