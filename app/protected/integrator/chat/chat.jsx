/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Container, Row, Col, Form, ListGroup, InputGroup, Modal, Tab, Tabs } from 'react-bootstrap';
import { useChatInput, useChatRoom, useChatMessage, useIntegratorChat } from '../../../../hooks/useChat';
import { useChatContext } from '../../../../hooks/ChatContext';
import { FaSearch } from 'react-icons/fa';
import SimpleBar from 'simplebar-react';
import { formatTimeForObject } from '../../../../utils/helpers';
import { RenderChatOffcanvas } from './renderChatOffcanvas';
import { useSession } from 'next-auth/react';
import ChatWindow from '@/components/reuseable/chat/chat-window';
import { useSearchParams } from 'next/navigation';

const RenderChat = () => {
  const { data: session } = useSession();
  const { changeChatRoom, chatRoomId, chatRoom } = useChatContext();
  const { handleSend, handleReset } = useChatInput();
  const {
    handleSearch,
    handleSearchChange,
    handleAddMember,
    handleNewRoom,
    handleNewRoomChange,
    roomName,
    search_terms,
    chats
  } = useChatRoom(session?.user?.id);
  const { messages } = useChatMessage(chatRoomId, session?.user?.id);
  const { integratorChatRooms, handleIntegratorChatSearch, handleIntegratorSearchChange, integrator_search_terms } = useIntegratorChat(session?.user?.integrator);
  const [showChatOffcanvas, setShowChatOffcanvas] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const id = searchParams.get('i');

  useEffect(() => {
    const chat = integratorChatRooms.find((j) => j.id === id);
    if (chat) {
      changeChatRoom(chat);
    }
  }, [integratorChatRooms, id]);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages?.length]);

  const handleSendMessage = async (text) => {
    handleSend(chatRoomId, session?.user?.id, chatRoom.users, text).then(() => {
      handleReset();
    });
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col md={3} className="bg-white sidebar">
            <Tabs
              defaultActiveKey={query === 'integrator' ? 'integrator' : 'engineer'}
              id="uncontrolled-tab-example"
              className="mb-3"
            >
              <Tab eventKey="engineer" title="Engineer">
                <>
                  <InputGroup className="mb-3" style={{ maxWidth: '400px' }}>
                    <Form.Control
                      placeholder="Search"
                      value={search_terms}
                      onChange={(e) => handleSearchChange('search_terms', e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch(search_terms);
                        }
                      }}
                    />
                    <Button variant="outline-secondary" onClick={() => handleSearch(search_terms)}>
                      <FaSearch />
                    </Button>
                  </InputGroup>
                  <SimpleBar>
                    <ListGroup>
                      {chats.map((chat, index) => {
                        const formattedTime = formatTimeForObject(chat.lastUpdated);
                        return (
                          <ListGroup.Item
                            key={chat.id || index}
                            className={`pointer ${chatRoomId === chat.id ? 'active' : ''}`}
                            onClick={() => changeChatRoom(chat)}
                          >
                            <Row className="d-flex align-items-center py-2">
                              <Col xs={2} className="text-center">
                                <div className="position-relative">
                                  <img
                                    src={chat?.photoURL || '/img/blank.png'}
                                    alt={chat?.name || 'User'}
                                    className="rounded-circle"
                                    width="50"
                                    height="50"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/img/blank.png';
                                    }}
                                  />
                                </div>
                              </Col>

                              <Col xs={8} className="ps-4">
                                <div className="d-flex flex-column">
                                  <div className="d-flex flex-row justify-content-between align-items-center">
                                  <p className=" text-dark mb-0">{chat?.name || 'Unknown'}</p>
                                    <p className="text-dark mb-0 small">{formattedTime}</p>
                                  </div>
                                  <p className="text-muted mb-0 small">{chat?.lastMessage}</p>
                                </div>
                              </Col>

                              <Col xs={2} className="text-end">
                                {chat?.unreadCount > 0 && (
                                  <span className="badge rounded-pill bg-green">{chat.unreadCount}</span>
                                )}
                              </Col>
                            </Row>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  </SimpleBar>
                </>
              </Tab>
              <Tab eventKey="integrator" title="Integrator">
                <>
                  <InputGroup className="mb-3" style={{ maxWidth: '400px' }}>
                    <Form.Control
                      placeholder="Search"
                      value={integrator_search_terms}
                      onChange={(e) => handleIntegratorSearchChange('integrator_search_terms', e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleIntegratorChatSearch(integrator_search_terms);
                        }
                      }}
                    />
                    <Button variant="outline-secondary" onClick={() => handleIntegratorChatSearch(integrator_search_terms)}>
                      <FaSearch />
                    </Button>
                  </InputGroup>
                  <SimpleBar>
                    <ListGroup>
                      {integratorChatRooms.map((chat, index) => {
                        const formattedTime = formatTimeForObject(chat.lastUpdated);
                        return (
                          <ListGroup.Item
                            key={chat.id || index}
                            className={`pointer ${chatRoomId === chat.id ? 'active' : ''}`}
                            onClick={() => changeChatRoom(chat)}
                          >
                            <Row className="d-flex align-items-center py-2">
                              <Col xs={2} className="text-center">
                                <div className="position-relative">
                                  <img
                                    src={chat?.photoURL || '/img/blank.png'}
                                    alt={chat?.name || 'User'}
                                    className="rounded-circle"
                                    width="50"
                                    height="50"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/img/blank.png';
                                    }}
                                  />
                                </div>
                              </Col>

                              <Col xs={8} className="ps-4">
                                <div className="d-flex flex-column">
                                  <div className="d-flex flex-column justify-content-between align-items-start">
                                    <p className=" text-dark mb-0">{chat?.name || 'Unknown'}</p>
                                    <p className="text-dark mb-0 small">{formattedTime}</p>
                                  </div>
                                  <p className="text-muted mb-0 small">{chat?.lastMessage}</p>
                                </div>
                              </Col>

                              <Col xs={2} className="text-end">
                                {chat?.unreadCount > 0 && (
                                  <span className="badge rounded-pill bg-green">{chat.unreadCount}</span>
                                )}
                              </Col>
                            </Row>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  </SimpleBar>
                </>
              </Tab>
            </Tabs>
          </Col>

          <Col md={9}>
            <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
              <div className="d-flex justify-content-start align-items-center ">
                <img
                  src={'http://'}
                  alt={chatRoom?.name}
                  className="rounded-circle me-1"
                  width="60"
                  height="60"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/img/blank.png';
                  }}
                />

                <div className="d-flex flex-column justify-content-start align-items-start ms-1">
                  <p className=" text-dark mb-0">{chatRoom?.name || 'Unknown'}</p>
                  {!chatRoom?.isIntegratorRoom && (
                    <small className="text-muted">
                      {chatRoom?.users?.length} member{chatRoom?.users?.length > 1 ? 's' : ''}
                    </small>
                  )}
                </div>
              </div>
              {!chatRoom?.isIntegratorRoom && (
                <div>
                  <Button type="button" variant="outline-secondary" onClick={() => setShow(true)}>
                    Create Room
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={() => setShowChatOffcanvas(true)}
                  >
                    Add Participant
                  </Button>
                </div>
              )}
            </div>
            <div className="container py-4">
              <ChatWindow
                messages={messages}
                onMessageSent={(message) => handleSendMessage(message)}
                sender_Id={session?.user?.id}
              />
            </div>
            <div ref={ref}> </div>
          </Col>
        </Row>
      </Container>
      <RenderChatOffcanvas
        show={showChatOffcanvas}
        handleClose={() => setShowChatOffcanvas(false)}
        chatRoomId={chatRoomId}
        handleAddMember={handleAddMember}
      />
      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="email"
                value={roomName}
                placeholder="Enter room name"
                autoFocus
                maxLength={50}
                onChange={(e) => handleNewRoomChange(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            disabled={!roomName.length}
            onClick={async () => handleNewRoom([session?.user?.id], roomName)}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RenderChat;
