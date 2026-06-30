import React, { useState, useEffect } from 'react';
import { livesApi } from '../api';
import { formatError } from '../utils/errorUtils';
import './Lives.css';

const Lives = () => {
  const [isLiveNow, setIsLiveNow] = useState(false);
  const [currentViewers] = useState(247);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentLive, setCurrentLive] = useState(null);
  const [upcomingLives, setUpcomingLives] = useState([]);
  const [archivedLives, setArchivedLives] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchive, setSelectedArchive] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [livesRes, archivedRes, calendarRes] = await Promise.all([
          livesApi.getLives(),
          livesApi.getArchivedLives(),
          livesApi.getCalendar()
        ]);
        
        const activeLives = livesRes.data.filter(l => l.is_active && !l.is_archived);
        setUpcomingLives(activeLives);
        
        // Simuler un live en cours s'il y en a un très proche
        if (activeLives.length > 0) {
          setCurrentLive(activeLives[0]);
          setIsLiveNow(true);
        }
        
        setArchivedLives(archivedRes.data);
        setCalendarEvents(calendarRes.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d);
  };

  const getDay = (date) => {
    if (!date) return "";
    return new Date(date).getDate();
  };

  const getMonth = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d);
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const shortNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        name: dayNames[i],
        shortName: shortNames[i],
        date: date.getDate(),
        fullDate: date
      });
    }
    return days;
  };

  const previousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const formatWeekRange = () => {
    const days = getWeekDays();
    const start = days[0].fullDate;
    const end = days[6].fullDate;
    return `${start.getDate()} au ${end.getDate()} ${new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(end)}`;
  };

  // Function to generate Google Calendar event URL
  const getGoogleCalendarUrl = (live) => {
    const start = new Date(live.start_time);
    // Assume duration is 1 hour if not specified
    const end = new Date(start.getTime() + (live.duration || 60) * 60000);
    
    const formatDateTime = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: live.title,
      details: live.description || 'Session live de trading avec Evolution Trading Academy',
      location: live.google_meet_link || '',
      dates: `${formatDateTime(start)}/${formatDateTime(end)}`,
      trp: 'true', // Reminder
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Handle reminder click - open Google Calendar
  const handleReminderClick = (live) => {
    const calendarUrl = getGoogleCalendarUrl(live);
    window.open(calendarUrl, '_blank');
  };

  if (loading) {
    return <div className="lives-loading">Chargement...</div>;
  }

  return (
    <div className="lives">
      <section className="page-header">
        <div className="container">
          <h1 className="page-title italic font-black">SESSIONS LIVE</h1>
          <p className="page-description">
            Rejoignez nos sessions live pour analyser les marchés en temps réel avec nos experts
          </p>
        </div>
      </section>

      <section className="live-status-section">
        <div className="container">
          {isLiveNow && (
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span className="live-text">EN DIRECT</span>
              <span className="live-viewers">{currentViewers} spectateurs</span>
            </div>
          )}
          
          {currentLive ? (
            <div className="current-live">
              <div className="live-video">
                <div className="video-placeholder">
                  <div className="play-button">▶</div>
                  <span className="live-badge">LIVE</span>
                </div>
              </div>
              <div className="live-info">
                <h2>{currentLive.title}</h2>
                <p className="live-host">
                  <span className="host-avatar">👤</span>
                  Expert Trading
                </p>
                <p className="live-description">{currentLive.description}</p>
                <div className="live-actions">
                  <a 
                    href={currentLive.google_meet_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Rejoindre le Live
                  </a>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleReminderClick(currentLive)}
                  >
                    Ajouter au Calendrier
                  </button>
                </div>
                <div className="live-schedule">
                  <span className="schedule-item">📅 {formatDate(currentLive.start_time)}</span>
                  <span className="schedule-item">⏰ {new Date(currentLive.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-live-message">
              <h3>Aucune session en direct pour le moment</h3>
              <p>Consultez les prochains rendez-vous ci-dessous</p>
            </div>
          )}
        </div>
      </section>

      <section className="upcoming-section">
        <div className="container">
          <h2 className="section-title italic font-black uppercase tracking-tighter">Prochains Lives</h2>
          <div className="lives-grid">
            {upcomingLives.length > 0 ? upcomingLives.map(live => (
              <div key={live.id} className="live-card">
                <div className="live-card-header">
                  <div className="live-date">
                    <div className="date-day">{getDay(live.start_time)}</div>
                    <div className="date-month">{getMonth(live.start_time)}</div>
                  </div>
                  <div className="live-time">
                    {new Date(live.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="live-card-content">
                  <h3 className="live-title">{live.title}</h3>
                  <p className="live-host">👤 Expert Trading</p>
                  <p className="live-description">{live.description}</p>
                  <div className="live-card-actions">
                    <a 
                      href={live.google_meet_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      S'inscrire
                    </a>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleReminderClick(live)}
                    >
                      Ajouter au Calendrier
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-zinc-500 italic">Aucun live programmé prochainement.</p>
            )}
          </div>
        </div>
      </section>

      <section className="calendar-section">
        <div className="container">
          <h2 className="section-title italic font-black uppercase tracking-tighter">Calendrier Hebdomadaire</h2>
          <div className="calendar-container">
            <div className="calendar-header">
              <button className="calendar-nav" onClick={previousWeek}>‹</button>
              <h3 className="calendar-title">Semaine du {formatWeekRange()}</h3>
              <button className="calendar-nav" onClick={nextWeek}>›</button>
            </div>
            <div className="calendar-grid">
              {getWeekDays().map(day => (
                <div className="calendar-day" key={day.date}>
                  <div className="day-header">
                    <div className="day-name">{day.shortName}</div>
                    <div className="day-date">{day.date}</div>
                  </div>
                  <div className="day-events">
                    {calendarEvents
                      .filter(event => event.day === day.name)
                      .map((event, idx) => (
                        <div key={idx} className={`calendar-event ${event.category?.toLowerCase() || ''}`}>
                          <div className="event-time">{event.time}</div>
                          <div className="event-title">{event.title}</div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="archives-section">
        <div className="container">
          <h2 className="section-title italic font-black uppercase tracking-tighter">Archives & Replays</h2>
          <div className="archives-grid">
            {archivedLives.length > 0 ? archivedLives.map(archive => {
              // Calculate duration from start and end time
              let duration = "1h";
              if (archive.start_time && archive.end_time) {
                const start = new Date(archive.start_time);
                const end = new Date(archive.end_time);
                const diffMs = end - start;
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                if (diffHrs > 0 && diffMins > 0) {
                  duration = `${diffHrs}h ${diffMins}m`;
                } else if (diffHrs > 0) {
                  duration = `${diffHrs}h`;
                } else {
                  duration = `${diffMins}m`;
                }
              }

              return (
                <div key={archive.id} className="archive-card" onClick={() => archive.replay_url && setSelectedArchive(archive)} style={{ cursor: archive.replay_url ? 'pointer' : 'default' }}>
                  <div className="archive-thumbnail">
                    {archive.thumbnail_url ? (
                      <img 
                        src={archive.thumbnail_url} 
                        alt={archive.title} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="archive-placeholder" style={{ display: archive.thumbnail_url ? 'none' : 'flex' }}>
                      <span>📹 REPLAY</span>
                    </div>
                    {archive.replay_url && (
                      <div className="archive-play-overlay">
                        <span className="play-icon">▶</span>
                      </div>
                    )}
                    <span className="archive-duration">{duration}</span>
                  </div>
                  <div className="archive-content">
                    <h3>{archive.title}</h3>
                    <div className="archive-meta">
                      <span>👤 Expert Trading</span>
                      <span>📅 {formatDate(archive.start_time)}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-zinc-500 italic">Aucun replay disponible pour le moment.</p>
            )}
          </div>
        </div>
      </section>

      {/* Video Player Modal */}
      {selectedArchive && (
        <div className="video-modal-overlay" onClick={() => setSelectedArchive(null)}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setSelectedArchive(null)}>×</button>
            <h2 className="video-modal-title">{selectedArchive.title}</h2>
            <video controls className="video-modal-player" src={selectedArchive.replay_url} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Lives;
