import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Plus, Edit2, Trash2, X, Type, AlignLeft } from 'lucide-react';
import './PrivateCalendar.css';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const PrivateCalendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    is_group: false,
    participant_user_ids: []
  });

  const fetchEvents = async () => {
    try {
      const response = await api.get('/private-calendar/events');
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users/');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await api.put(`/private-calendar/events/${editingEvent.id}`, formData);
      } else {
        await api.post('/private-calendar/events', formData);
      }
      setShowModal(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time,
      is_group: event.is_group,
      participant_user_ids: event.participants?.map(p => p.user_id) || []
    });
    setShowModal(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      try {
        await api.delete(`/private-calendar/events/${eventId}`);
        fetchEvents();
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      is_group: false,
      participant_user_ids: []
    });
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="private-calendar-container">
      <div className="private-calendar-header">
        <h1>Calendrier Privé</h1>
        {user?.role === "admin" && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} style={{ marginRight: '0.5rem' }} />
            Nouvel Événement
          </button>
        )}
      </div>

      <div className="events-grid">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <div className="event-header">
              <h3>{event.title}</h3>
              {user?.role === "admin" && (
                <div className="event-actions">
                  <button onClick={() => handleEdit(event)}>
                    <Edit2 size={16} style={{ marginRight: '0.25rem' }} />
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(event.id)}>
                    <Trash2 size={16} style={{ marginRight: '0.25rem' }} />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
            {event.description && <p className="event-description">{event.description}</p>}
            <div className="event-time">
              <span>📅 {formatDateTime(event.start_time)}</span>
              <span>⏰ {formatDateTime(event.end_time)}</span>
            </div>
            <div className="event-meta">
              <span>Type: {event.is_group ? 'Groupe' : 'Individuel'}</span>
              <span>Créé par: {event.created_by_name}</span>
            </div>
            {event.participants && event.participants.length > 0 && (
              <div className="event-participants">
                Participants: {event.participants.map(p => p.user_name).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingEvent ? 'Modifier l\'Événement' : 'Nouvel Événement'}
              </h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>
                    <Type size={18} />
                    Titre
                    <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Titre de l'événement"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <AlignLeft size={18} />
                    Description
                  </label>
                  <textarea
                    placeholder="Description de l'événement"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <Calendar size={18} />
                      Début
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <Clock size={18} />
                      Fin
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_group}
                      onChange={(e) => setFormData({ ...formData, is_group: e.target.checked })}
                    />
                    <Users size={18} style={{ marginRight: '0.5rem' }} />
                    <span>Événement de groupe</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <Users size={18} />
                    Participants
                  </label>
                  <div className="participants-container">
                    {users.map(userOption => (
                      <label 
                        key={userOption.id} 
                        className="participant-label"
                      >
                        <input
                          type="checkbox"
                          checked={formData.participant_user_ids.includes(userOption.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            let newParticipantIds;
                            if (isChecked) {
                              newParticipantIds = [...formData.participant_user_ids, userOption.id];
                            } else {
                              newParticipantIds = formData.participant_user_ids.filter(id => id !== userOption.id);
                            }
                            setFormData({ ...formData, participant_user_ids: newParticipantIds });
                          }}
                        />
                        <div className="participant-avatar">
                          {getInitials(userOption.full_name || userOption.email)}
                        </div>
                        <div className="participant-info">
                          <span className="participant-name">
                            {userOption.full_name || userOption.email}
                          </span>
                          {userOption.full_name && (
                            <span className="participant-email">
                              {userOption.email}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingEvent ? 'Mettre à jour' : 'Créer'}
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

export default PrivateCalendar;
