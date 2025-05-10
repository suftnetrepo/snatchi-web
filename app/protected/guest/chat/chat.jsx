'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { Container, Row, Col, Form, ListGroup, InputGroup } from 'react-bootstrap';
import { useChatMessage } from '../../../../hooks/useChatMessage';
import { useChatInput } from '../../../../hooks/useChatInput';
import { useChatRoom } from '../../../../hooks/useChatRoom';
import { useChatContext } from '../../../../hooks/ChatContext';
import { FaSearch } from 'react-icons/fa';
import SimpleBar from 'simplebar-react';
import { convertTimestampToTime } from '../../../../utils/helpers';
import { useSession } from 'next-auth/react';
import ChatWindow from '@/components/reuseable/chat/chat-window';

const RenderChat = () => {
  const { data: session } = useSession();
  const { changeChatRoom, chatRoomId, currentChatUser } = useChatContext();
  const { handleSend, handleReset } = useChatInput();
  const { chats, search_terms, error, loading, handleSearchUsers, handleSearchChange } = useChatRoom(
    currentChatUser?.uid
  );

  console.log('session', session);
  console.log('currentChatUser', currentChatUser);

  const { messages } = useChatMessage(chatRoomId, currentChatUser?.uid);
  const ref = useRef();


  // useEffect(() => {
  //   if (ref.current) {
  //     ref.current.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [messages?.length]);

  const handleSendMessage = async (text) => {
    handleSend(chatRoomId, currentChatUser?.uid, text).then(() => {
      handleReset();
    });
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col md={3} className="bg-white sidebar">
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
                <Button
                  variant="outline-secondary"
                  onClick={() => handleSearchUsers(search_terms, currentChatUser?.uid, 100)}
                >
                  <FaSearch />
                </Button>
              </InputGroup>
              <SimpleBar>
                <ListGroup>
                  {chats.map((chat, index) => {
                    const formattedTime = convertTimestampToTime(chat.lastMessageTimestamp);
                    const unreadCount = chat?.unreadCount ? chat?.unreadCount[currentChatUser?.uid] : 0;
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

                          <Col xs={10} className="ps-3">
                            <div className="d-flex flex-column">
                              <div className="d-flex flex-row justify-content-between align-items-center">
                                <div className="d-flex flex-column justify-content-start align-items-start">
                                  <p className=" text-dark mb-0">{chat?.name || 'Unknown'}</p>
                                  {chat?.lastMessage && <p className="text-muted mb-0 small">{chat?.lastMessage}</p>}
                                </div>
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                  <p className="text-dark mb-0 small">{formattedTime}</p>
                                  {unreadCount > 0 && (
                                    <span className="badge rounded-pill bg-yellow">{unreadCount}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </SimpleBar>
            </>
          </Col>

          <Col md={9}>
            <div className="container py-4">
              <ChatWindow
                messages={messages}
                onMessageSent={(message) => handleSendMessage(message)}
                sender_Id={currentChatUser?.uid}
              />
            </div>
            <div ref={ref}> </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default RenderChat;
