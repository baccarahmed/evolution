import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, livesApi, progressApi } from '../api';
import { formatError } from '../utils/errorUtils';
import './Dashboard.css';
import PrivateCalendar from './PrivateCalendar';
import './PrivateCalendar.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'profile', 'subscriptions', 'courses', 'calendar', 'archives'
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [archivedLives, setArchivedLives] = useState([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [formationProgress, setFormationProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState('');
  const [upcomingLives, setUpcomingLives] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      setPaymentStatus({ type: 'success', message: 'Félicitations ! Votre abonnement a été activé avec succès.' });
      setActiveView('subscriptions');
    } else if (payment === 'cancel') {
      setPaymentStatus({ type: 'error', message: 'Le paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.' });
    }
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setProgressLoading(true);
        setProgressError('');
        const [dashRes, calendarRes, progressRes, upcomingLivesRes] = await Promise.allSettled([
          authApi.getDashboard(),
          livesApi.getCalendar(),
          progressApi.getMyFormationProgress(),
          livesApi.getUpcomingLives()
        ]);

        if (dashRes.status !== 'fulfilled') {
          throw dashRes.reason;
        }

        setDashboardData(dashRes.value.data);
        setProfileData(dashRes.value.data.user);

        if (calendarRes.status === 'fulfilled') {
          setCalendarEvents(calendarRes.value.data);
        } else {
          setCalendarEvents([]);
        }
        
        if (upcomingLivesRes.status === 'fulfilled') {
          setUpcomingLives(upcomingLivesRes.value.data);
        } else {
          setUpcomingLives([]);
        }

        if (progressRes.status === 'fulfilled') {
          setFormationProgress(progressRes.value.data);
        } else {
          setFormationProgress([]);
          setProgressError("L'avancement des formations est temporairement indisponible.");
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
        setProgressLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchArchives = async () => {
      if (activeView === 'archives') {
        try {
          setArchivesLoading(true);
          const res = await livesApi.getArchivedLives();
          setArchivedLives(res.data);
        } catch (error) {
          console.error('Failed to fetch archived lives', error);
        } finally {
          setArchivesLoading(false);
        }
      }
    };
    fetchArchives();
  }, [activeView]);

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
    // Assume duration is 1 hour if end_time is not specified
    const end = live.end_time ? new Date(live.end_time) : new Date(start.getTime() + 60 * 60000);
    
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // Only send allowed fields for update
      const updatePayload = {
        full_name: profileData.full_name,
        email: profileData.email
      };
      await authApi.updateProfile(updatePayload);
      setIsEditingProfile(false);
      // Refresh data
      const response = await authApi.getDashboard();
      setDashboardData(response.data);
      alert("Profil mis à jour !");
    } catch (err) {
      alert("Erreur lors de la mise à jour : " + formatError(err));
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm("Voulez-vous vraiment annuler votre abonnement ?")) {
      try {
        await authApi.cancelSubscription();
        alert("Abonnement annulé");
        // Refresh
        const response = await authApi.getDashboard();
        setDashboardData(response.data);
      } catch (err) {
        alert("Erreur lors de l'annulation : " + formatError(err));
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  if (loading) {
    return <div className="dashboard flex items-center justify-center min-h-screen text-white">Chargement du tableau de bord...</div>;
  }

  if (!dashboardData) {
    return <div className="dashboard flex items-center justify-center min-h-screen text-white">Erreur lors du chargement des données.</div>;
  }

  const {
        user,
        stats,
        inProgressCourses = [],
        completedCourses = [],
        savedCourses = [],
        recentAchievements = [],
        recentActivities = [],
        learningPath = [],
        communityStats,
        leaderboard,
        subscription,
        paymentHistory = [],
        dailyActivity = []
      } = dashboardData;
  const createdAtDate = user?.created_at ? new Date(user.created_at) : null;
  const hasValidCreatedAt = createdAtDate && !Number.isNaN(createdAtDate.getTime());
  const subscriptionStatus = subscription?.status || (subscription?.is_active ? 'active' : subscription?.payment_status || 'inactive');
  const chartActivity = dashboardData.dailyActivity || dailyActivity || [];

  return (
    <div className="dashboard">
      <div className="container">
        <header className="learning-hub-header">
          <div className="header-titles">
            <span className="hub-subtitle">TRADEMASTER ACADEMY</span>
            <h1 className="hub-title">Learning Hub</h1>
            <p className="user-greeting">Bonjour, {user.full_name} !</p>
          </div>
          
          <div className="header-navigation">
            <div className="tab-switcher">
              {['overview', 'courses', 'archives', 'calendar', 'subscriptions', 'profile'].filter(view => {
                if (view === 'calendar') return subscription?.is_active;
                return true;
              }).map(view => (
                <button 
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`tab-pill ${activeView === view ? 'active' : ''}`}
                >
                  {view === 'overview' ? 'Aperçu' : 
                   view === 'profile' ? 'Profil' : 
                   view === 'subscriptions' ? 'Abonnement' : 
                   view === 'courses' ? 'Mes Cours' : 
                   view === 'archives' ? 'Archives' : 'Calendrier'}
                </button>
              ))}
            </div>
            <button onClick={logout} className="logout-btn">
              <span className="icon">🚪</span> Déconnexion
            </button>
          </div>
        </header>

        {paymentStatus && (
          <div className={`mb-8 p-4 rounded-2xl border ${
            paymentStatus.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          } flex justify-between items-center`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{paymentStatus.type === 'success' ? '✅' : '❌'}</span>
              <p className="font-bold">{paymentStatus.message}</p>
            </div>
            <button onClick={() => setPaymentStatus(null)} className="text-current opacity-50 hover:opacity-100">×</button>
          </div>
        )}

        {activeView === 'overview' && (
          <div className="dashboard-layout">
            <div className="main-content-area">
              {/* Stats Cards Grid */}
              <motion.div 
                className="stats-grid mb-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="stat-card stat-card-purple" variants={itemVariants}>
                  <div className="stat-info">
                    <div className="stat-label">Points Totaux</div>
                    <div className="stat-value">{user.total_points || 0}</div>
                  </div>
                  <div className="stat-right-col">
                    <div className="stat-icon-wrapper">💰</div>
                    <div className="stat-trend">Gagnez +20 par leçon</div>
                  </div>
                </motion.div>
                <motion.div className="stat-card stat-card-secondary" variants={itemVariants}>
                  <div className="stat-info">
                    <div className="stat-label">Streak Actuel</div>
                    <div className="stat-value">{user.current_streak || 0} jours</div>
                  </div>
                  <div className="stat-right-col">
                    <div className="stat-icon-wrapper">🔥</div>
                    <div className="stat-trend">Meilleur: {user.max_streak || 0} jours</div>
                  </div>
                </motion.div>
                <motion.div className="stat-card stat-card-success" variants={itemVariants}>
                  <div className="stat-info">
                    <div className="stat-label">Formations Complétées</div>
                    <div className="stat-value">{stats.formationsCompleted || 0}</div>
                  </div>
                  <div className="stat-right-col">
                    <div className="stat-icon-wrapper">✅</div>
                    <div className="stat-trend">+1 ce mois</div>
                  </div>
                </motion.div>
                <motion.div className="stat-card stat-card-warning" variants={itemVariants}>
                  <div className="stat-info">
                    <div className="stat-label">Leçons Cette Semaine</div>
                    <div className="stat-value">{stats.lessonsThisWeek || 0}</div>
                  </div>
                  <div className="stat-right-col">
                    <div className="stat-icon-wrapper">🎯</div>
                    <div className="stat-trend">{stats.totalHours || 12}h d'apprentissage</div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <div className="p-6 bg-white/5 backdrop-blur-xl rounded-[20px] border border-white/10" style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)" }}></div>
                  <h3 className="text-lg font-bold text-white mb-4 pt-2">Activité Hebdomadaire</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: chartActivity.map(day => day.day),
                        datasets: [
                          {
                            label: 'Points Gagnés',
                            data: chartActivity.map(day => day.points || 0),
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                          },
                          {
                            label: 'Heures Passées',
                            data: chartActivity.map(day => ((day.time_spent ?? day.time_spent_minutes) || 0) / 60),
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: { color: '#94a3b8' }
                          }
                        },
                        scales: {
                          x: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#94a3b8' }
                          },
                          y: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#94a3b8' }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="p-6 bg-white/5 backdrop-blur-xl rounded-[20px] border border-white/10" style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)" }}></div>
                  <h3 className="text-lg font-bold text-white mb-4 pt-2">Leçons Complétées</h3>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: chartActivity.map(day => day.day),
                        datasets: [
                          {
                            label: 'Leçons',
                            data: chartActivity.map(day => day.lessons_completed || 0),
                            backgroundColor: [
                              'rgba(139, 92, 246, 0.8)',
                              'rgba(16, 185, 129, 0.8)',
                              'rgba(245, 158, 11, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(234, 88, 12, 0.8)',
                              'rgba(124, 58, 237, 0.8)',
                            ],
                            borderRadius: 10,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          x: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#94a3b8' }
                          },
                          y: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#94a3b8', stepSize: 1 }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <h2 className="section-title mb-6">Continuez votre Apprentissage</h2>
              {progressError && (
                <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  {progressError}
                </div>
              )}
              <div className="learning-grid">
                {progressLoading ? (
                  <div className="col-span-full text-center py-12 text-zinc-500">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p>Chargement de l'avancement...</p>
                  </div>
                ) : formationProgress.length > 0 ? (
                  formationProgress.map((formation, index) => (
                    <motion.div 
                      key={formation.id} 
                      className="learning-card"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="card-top">
                        {formation.image_url ? (
                          <img src={formation.image_url} alt={formation.title} className="w-full h-24 object-cover rounded-xl" />
                        ) : (
                          <div className="icon-circle purple">
                            <span className="icon">📚</span>
                          </div>
                        )}
                      </div>
                      <div className="card-body">
                        <h3 className="course-name">{formation.title}</h3>
                        
                        <div className="course-meta">
                          <span className="meta-item">
                            <span className="meta-icon">🕒</span> 
                            {formation.total_time_spent_minutes} min
                          </span>
                          <span className="meta-item">
                            <span className="meta-icon">✅</span> 
                            {formation.completed_lessons}/{formation.total_lessons} leçons
                          </span>
                        </div>
                      </div>
                      <div className="card-footer">
                        <div className="progress-header">
                          <span className="progress-label">PROGRESS</span>
                          <span className="progress-percentage">{formation.progress_percent}%</span>
                        </div>
                        <div className="progress-track">
                          <motion.div 
                            className="progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${formation.progress_percent}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                        <Link 
                          to={`/formations/${formation.id}/course`} 
                          className="mt-4 w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl text-center hover:opacity-90 transition-opacity"
                          style={{ borderRadius: "12px", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
                        >
                          Continuer
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-zinc-500">
                    <p className="text-lg mb-4">Aucun cours en cours pour le moment</p>
                    <Link to="/formations" className="btn btn-primary">Découvrir les Formations</Link>
                  </div>
                )}
              </div>
            </div>

            <aside className="sidebar-area">
              <div className="summary-card">
                <div className="check-icon-circle">
                  <span className="check-icon">✓</span>
                </div>
                <h2 className="summary-title">Keep Learning</h2>
                <p className="summary-text">
                  Vous avez complété {stats.formationsCompleted || 0} formations ce mois. 
                  Vous êtes dans le top 5% des apprenants actifs.
                </p>
                <Link to="/certificates" className="cert-link">
                  Voir les Certificats <span className="arrow">→</span>
                </Link>
              </div>

              <div className="deadlines-section">
                <h3 className="deadlines-title">PROCHAINES SESSIONS</h3>
                <div className="deadlines-list">
                  {upcomingLives.slice(0, 3).map((live) => {
                    const eventDate = new Date(live.start_time);
                    return (
                      <div key={live.id} className="deadline-item">
                        <div className="date-badge">
                          <span className="month">{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(eventDate).toUpperCase()}</span>
                          <span className="day">{eventDate.getDate()}</span>
                        </div>
                        <div className="deadline-info flex-1">
                          <p className="deadline-name">{live.title}</p>
                          <p className="text-xs text-zinc-500">{eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <button 
                          className="btn btn-secondary btn-sm text-xs"
                          onClick={() => handleReminderClick(live)}
                        >
                          Ajouter au Calendrier
                        </button>
                      </div>
                    );
                  })}
                  {upcomingLives.length === 0 && calendarEvents.length === 0 && (
                    <p className="text-zinc-500 italic text-sm">Aucune session à venir</p>
                  )}
                  {/* Fallback to calendar events if no upcoming lives */}
                  {upcomingLives.length === 0 && calendarEvents.length > 0 && calendarEvents.slice(0, 3).map((event, idx) => {
                    const eventDate = new Date();
                    eventDate.setDate(eventDate.getDate() + idx);
                    return (
                      <div key={`calendar-${idx}`} className="deadline-item">
                        <div className="date-badge">
                          <span className="month">{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(eventDate).toUpperCase()}</span>
                          <span className="day">{eventDate.getDate()}</span>
                        </div>
                        <div className="deadline-info">
                          <p className="deadline-name">{event.title}</p>
                          <p className="text-xs text-zinc-500">{event.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {recentAchievements.length > 0 && (
                <div className="p-6 bg-zinc-900/30 rounded-[32px] border border-zinc-800">
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">RÉCENTES RÉUSSITES</h3>
                  <div className="space-y-3">
                    {recentAchievements.slice(0, 3).map((ach, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-2xl">
                        <div className="text-2xl">{ach.icon || '🏆'}</div>
                        <div>
                          <div className="text-sm font-bold text-white">{ach.title}</div>
                          <div className="text-xs text-zinc-500">{ach.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      {activeView === 'profile' && (
        <section className="dashboard-content">
          <div className="container">
            <div className="dashboard-section max-w-2xl mx-auto">
              <h2 className="section-title mb-8">Mon Profil</h2>
              {!isEditingProfile ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-bold">
                      {user.full_name?.[0] || 'U'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{user.full_name}</h3>
                      <p className="text-zinc-400">{user.email}</p>
                      <span className="inline-block mt-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black uppercase">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 py-8 border-y border-zinc-800">
                    <div>
                      <div className="text-zinc-500 text-xs font-black uppercase mb-1">Inscrit le</div>
                      <div className="text-white font-bold">{hasValidCreatedAt ? createdAtDate.toLocaleDateString() : 'Non disponible'}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-xs font-black uppercase mb-1">Points Totaux</div>
                      <div className="text-white font-bold">{user.total_points} pts</div>
                    </div>
                  </div>
                  <button onClick={() => setIsEditingProfile(true)} className="btn btn-primary w-full">Modifier le Profil</button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-zinc-500 uppercase mb-2">Nom Complet</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
                      value={profileData.full_name || ''}
                      onChange={e => setProfileData({...profileData, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-zinc-500 uppercase mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
                      value={profileData.email || ''}
                      onChange={e => setProfileData({...profileData, email: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="btn btn-secondary flex-1">Annuler</button>
                    <button type="submit" className="btn btn-primary flex-1">Enregistrer</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {activeView === 'subscriptions' && (
        <section className="dashboard-content">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="dashboard-section">
                  <h2 className="section-title mb-8">Abonnement Actuel</h2>
                  {subscription ? (
                    <div className="p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-indigo-400 font-black uppercase text-xs tracking-widest">Plan Actuel</span>
                          <h3 className="text-4xl font-black text-white mt-1 uppercase">{subscription.package_name}</h3>
                        </div>
                        <div className="text-right">
                          <span className={`px-4 py-1 rounded-full text-xs font-black uppercase ${subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {subscriptionStatus}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <div className="text-zinc-500 text-xs font-black uppercase mb-1">Début</div>
                          <div className="text-white font-bold">{new Date(subscription.start_date).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-xs font-black uppercase mb-1">Prochain renouvellement</div>
                          <div className="text-white font-bold">{new Date(subscription.end_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <a href="/#plans" className="btn btn-primary flex-1 text-center no-underline flex items-center justify-center">Mettre à Niveau</a>
                        <button onClick={handleCancelSubscription} className="btn btn-secondary flex-1">Annuler l'abonnement</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-zinc-400 mb-6">Vous n'avez pas d'abonnement actif.</p>
                      <a href="/#plans" className="btn btn-primary no-underline">Voir les forfaits</a>
                    </div>
                  )}
                </div>

                <div className="dashboard-section">
                  <h2 className="section-title mb-8">Historique des Paiements</h2>
                  <div className="space-y-4">
                    {paymentHistory.map(payment => (
                      <div key={payment.id} className="flex justify-between items-center p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800">
                        <div>
                          <div className="font-bold text-white">{payment.description}</div>
                          <div className="text-xs text-zinc-500">{new Date(payment.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-white">{payment.amount}€</div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase">{payment.status}</div>
                        </div>
                      </div>
                    ))}
                    {paymentHistory.length === 0 && (
                      <p className="text-zinc-500 text-center py-4 italic">Aucune transaction trouvée.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="dashboard-section">
                  <h3 className="text-xl font-bold text-white mb-6">Avantages Membre</h3>
                  <ul className="space-y-4">
                    {[
                      "Accès illimité aux formations",
                      "Analyses de marché quotidiennes",
                      "Accès au Elite Circle",
                      "Support prioritaire",
                      "Webinaires exclusifs"
                    ].map((feat, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                        <span className="text-green-500">✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeView === 'courses' && (
        <section className="dashboard-content">
          <div className="container">
            <div className="space-y-12">
              <div className="dashboard-section">
                <h2 className="section-title mb-8">En Cours d'Apprentissage</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {progressLoading ? (
                    <div className="col-span-full text-center py-12 text-zinc-500">
                      <div className="loading-spinner mx-auto mb-4"></div>
                      <p>Chargement...</p>
                    </div>
                  ) : formationProgress.filter(f => f.progress_percent > 0 && f.progress_percent < 100).length > 0 ? (
                    formationProgress.filter(f => f.progress_percent > 0 && f.progress_percent < 100).map(formation => (
                      <div key={formation.id} className="progress-item">
                        <div className="progress-info">
                          <h3 className="course-title">{formation.title}</h3>
                          <p className="course-progress">{formation.progress_percent}%</p>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${formation.progress_percent}%` }}></div>
                        </div>
                        <Link to={`/formations/${formation.id}/course`}><button className="btn btn-primary btn-sm">Continuer</button></Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 italic col-span-full">Aucun cours en cours pour le moment.</p>
                  )}
                </div>
              </div>

              <div className="dashboard-section">
                <h2 className="section-title mb-8">Formations Terminées</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formationProgress.filter(f => f.progress_percent === 100).length > 0 ? (
                    formationProgress.filter(f => f.progress_percent === 100).map(formation => (
                      <div key={formation.id} className="p-6 bg-zinc-800/30 rounded-2xl border border-zinc-800">
                        <div className="text-4xl mb-4">🎓</div>
                        <h3 className="font-bold text-white mb-2">{formation.title}</h3>
                        <p className="text-xs text-zinc-500 mb-6">100% complété</p>
                        <Link to="/certificates" className="btn btn-text btn-sm px-0">Voir le certificat</Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 italic col-span-full">Aucune formation terminée pour le moment.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeView === 'calendar' && (
        <section className="dashboard-content">
          <div className="container">
            <PrivateCalendar />
          </div>
        </section>
      )}

      {activeView === 'archives' && (
        <section className="dashboard-content">
          <div className="container">
            <div className="dashboard-section">
              <div className="flex justify-between items-center mb-8">
                <h2 className="section-title">Archives & Replays</h2>
                <div className="text-zinc-500 text-xs font-black uppercase tracking-widest bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-700">
                  {archivedLives.length} sessions disponibles
                </div>
              </div>

              {archivesLoading ? (
                <div className="text-center py-20 text-zinc-500">Chargement des archives...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivedLives.map((live) => (
                    <div key={live.id} className="learning-card">
                      {live.thumbnail_url && (
                        <div className="w-full h-48 mb-4 rounded-2xl overflow-hidden border border-zinc-800">
                          <img 
                            src={live.thumbnail_url} 
                            alt={live.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="card-top mb-0">
                        <div className={`icon-circle ${live.formation_id ? 'green' : 'purple'}`}>
                          <span className="icon">📺</span>
                        </div>
                      </div>
                      <div className="card-body mb-0">
                        <h3 className="course-name text-lg">{live.title}</h3>
                        {live.description && (
                          <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{live.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
                          <span>📅 {new Date(live.start_time).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="card-footer pt-4">
                        {live.replay_url ? (
                          <a 
                            href={live.replay_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary w-full text-center flex items-center justify-center gap-2"
                          >
                            <span>▶</span> Regarder le Replay
                          </a>
                        ) : (
                          <div className="text-center text-zinc-500 text-sm">Replay bientôt disponible</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {archivedLives.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-zinc-900/30 rounded-[32px] border border-zinc-800">
                      <div className="text-6xl mb-4">📽️</div>
                      <h3 className="text-xl font-bold text-white mb-2">Aucune archive disponible</h3>
                      <p className="text-zinc-500">Les replays des sessions passées seront ajoutés ici</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
