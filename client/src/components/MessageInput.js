import React, { useState, useRef } from 'react';
import api from '../utils/axiosConfig';
import { useToast } from '../context/ToastContext';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, onTyping, suggestions, onSuggestionClick }) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim(), 'text');
      setMessage('');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const messageType = response.data.type;
      const mediaUrl = response.data.url;
      const messageText = message.trim() || `Shared ${messageType === 'image' ? 'an image' : messageType === 'video' ? 'a video' : 'a file'}`;

      onSendMessage(messageText, messageType, mediaUrl);
      setMessage('');
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details || 
                          'Failed to upload file. Please check if AWS S3 is configured.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    if (onTyping) {
      onTyping(value);
    }
  };

  return (
    <div className="message-input-container">
      {suggestions.length > 0 && (
        <div className="suggestions-bar">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-chip"
              onClick={() => {
                setMessage(prev => prev + ' ' + suggestion);
                if (onSuggestionClick) {
                  onSuggestionClick(suggestion);
                }
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-actions">
          <button
            type="button"
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            📎
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
        </div>

        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder="Type a message..."
          className="message-input"
          disabled={uploading}
        />

        <button
          type="submit"
          className="send-btn"
          disabled={(!message.trim() && !uploading) || uploading}
        >
          {uploading ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
