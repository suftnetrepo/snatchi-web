
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Container, Row, Col, Form, ListGroup, InputGroup, Modal, Tab, Tabs } from 'react-bootstrap';
import { useChatMessage } from '../../../../hooks/useChatMessage';
import { useChatInput } from '../../../../hooks/useChatInput';
import { useChatRoom } from '../../../../hooks/useChatRoom';
import { useUserChat } from '../../../../hooks/useUserChat';
import { useChatContext } from '../../../../hooks/ChatContext';
import { FaSearch } from 'react-icons/fa';
import SimpleBar from 'simplebar-react';
import { formatTimeForObject } from '../../../../utils/helpers';
import { RenderChatOffcanvas } from './renderChatOffcanvas';
import { RenderUserOffcanvas } from './renderUserOffcanvas';
import { useSession } from 'next-auth/react';
import ChatWindow from '@/components/reuseable/chat/chat-window';
import { useSearchParams } from 'next/navigation'

const RenderChat = () => {
  const { data: session } = useSession();
  const { changeChatRoom, chatRoomId, chatRoom, currentChatUser } = useChatContext();
  const { handleSend, handleReset } = useChatInput();
  const {
    chats,
    search_terms,
    error,
    loading,
    roomName,
    handleSearchUsers,
    handleSearchChange,
    handleNewRoomChange,
    handleNewRoom,
  } = useChatRoom(currentChatUser?.uid);
  const { addMemberToGroupChat, handleCreateDirectChat }= useUserChat()
  const { messages } = useChatMessage(chatRoomId, currentChatUser?.uid);
  const [showChatOffcanvas, setShowChatOffcanvas] = useState(false);
  const [showSingleChatOffcanvas, setShowSingleChatOffcanvas] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const id = searchParams.get('i');

  console.log('.....................chats', chats);
  console.log('.....................currentChatUser?.uid', currentChatUser?.uid);

  useEffect(() => {
    const chat = chats.find((j) => j.id === id);
    if (chat) {
      changeChatRoom(chat);
    }
  }, [chats, id]);

  // useEffect(() => {
  //   if (ref.current) {
  //     ref.current.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [messages?.length]);

  const handleSendMessage = async (text) => {
    handleSend(chatRoomId,currentChatUser?.uid, chatRoom.users, text).then(() => {
      handleReset();
    });
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col md={3} className="bg-white sidebar">
            <Tabs
              defaultActiveKey={'chat'}
              id="uncontrolled-tab-chat"
              variant="tabs"
              className="mb-3 custom-tabs"
            >
              <Tab eventKey="chat" title="Char">
                <>
                  <InputGroup className="mb-3">
                    <Form.Control
                      placeholder="Search"
                      value={search_terms}
                      onChange={(e) => handleSearchChange('search_terms', e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          search_terms && handleSearchUsers(search_terms, currentChatUser?.uid, 100);
                        }
                      }}
                    />
                    <Button variant="outline-secondary" onClick={() => handleSearchUsers(search_terms, currentChatUser?.uid, 100)}>
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
                            <Row className="d-flex align-items-center">
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

                              <Col xs={8} className="ps-3">
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
              
            </Tabs>
          </Col>

          <Col md={9}>
            <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
              <div className="d-flex justify-content-start align-items-center ">
                <img
                  src={'/img/blank.png'}
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
                  <p className=" text-dark mb-0">{chatRoom?.name || 'No user selected'}</p>
                  {chatRoom?.type === 'group' && (
                    <small className="text-muted">
                      {chatRoom?.users?.length > 0 &&
                        `${chatRoom.users.length} member${chatRoom.users.length > 1 ? 's' : ''}`}
                    </small>
                  )}
                </div>
              </div>

              <div>
                <Button type="button" variant="outline-secondary" onClick={() => setShowSingleChatOffcanvas(true)}>
                  Create User
                </Button>
                <Button className="ms-2" type="button" variant="outline-secondary" onClick={() => setShow(true)}>
                  Create Group
                </Button>
                {chatRoom?.type === 'group' && (
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={() => setShowChatOffcanvas(true)}
                  >
                    Add user to group
                  </Button>
                )}
              </div>
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
        addMemberToGroupChat={addMemberToGroupChat}
        userId = {session?.user?.id}
      />
      <RenderUserOffcanvas
        show={showSingleChatOffcanvas}
        handleClose={() => setShowSingleChatOffcanvas(false)}
        currentUserId={session?.user?.id}
        currentUserChatId={currentChatUser?.uid}
        firstname={session?.user?.first_name}
        handleCreateDirectChat={handleCreateDirectChat}
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
            onClick={async () => handleNewRoom([currentChatUser?.uid], roomName, 'group')}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RenderChat;
