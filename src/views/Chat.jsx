import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Send, Users, X, User } from 'lucide-react';
import './Chat.css';
import api from '../api';
import { useAuth } from '../context/AuthContext'; // Import useAuth to get current user

const Chat = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    is_group: false,
    participant_user_ids: []
  });
  const [messageInput, setMessageInput] = useState('');
  const [users, setUsers] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true); // New state for mobile sidebar toggle
  const messagesEndRef = useRef(null); // For auto-scrolling to bottom

  const navigate = useNavigate();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRoom?.messages]);

  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/chat/rooms');
      setRooms(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users/');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/chat/rooms', newRoomData);
      setShowRoomModal(false);
      setNewRoomData({
        name: '',
        is_group: false,
        participant_user_ids: []
      });
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectRoom = async (roomId) => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}`);
      setSelectedRoom(response.data);
      setShowSidebar(false); // Hide sidebar when room is selected on mobile
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedRoom) return;
    
    try {
      await api.post(`/chat/rooms/${selectedRoom.id}/messages`, {
        chat_room_id: selectedRoom.id,
        content: messageInput.trim()
      });
      setMessageInput('');
      fetchRooms(); // Refresh to get updated messages
      handleSelectRoom(selectedRoom.id); // Refresh selected room
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="chat-container">
      <div className={`chat-sidebar ${!showSidebar ? 'hidden-mobile' : ''}`}>
        <div className="chat-sidebar-header">
          <h2>
            <MessageSquare size={24} />
            Chat
          </h2>
          <button onClick={() => setShowRoomModal(true)}>
            <Plus size={20} />
          </button>
        </div>
        <div className="chat-rooms-list">
          {loading ? (
            <div className="loading-spinner">Chargement...</div>
          ) : rooms.length === 0 ? (
            <p className="empty-message">Aucun salon de chat</p>
          ) : (
            rooms.map(room => (
              <div
                key={room.id}
                className={`chat-room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                onClick={() => handleSelectRoom(room.id)}
              >
                <div className="room-avatar">
                  {getInitials(room.name)}
                </div>
                <div className="room-info">
                  <h4>{room.name}</h4>
                  <p className="room-type">
                    {room.is_group ? `Groupe • ${room.participants?.length || 0} participants` : 'Individuel'}
                  </p>
                  {room.messages && room.messages.length > 0 && (
                    <p className="room-preview">
                      {room.messages[room.messages.length - 1]?.content}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedRoom ? (
          <>
            <div className="chat-room-header">
              <button 
                className="back-to-sidebar-btn" 
                onClick={() => setShowSidebar(true)}
              >
                <X size={20} />
              </button>
              <div className="room-avatar">
                {getInitials(selectedRoom.name)}
              </div>
              <div className="room-header-info">
                <h2>{selectedRoom.name}</h2>
                <p className="room-meta">
                  Créé par: {selectedRoom.created_by_name}
                </p>
              </div>
            </div>
            <div className="chat-messages">
              {selectedRoom.messages && selectedRoom.messages.length === 0 ? (
                <div className="empty-messages">
                  <MessageSquare size={56} />
                  <p>Aucun message. Envoyez le premier message !</p>
                </div>
              ) : (
                selectedRoom.messages?.map(msg => {
                  const isMyMessage = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`chat-message ${isMyMessage ? 'own-message' : ''}`}>
                      <div className="message-avatar">
                        {getInitials(msg.sender_name)}
                      </div>
                      <div className="message-wrapper">
                        <div className="message-sender">
                          <span>{msg.sender_name}</span>
                          <span className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="message-content">{msg.content}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Écrivez votre message..."
              />
              <button type="submit" className="send-btn" disabled={!messageInput.trim()}>
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="no-room-selected">
            <MessageSquare size={80} />
            <h2>Sélectionnez un salon de chat</h2>
            <p>Choisissez un salon dans la barre latérale ou créez un nouveau</p>
          </div>
        )}
      </div>

      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouveau Salon de Chat</h2>
              <button className="modal-close-btn" onClick={() => setShowRoomModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateRoom}>
                <div className="form-group">
                  <label>
                    <User size={18} />
                    Nom du salon
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Discussion Trading"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newRoomData.is_group}
                      onChange={(e) => setNewRoomData({ ...newRoomData, is_group: e.target.checked })}
                    />
                    <Users size={18} style={{ marginRight: '0.5rem' }} />
                    <span>Salon de groupe</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <Users size={18} />
                    Participants
                  </label>
                  <select
                    multiple
                    value={newRoomData.participant_user_ids}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setNewRoomData({ ...newRoomData, participant_user_ids: selectedIds });
                    }}
                  >
                    {users.map(userOption => (
                      <option key={userOption.id} value={userOption.id}>
                        {userOption.full_name || userOption.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowRoomModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
