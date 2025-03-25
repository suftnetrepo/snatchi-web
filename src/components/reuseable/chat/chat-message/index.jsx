import React from "react";
import classnames from "classnames";
import "./chat-message.scss";

const ChatMessage = ({ dateTimeStamp, text, isSameOrigin , message}) => {

  // console.log("..........................isSameOrigin", message)
  return (
    <div
      className={classnames("chat-message", {
        "is-same-origin": isSameOrigin
      })}
    >
      <div className="chat-message__item__timestamp">{dateTimeStamp}</div>
      <div className="chat-message__item">
        <span className="chat-message__item__text">{text}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
