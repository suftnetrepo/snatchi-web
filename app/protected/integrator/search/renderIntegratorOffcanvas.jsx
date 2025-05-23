'use client';

import React from 'react';
import { Container, Offcanvas, Row, Col, Button, Image } from 'react-bootstrap';
import { FaComment, FaEnvelope, FaPhone } from 'react-icons/fa';
import { capitalizeFirstLetter } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import { useUserChat } from '@/hooks/useUserChat';

const RenderIntegratorOffcanvas = ({ show, session, currentChatId, handleClose, data }) => {
  const route = useRouter();
  const { handleCreateDirectChat, error, loading } = useUserChat();
  const chatName = `${capitalizeFirstLetter(session?.user?.first_name)} ${capitalizeFirstLetter(data?.name)}`.trim();

  const handleNewDirectChat = async () => {
    handleCreateDirectChat(currentChatId, data?.email, chatName, 'direct').then((result) => {
      route.push(`/protected/integrator/chat?i=${result}`);
    });
  };

  return (
    <Container className="mt-5">
      <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '30%', backgroundColor: 'white' }}>
        <Offcanvas.Header closeButton></Offcanvas.Header>
        <Offcanvas.Body>
          <div className="d-flex flex-column align-items-center justify-content-center mb-5">
            <Image height={120} width={120} src="/img/avatars/t1.jpg" roundedCircle alt="Profile Avatar" />

            <span className="h3 mb-0 text-dark">{data?.name}</span>
            <span className="h6 mb-0">
              <FaPhone size={12} /> {data?.mobile}
            </span>
            <span className="h6 mb-5">
              <FaEnvelope size={12} /> {data?.email}
            </span>
            <p className="mb-0 text-dark">{data?.description}</p>
          </div>

          <Row className="d-flex justify-content-start ">
            <Col>
              <Button
                variant="success"
                className="d-flex gap-1 px-3 justify-content-start align-items-center"
                onClick={() => handleNewDirectChat()}
              >
                <FaComment size={24} />
                Chat
              </Button>
            </Col>
          </Row>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
};

export default RenderIntegratorOffcanvas;
