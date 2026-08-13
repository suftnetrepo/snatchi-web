'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Container, Row, Col, Form, ListGroup, InputGroup, Modal } from 'react-bootstrap';
import { useChatMessage } from '../../../../hooks/useChatMessage';
import { useChatInput } from '../../../../hooks/useChatInput';
import { useChatRoom } from '../../../../hooks/useChatRoom';
import { useUserChat } from '../../../../hooks/useUserChat';
import { useChatContext } from '../../../../hooks/ChatContext';
import { FaSearch, FaUserPlus, FaUsers, FaComments } from 'react-icons/fa';
import SimpleBar from 'simplebar-react';
import { convertTimestampToTime } from '../../../../utils/helpers';
import { RenderChatOffcanvas } from './renderChatOffcanvas';
import { RenderUserOffcanvas } from './renderUserOffcanvas';
import { useSession } from 'next-auth/react';
import ChatWindow from '@/components/reuseable/chat/chat-window';
import { useSearchParams } from 'next/navigation';
import styles from './chat.module.scss';

const isGroupConversation = (chat) => {
  const name = String(chat?.name || chat?.title || '').trim().toLowerCase();
  const isBookingConversation = chat?.type === 'schedule' || name.startsWith('booking:') || Boolean(chat?.scheduleId);
  return chat?.type === 'group' && !isBookingConversation;
};

const RenderChat = () => {
  const { data: session } = useSession();
  const { changeChatRoom, chatRoomId, chatRoom, currentChatUser } = useChatContext();
  const [stableChatUserId, setStableChatUserId] = useState(null);
  const { handleSend, handleReset } = useChatInput();
  const {
    chats,
    search_terms,
    error,
    loading,
    roomName,
    handleSearchChange,
    handleNewRoomChange,
    handleNewRoom
  } = useChatRoom(stableChatUserId);
  const { addMemberToGroupChat, handleCreateDirectChat } = useUserChat();
  const activeSenderId = useMemo(() => {
    const sessionEmail = session?.user?.email?.toLowerCase();
    const matchedUserId = sessionEmail && chatRoom?.users?.find((userId) => {
      return chatRoom?.userDetails?.[userId]?.email?.toLowerCase() === sessionEmail;
    });

    return matchedUserId || currentChatUser?.uid || stableChatUserId || null;
  }, [chatRoom, currentChatUser?.uid, session?.user?.email, stableChatUserId]);
  const senderAliases = useMemo(() => {
    return [
      activeSenderId,
      stableChatUserId,
      currentChatUser?.uid,
      currentChatUser?.email,
      session?.user?.id,
      session?.user?._id,
      session?.user?.email
    ].filter(Boolean);
  }, [activeSenderId, currentChatUser?.email, currentChatUser?.uid, session?.user, stableChatUserId]);
  const { messages } = useChatMessage(chatRoomId, activeSenderId);
  const [showChatOffcanvas, setShowChatOffcanvas] = useState(false);
  const [showSingleChatOffcanvas, setShowSingleChatOffcanvas] = useState(false);
  const [show, setShow] = useState(false);
  const [conversationType, setConversationType] = useState('direct');
  const ref = useRef();
  const searchParams = useSearchParams();
  const id = searchParams.get('i');

  const conversationCounts = useMemo(() => ({
    direct: chats.filter((chat) => !isGroupConversation(chat)).length,
    group: chats.filter((chat) => isGroupConversation(chat)).length
  }), [chats]);

  const visibleChats = useMemo(() => {
    const term = search_terms.trim().toLowerCase();
    return chats.filter((chat) => {
      const matchesType = conversationType === 'group' ? isGroupConversation(chat) : !isGroupConversation(chat);
      const matchesSearch = !term || `${chat.name || ''} ${chat.lastMessage || ''}`.toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });
  }, [chats, conversationType, search_terms]);

  useEffect(() => {
    if (currentChatUser?.uid) setStableChatUserId(currentChatUser.uid);
  }, [currentChatUser?.uid]);

  useEffect(() => {
    const chat = chats.find((j) => j.id === id);
    if (chat) {
      changeChatRoom(chat);
      setConversationType(isGroupConversation(chat) ? 'group' : 'direct');
    }
  }, [chats, id]);

  // useEffect(() => {
  //   if (ref.current) {
  //     ref.current.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [messages?.length]);

  const handleSendMessage = async (text) => {
    handleSend(chatRoomId, activeSenderId, text).then(() => {
      handleReset();
    });
  };

  const handleCreateGroup = async () => {
    await handleNewRoom([currentChatUser?.uid], roomName.trim(), 'group');
    handleNewRoomChange('');
    setConversationType('group');
    setShow(false);
  };

  return (
    <>
      <Container fluid className={styles.chatPage}>
        <Row className={styles.chatShell}>
          <Col md={4} lg={3} className={styles.conversationSidebar}>
            <>
              <div className={styles.sidebarHeader}>
                <div>
                  <span className={styles.eyebrow}>Messages</span>
                  <h1>Conversations</h1>
                </div>
                <span className={styles.conversationCount}>{chats.length}</span>
              </div>
              <div className={styles.conversationTabs} role="tablist" aria-label="Conversation type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={conversationType === 'direct'}
                  className={conversationType === 'direct' ? styles.activeTab : ''}
                  onClick={() => setConversationType('direct')}
                >
                  <span>Direct</span><em>{conversationCounts.direct}</em>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={conversationType === 'group'}
                  className={conversationType === 'group' ? styles.activeTab : ''}
                  onClick={() => setConversationType('group')}
                >
                  <span>Groups</span><em>{conversationCounts.group}</em>
                </button>
              </div>
              <InputGroup className={styles.searchBox}>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Search conversations"
                  aria-label="Search conversations"
                  value={search_terms}
                  onChange={(e) => handleSearchChange('search_terms', e.target.value)}
                />
              </InputGroup>
              <SimpleBar className={styles.conversationScroll}>
                <ListGroup className={styles.conversationList}>
                  {!loading && visibleChats.length === 0 && (
                    <div className={styles.emptyList}>
                      <FaComments />
                      <strong>{search_terms ? 'No matching conversations' : `No ${conversationType === 'group' ? 'group' : 'direct'} conversations yet`}</strong>
                      <span>{search_terms ? 'Try a different search.' : conversationType === 'group' ? 'Create a group to bring your team together.' : 'Book an engineer or start a new chat.'}</span>
                    </div>
                  )}
                  {visibleChats.map((chat, index) => {
                    const formattedTime = convertTimestampToTime(chat.lastMessageTimestamp);
                    const unreadCount =chat?.unreadCount ?chat?.unreadCount[currentChatUser?.uid]  :0
                    return (
                      <ListGroup.Item
                        key={chat.id || index}
                        className={`${styles.conversationItem} ${chatRoomId === chat.id ? styles.activeConversation : ''}`}
                        onClick={() => changeChatRoom(chat)}
                      >
                        <Row className="d-flex align-items-center">
                          <Col xs={2} className="text-center">
                            <div className="position-relative">
                              <img
                                src={chat?.photoURL || '/img/blank.png'}
                                alt={chat?.name || 'User'}
                                className={styles.avatar}
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
                                <p className={styles.conversationName}>{chat?.name || 'Unknown'}</p>
                                <p className={styles.messagePreview}>{chat?.lastMessage || 'No messages yet'}</p>
                                </div>
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                <p className={styles.conversationTime}>{formattedTime}</p>
                                {unreadCount > 0 && (
                                  <span className={styles.unreadBadge}>
                                    {unreadCount}
                                  </span>
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

          <Col md={8} lg={9} className={styles.chatMain}>
            <div className={styles.chatHeader}>
              <div className="d-flex justify-content-start align-items-center ">
                <img
                  src={'/img/blank.png'}
                  alt={chatRoom?.name}
                  className={styles.headerAvatar}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/img/blank.png';
                  }}
                />

                <div className="d-flex flex-column justify-content-start align-items-start ms-1">
                  <p className={styles.chatTitle}>{chatRoom?.name || 'Select a conversation'}</p>
                  {chatRoom?.type === 'group' && (
                    <small className="text-muted">
                      {chatRoom?.users?.length > 0 &&
                        `${chatRoom.users.length} member${chatRoom.users.length > 1 ? 's' : ''}`}
                    </small>
                  )}
                </div>
              </div>

              <div className={styles.headerActions}>
                <Button type="button" className={styles.secondaryAction} onClick={() => setShowSingleChatOffcanvas(true)}>
                  <FaUserPlus /> <span>New chat</span>
                </Button>
                <Button type="button" className={styles.primaryAction} onClick={() => setShow(true)}>
                  <FaUsers /> <span>New group</span>
                </Button>
                {chatRoom?.type === 'group' && (
                  <Button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => setShowChatOffcanvas(true)}
                  >
                    Add User to Group
                  </Button>
                )}
              </div>
            </div>
            <div className={styles.chatContent}>
              {chatRoom ? (
                <ChatWindow
                  messages={messages}
                  onMessageSent={handleSendMessage}
                  sender_Id={activeSenderId}
                  senderAliases={senderAliases}
                />
              ) : (
                <div className={styles.emptyConversation}>
                  <div className={styles.emptyIcon}><FaComments /></div>
                  <h2>Your conversations</h2>
                  <p>Select a conversation from the sidebar, or start a new chat with someone on your team.</p>
                  <Button className={styles.primaryAction} onClick={() => setShowSingleChatOffcanvas(true)}>
                    <FaUserPlus /> Start a conversation
                  </Button>
                </div>
              )}
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
        userId={session?.user?.id}
      />
      <RenderUserOffcanvas
        show={showSingleChatOffcanvas}
        handleClose={() => setShowSingleChatOffcanvas(false)}
        currentUserId={session?.user?.id}
        currentUserChatId={currentChatUser?.uid}
        firstname={session?.user?.first_name}
        handleCreateDirectChat={handleCreateDirectChat}
      />
      <Modal show={show} onHide={() => setShow(false)} centered contentClassName={styles.groupModal}>
        <Modal.Header closeButton className={styles.groupModalHeader}>
          <div>
            <span className={styles.eyebrow}>New conversation</span>
            <Modal.Title>Create a group</Modal.Title>
            <p>Bring your team together in one shared conversation.</p>
          </div>
        </Modal.Header>
        <Modal.Body className={styles.groupModalBody}>
          <Form>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Group name</Form.Label>
              <Form.Control
                type="text"
                value={roomName}
                placeholder="e.g. Installation team"
                autoFocus
                maxLength={50}
                onChange={(e) => handleNewRoomChange(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className={styles.groupModalFooter}>
          <Button className={styles.secondaryAction} onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button
            className={styles.primaryAction}
            disabled={!roomName.trim().length}
            onClick={handleCreateGroup}
          >
            Create group
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RenderChat;
