/**
 * Chat Page Component
 * Main chat interface with contacts list and chat window
 * Handles Socket.IO connection, message sending/receiving, and user search
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';  // Authentication context
import { useToast } from '../context/ToastContext';  // Toast notifications
import io from 'socket.io-client';                  // Socket.IO client for real-time communication
import api from '../utils/axiosConfig';            // HTTP client for API calls with token handling
import ChatWindow from '../components/ChatWindow';  // Chat window component
import ContactsList from '../components/ContactsList';  // Contacts list component
import './Chat.css';

const Chat = () => {
  // Get current user and logout function from auth context
  const { user, logout } = useAuth();
  const toast = useToast();  // Toast notification system
  
  // ========== STATE MANAGEMENT ==========
  const [socket, setSocket] = useState(null);              // Socket.IO connection instance
  const [contacts, setContacts] = useState([]);            // List of all users (contacts)
  const [groups, setGroups] = useState([]);                 // List of groups
  const [selectedContact, setSelectedContact] = useState(null);  // Currently selected contact to chat with
  const [selectedGroup, setSelectedGroup] = useState(null);     // Currently selected group
  const [currentRoomId, setCurrentRoomId] = useState(null);      // Current chat room ID
  const [messages, setMessages] = useState([]);            // Messages in current chat
  const [searchEmail, setSearchEmail] = useState('');     // Email input for user search
  const [isSearching, setIsSearching] = useState(false);   // Loading state for search
  const [showCreateGroup, setShowCreateGroup] = useState(false);  // Show create group modal
  const [groupName, setGroupName] = useState('');          // Group name input
  const [groupDescription, setGroupDescription] = useState('');  // Group description
  const [selectedMembers, setSelectedMembers] = useState([]);     // Selected members for group
  const [showAddMember, setShowAddMember] = useState(false);     // Show add member modal
  const [memberEmail, setMemberEmail] = useState('');            // Email input for adding member

  // ========== SOCKET.IO CONNECTION SETUP ==========
  // This effect runs once when component mounts
  useEffect(() => {
    // Get JWT token from localStorage (set during login)
    const token = localStorage.getItem('token');
    
    // Initialize Socket.IO connection to backend server
    // Pass token in auth object for authentication
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      auth: { token }  // Send token for socket authentication
    });

    // Handle successful connection
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    // Handle connection errors
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Store socket instance in state
    setSocket(newSocket);

    // Fetch list of all users (contacts) and groups when component loads
    fetchContacts();
    fetchGroups();

    // Cleanup: Close socket connection when component unmounts
    return () => {
      newSocket.close();
    };
  }, []);  // Empty dependency array = run only once on mount

  // ========== SOCKET EVENT LISTENERS ==========
  // This effect sets up listeners for real-time events
  useEffect(() => {
    // Don't set up listeners if socket is not connected
    if (!socket) return;

    // ========== LISTEN FOR NEW MESSAGES ==========
    // When a new message is received from server
    socket.on('new_message', (message) => {
      // Only add message if it belongs to current room
      if (message.roomId === currentRoomId) {
        // Add new message to messages array
        setMessages(prev => [...prev, message]);
      }
    });

    // ========== LISTEN FOR ROOM JOIN CONFIRMATION ==========
    // When successfully joined a chat room
    socket.on('room_joined', (data) => {
      // Update current room ID and selected contact
      setCurrentRoomId(data.roomId);
      setSelectedContact(data.otherUser);
      setSelectedGroup(null);
      
      // Fetch message history for this room
      fetchMessages(data.roomId);
    });

    // ========== LISTEN FOR GROUP JOIN CONFIRMATION ==========
    // When successfully joined a group
    socket.on('group_joined', (data) => {
      // Update current room ID
      setCurrentRoomId(data.roomId);
      setSelectedContact(null);
      
      // Find and set the selected group
      const group = groups.find(g => (g.id || g._id) === data.group?.id);
      if (group) {
        setSelectedGroup(group);
      }
      
      // Fetch message history for this room
      fetchMessages(data.roomId);
    });

    // Cleanup: Remove event listeners when component unmounts or dependencies change
    return () => {
      socket.off('new_message');   // Remove message listener
      socket.off('room_joined');   // Remove room joined listener
      socket.off('group_joined');  // Remove group joined listener
    };
  }, [socket, currentRoomId, groups]);  // Re-run when socket, room, or groups change

  // ========== FETCH CONTACTS ==========
  // Get list of all users from backend
  const fetchContacts = async () => {
    try {
      const response = await api.get('/api/user/all');
      setContacts(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setContacts([]);
    }
  };

  // ========== FETCH GROUPS ==========
  // Get list of all groups for current user
  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/group/my-groups');
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    }
  };

  // ========== FETCH MESSAGES ==========
  // Get message history for a specific room
  const fetchMessages = async (roomId) => {
    try {
      const response = await api.get(`/api/chat/messages/${roomId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // ========== SEARCH USER BY EMAIL ==========
  // Search for a user by email and start a chat with them
  const handleSearchUser = async () => {
    // Don't search if input is empty
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    try {
      // Verify user exists in database
      const response = await api.get(`/api/user/verify/${searchEmail}`);
      const otherUser = response.data.user;

      // ========== GENERATE ROOM ID ==========
      // Create unique room ID by sorting emails alphabetically
      // This ensures same room ID regardless of who initiates chat
      // Example: user1@email.com + user2@email.com = room_user1@email.com_user2@email.com
      const generateRoomId = (email1, email2) => {
        const sorted = [email1.toLowerCase(), email2.toLowerCase()].sort();
        return `room_${sorted[0]}_${sorted[1]}`;
      };

      const roomId = generateRoomId(user.email, otherUser.email);

      // ========== JOIN ROOM VIA SOCKET ==========
      // Emit socket event to join the chat room
      socket.emit('join_room', { otherUserEmail: otherUser.email });

      // Update state with selected contact and room ID
      setSelectedContact(otherUser);
      setCurrentRoomId(roomId);
      setSearchEmail('');  // Clear search input
    } catch (error) {
      // Show error if user not found
      toast.error(error.response?.data?.error || 'User not found');
    } finally {
      setIsSearching(false);  // Reset loading state
    }
  };

  // ========== CREATE GROUP ==========
  // Create a new group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.warning('Group name is required');
      return;
    }

    try {
      const response = await api.post('/api/group/create', {
        name: groupName,
        description: groupDescription,
        memberIds: selectedMembers.map(m => m.id || m._id)
      });

      // Refresh groups list
      await fetchGroups();
      
      // Close modal and reset form
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers([]);
      
      // Select the newly created group
      const newGroup = response.data.group;
      setSelectedGroup(newGroup);
      setSelectedContact(null);
      const roomId = `group_${newGroup.id || newGroup._id}`;
      setCurrentRoomId(roomId);
      socket.emit('join_group', { groupId: newGroup.id || newGroup._id });
      fetchMessages(roomId);
      toast.success('Group created successfully!');
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error(error.response?.data?.error || 'Failed to create group');
    }
  };

  // ========== SELECT GROUP ==========
  // Select a group to chat with
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedContact(null);
    const roomId = `group_${group.id || group._id}`;
    setCurrentRoomId(roomId);
    socket.emit('join_group', { groupId: group.id || group._id });
    fetchMessages(roomId);
  };

  // ========== ADD MEMBER TO GROUP BY EMAIL ==========
  // Add a member to the selected group by email
  const handleAddMemberByEmail = async () => {
    if (!memberEmail.trim()) {
      toast.warning('Email is required');
      return;
    }

    if (!selectedGroup) {
      toast.warning('Please select a group first');
      return;
    }

    try {
      const response = await api.post(
        `/api/group/${selectedGroup.id || selectedGroup._id}/add-member-by-email`,
        { email: memberEmail }
      );

      // Update selected group with new member
      setSelectedGroup(response.data.group);
      
      // Refresh groups list
      await fetchGroups();
      
      // Close modal and reset
      setShowAddMember(false);
      setMemberEmail('');
      toast.success('Member added successfully!');
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error(error.response?.data?.error || 'Failed to add member');
    }
  };

  // ========== SEND MESSAGE ==========
  // Send a message through Socket.IO
  const handleSendMessage = (message, messageType = 'text', mediaUrl = '') => {
    // Validate: socket connected, room selected, and message/media provided
    if (!socket || !currentRoomId || (!message.trim() && !mediaUrl)) return;

    if (selectedGroup) {
      // Send group message
      socket.emit('send_group_message', {
        groupId: selectedGroup.id || selectedGroup._id,
        message: message || '',
        messageType,
        mediaUrl,
        roomId: currentRoomId
      });
    } else {
      // Send personal message
      socket.emit('send_personal_message', {
        receiverId: selectedContact?.id || selectedContact?._id,  // ID of message recipient
        message: message || '',           // Message text (can be empty for media)
        messageType,                      // Type: 'text', 'image', 'video', 'file'
        mediaUrl,                         // URL if media message
        roomId: currentRoomId             // Current chat room ID
      });
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-header">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search user by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
            className="search-input"
          />
          <button 
            onClick={handleSearchUser} 
            className="search-btn"
            disabled={isSearching}
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>

        <div className="create-group-section">
          <button 
            onClick={() => setShowCreateGroup(true)}
            className="create-group-btn"
          >
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>+</span>
            <span>Create Group</span>
          </button>
        </div>

        <ContactsList
          contacts={contacts}
          groups={groups}
          selectedContact={selectedContact}
          selectedGroup={selectedGroup}
          onSelectContact={(contact) => {
            const generateRoomId = (email1, email2) => {
              const sorted = [email1.toLowerCase(), email2.toLowerCase()].sort();
              return `room_${sorted[0]}_${sorted[1]}`;
            };
            const roomId = generateRoomId(user.email, contact.email);
            socket.emit('join_room', { otherUserEmail: contact.email });
            setSelectedContact(contact);
            setSelectedGroup(null);
            setCurrentRoomId(roomId);
            fetchMessages(roomId);
          }}
          onSelectGroup={handleSelectGroup}
        />

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="modal-overlay" onClick={() => setShowCreateGroup(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Create New Group</h2>
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description (optional)"
                  className="form-input"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Add Members</label>
                <div className="members-list">
                  {contacts.map(contact => {
                    const isSelected = selectedMembers.some(m => (m.id || m._id) === (contact.id || contact._id));
                    return (
                      <div
                        key={contact.id || contact._id}
                        className={`member-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMembers(selectedMembers.filter(m => (m.id || m._id) !== (contact.id || contact._id)));
                          } else {
                            setSelectedMembers([...selectedMembers, contact]);
                          }
                        }}
                      >
                        <div className="member-avatar">
                          {contact.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="member-info">
                          <h4>{contact.name}</h4>
                          <p>{contact.email}</p>
                        </div>
                        {isSelected && <span className="checkmark">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowCreateGroup(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleCreateGroup} className="create-btn">
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-main">
        {selectedContact || selectedGroup ? (
          <>
            <ChatWindow
              contact={selectedContact}
              group={selectedGroup}
              messages={messages}
              currentUser={user}
              onSendMessage={handleSendMessage}
              socket={socket}
            />
            {selectedGroup && (
              <div className="group-actions">
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="add-member-btn"
                >
                  + Add Member
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-content">
              <h2>Select a contact or group to start chatting</h2>
              <p>Search for a user by email, select from your contacts, or create a group</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Member to Group</h2>
            <div className="form-group">
              <label>User Email *</label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Enter user email"
                className="form-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddMemberByEmail()}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddMember(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleAddMemberByEmail} className="create-btn">
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
