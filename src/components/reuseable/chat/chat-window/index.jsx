import React, { useRef, useState, useEffect, useCallback } from 'react';
import ChatMessage from '../chat-message';
import './chat-window.scss';
import { convertTimestampToDate } from '@/utils/helpers';

const ChatWindow = ({ messages, onMessageSent, sender_Id }) => {
  const chatWindow = useRef();
  const chatWindowBody = useRef();
  const userInput = useRef();
  const [message, setMessage] = useState('');

  const handleChange = useCallback((e) => {
    setMessage(e.target.value);
  }, []);

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && text.length) {
      e.preventDefault();
      onMessageSent(message);
      setMessage('');
    }
  };

  const handleSubmit = useCallback(() => {
    if (message.trim()) {
      onMessageSent(message);
      setMessage('');
    }
  }, [message, onMessageSent]);

  const autExpandInput = useCallback(() => {
    const _userInput = userInput.current;
    if (_userInput) {
      _userInput.style.height = 'auto';
      _userInput.style.height = `${_userInput.scrollHeight}px`;
    }
  }, []);

  const setChatWindowScrollPosition = useCallback(() => {
    const _chatWindowBody = chatWindowBody.current;
    if (_chatWindowBody) {
      _chatWindowBody.scrollTop = _chatWindowBody.scrollHeight;
    }
  }, []);

  useEffect(() => {
    setChatWindowScrollPosition;
  }, [messages, setChatWindowScrollPosition]);

  useEffect(() => {
    autExpandInput();
  }, [message, autExpandInput]);

  return (
    <div ref={chatWindow} className='chat-panel__body'>
      <div ref={chatWindowBody} className="messages-scroll-container">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            text={message.text}
            dateTimeStamp={convertTimestampToDate(message.timestamp)}
            isSameOrigin={message.senderId === sender_Id}
            message={message}
          />
        ))}
      </div>
      <div className="chat-panel__footer chat-input-container">
        <textarea
          ref={userInput}
          className="chat-panel__input chat-input"
          rows="1"
          placeholder="Enter your message..."
          value={message}
          onChange={handleChange}
        />
        <button
          className="chat-panel__send-btn"
          type="button"
          onKeyDown={(e) => handleKeyDown(e)}
          onClick={handleSubmit}
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
