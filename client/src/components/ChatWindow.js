/**
 * ChatWindow Component
 * Displays the chat interface with messages, AI suggestions, and message input
 * Handles message display, smart replies, and predictive typing
 */

import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/axiosConfig';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const ChatWindow = ({ contact, group, messages, currentUser, onSendMessage, socket }) => {
  // ========== REFS ==========
  // Reference to the bottom of messages list (for auto-scrolling)
  const messagesEndRef = useRef(null);
  
  // ========== STATE ==========
  const [predictiveSuggestions, setPredictiveSuggestions] = useState([]);  // AI typing suggestions
  const [smartReplies, setSmartReplies] = useState([]);                   // AI smart reply suggestions
  const [typingTimeout, setTypingTimeout] = useState(null);                // Timeout for typing detection

  // ========== AUTO-SCROLL TO BOTTOM ==========
  // Scroll to bottom whenever new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ========== FETCH SMART REPLIES ==========
  // Get AI-powered smart replies when receiving a new message
  useEffect(() => {
    // Only fetch if there are messages and last message is from other user
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Check if message is from other user (not current user) and is text type
      const lastSenderId = lastMessage.senderId?._id || lastMessage.senderId?.id || lastMessage.senderId;
      if (lastSenderId !== currentUser?.id && lastMessage.messageType === 'text') {
        fetchSmartReplies(lastMessage.message);
      }
    }
  }, [messages]);

  // ========== SCROLL TO BOTTOM FUNCTION ==========
  // Smoothly scrolls to the bottom of the messages list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ========== FETCH SMART REPLIES ==========
  // Get AI-generated quick reply suggestions for incoming messages
  const fetchSmartReplies = async (message) => {
    try {
          const response = await api.post('/api/ai/smart-replies', {
        incomingMessage: message,  // The message to reply to
        // Send last 5 messages as context for better suggestions
        conversationHistory: messages.slice(-5).map(m => ({
          sender: m.senderId?._id === currentUser?.id ? 'You' : contact?.name,
          message: m.message
        }))
      });
      setSmartReplies(response.data.replies || []);
    } catch (error) {
      console.error('Failed to fetch smart replies:', error);
    }
  };

  // ========== HANDLE TYPING ==========
  // Detects when user is typing and fetches predictive suggestions
  const handleTyping = async (text) => {
    // Clear previous timeout to avoid multiple API calls
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Wait 500ms after user stops typing before fetching suggestions
    // This prevents too many API calls while user is actively typing
    const timeout = setTimeout(async () => {
      // Only fetch suggestions if message is longer than 2 characters
      if (text.trim().length > 2) {
        try {
          const response = await api.post('/api/ai/predictive-typing', {
            partialMessage: text,  // What user has typed so far
            // Send last 5 messages as context
            conversationHistory: messages.slice(-5).map(m => {
              const senderName = m.senderId?._id === currentUser?.id || m.senderId?.id === currentUser?.id 
                ? 'You' 
                : (m.senderId?.name || contact?.name || group?.name || 'User');
              return { sender: senderName, message: m.message };
            })
          });
          setPredictiveSuggestions(response.data.suggestions || []);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        }
      } else {
        // Clear suggestions if message is too short
        setPredictiveSuggestions([]);
      }
    }, 500);  // 500ms delay

    setTypingTimeout(timeout);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="contact-header-info">
          <div className="contact-header-avatar">
            {group ? group.name?.charAt(0).toUpperCase() : contact?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>{group ? group.name : contact?.name}</h3>
            <p>{group ? `${group.members?.length || 0} members` : contact?.email}</p>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const senderId = message.senderId?._id || message.senderId?.id || message.senderId;
            const isOwn = senderId === currentUser?.id;
            
            const senderName = message.senderId?.name || (isOwn ? 'You' : 'User');
            
            return (
              <div key={message._id || message.id} className={`message ${isOwn ? 'own' : 'other'}`}>
                {group && !isOwn && (
                  <div className="message-sender-name">{senderName}</div>
                )}
                <div className="message-content">
                  {message.messageType === 'image' && message.mediaUrl ? (
                    <img src={message.mediaUrl} alt="Shared" className="message-image" />
                  ) : message.messageType === 'video' && message.mediaUrl ? (
                    <video src={message.mediaUrl} controls className="message-video" />
                  ) : message.messageType === 'file' && message.mediaUrl ? (
                    <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer" className="message-file">
                      📎 File
                    </a>
                  ) : null}
                  {message.message && (
                    <p>{message.message}</p>
                  )}
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {smartReplies.length > 0 && (
        <div className="smart-replies">
          {smartReplies.map((reply, index) => (
            <button
              key={index}
              className="smart-reply-btn"
              onClick={() => {
                onSendMessage(reply);
                setSmartReplies([]);
              }}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {predictiveSuggestions.length > 0 && (
        <div className="predictive-suggestions">
          {predictiveSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-btn"
              onClick={() => {
                // This would need to be handled by MessageInput component
                setPredictiveSuggestions([]);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={handleTyping}
        suggestions={predictiveSuggestions}
        onSuggestionClick={(suggestion) => {
          setPredictiveSuggestions([]);
        }}
      />
    </div>
  );
};

export default ChatWindow;
