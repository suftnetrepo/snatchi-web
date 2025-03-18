/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Container, Row, Col, Form, ListGroup, InputGroup, Modal } from 'react-bootstrap';
import { BsPaperclip, BsSend } from 'react-icons/bs';
import { useChatInput, useChatRoom, useChatMessage } from '../../../../hooks/useChat';
import { useChatContext } from '../../../../hooks/ChatContext';
import { FaSearch } from 'react-icons/fa';
import SimpleBar from 'simplebar-react';
import { formatTimeForObject, convertTimestampToTime } from '../../../../utils/helpers';
import { RenderChatOffcanvas } from './renderChatOffcanvas';
import { useSession } from 'next-auth/react';

const RenderChat = () => {
  const { data: session }= useSession()
  const { changeChatRoom, chatRoomId, chatRoom } = useChatContext();
  const { handleSend, handleReset, handleChange, text, img } = useChatInput();
  const { handleSearch, handleSearchChange, handleAddMember, handleNewRoom, handleNewRoomChange, roomName, search_terms, chats } = useChatRoom(session?.user?.id);
  const { messages } = useChatMessage(chatRoomId, session?.user?.id);
  const [showChatOffcanvas, setShowChatOffcanvas] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef();
 
  useEffect(() => {
    const chat = chats.find((j) => j.users.includes(session?.user?.id));
   
    if (chat) {
      changeChatRoom(chat);
    }
   
  }, [chats?.length]);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages?.length]);

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && text.length) {
      e.preventDefault();
      await handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    handleSend(chatRoomId, session?.user?.id, chatRoom.users, text, img).then(() => {
      handleReset();
    });
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col md={3} className="bg-white sidebar">
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
                <Button variant="outline-secondary"  onClick={() => handleSearch(search_terms)}>
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
                                <h6 className="mb-1 text-truncate">{chat?.name || 'Unknown'}</h6>
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
          </Col>

          <Col md={9} className="chat-window">
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
                  <h6 className="text-dark mb-0">{chatRoom?.name}</h6>
                  <small className="text-muted">{chatRoom?.users?.length} member{chatRoom?.users?.length > 1 ? 's' : ''}</small>
                </div>
              </div>
              <div>
                <Button type="button" variant="outline-secondary" onClick={() => setShow(true)}>
                  Create Room
                </Button>
                <Button type="button" variant="outline-secondary" className='ms-2' onClick={() => setShowChatOffcanvas(true)}>
                  Add Participant
                </Button>
              </div>
             
            </div>
            <div className="container py-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`d-flex mb-3 ${
                    message?.senderId === session?.user?.id? 'justify-content-end' : 'justify-content-start'
                  }`}
                >
                  <div
                    className={`message p-3 rounded-3 ${
                      message?.senderId === session?.user?.id ? 'bg-primary text-white' : 'bg-light text-dark'
                    }`}
                  >
                    <p className="mb-0">{message.text}</p>
                    {message.imageURL && (
                      <div className="d-flex align-items-center">
                        <i className="bi bi-paperclip me-2" style={{ fontSize: '1.2rem' }}></i>
                        <a
                          href={message.imageURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            color: message?.senderId === session?.user?.id ? '#eceef0' : '#007bff'
                          }}
                        >
                          Open Attachment
                        </a>
                      </div>
                    )}
                    <small className="text-muted d-block text-end">{convertTimestampToTime(message.timestamp)}</small>
                  </div>
                </div>
              ))}
            </div>
            <div ref={ref}> </div>
            <div className="p-3 border-top">
              <div className="input-group">
                <button className="btn btn-primary" onClick={() => document.getElementById('file-input').click()}>
                  <BsPaperclip />
                  <input
                    type="file"
                    id="file-input"
                    style={{ display: 'none' }}
                    onChange={(e) => handleChange('img', e.target.files[0])}
                  />
                </button>
                <input
                  type="text"
                  value={text}
                  onKeyDown={(e) => handleKeyDown(e)}
                  className="form-control border-0"
                  placeholder="Write your message..."
                  onChange={(e) => handleChange('text', e.target.value)}
                />
                <button className="btn btn-primary" disabled={!text.length} onClick={() => handleSendMessage()}>
                  <BsSend />
                </button>
              </div>
            </div>
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
                onChange={(e)=> handleNewRoomChange(e.target.value)}
              />
            </Form.Group>           
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
          <Button variant="primary" disabled={!roomName.length} onClick={async () => handleNewRoom([session?.user?.id], roomName)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RenderChat;
