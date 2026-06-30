import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { adminApi, formationsApi, courseContentApi, certificatesApi } from '../api';
import { formatError } from '../utils/errorUtils';
import BaseButton from '../components/ui/BaseButton';
import './Dashboard.css'; // Reuse some styles or create new ones

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const serializePlanFeatures = (value) => {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value !== 'string') {
    return '[]';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '[]';
  }

  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(Array.isArray(parsed) ? parsed : [String(parsed)]);
  } catch (e) {
    const items = trimmed
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    return JSON.stringify(items);
  }
};

const planFeaturesToTextarea = (value) => {
  if (Array.isArray(value)) {
    return value.join('\n');
  }

  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed.join('\n') : trimmed;
  } catch (e) {
    return trimmed;
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [formations, setFormations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [certificateForm, setCertificateForm] = useState({
    user_id: '',
    formation_id: '',
    certificate_type: 'completion',
    custom_title: '',
    custom_message: '',
    issuer_name: 'TradeMaster Academy',
  });
  const [loading, setLoading] = useState(true);

  // Search/Filter states
  const [userSearch, setUserSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'spotlight', 'video', 'formation', 'user-edit', 'sub-edit', 'sub-manual'
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);

  // New states for extended admin features
  const [lives, setLives] = useState([]);
  const [archivedLives, setArchivedLives] = useState([]);
  const [livesTab, setLivesTab] = useState('active'); // 'active' or 'archived'
  const [calendar, setCalendar] = useState([]);
  const [settings, setSettings] = useState({});
  const [spotlights, setSpotlights] = useState([]);
  const [plans, setPlans] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [eliteVideos, setEliteVideos] = useState([]);
  
  // Course content management states
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [expandedModule, setExpandedModule] = useState(null);
  
  // Analytics state
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, usersRes, formationsRes, livesRes, archivedLivesRes, calendarRes, settingsRes, spotlightsRes, plansRes, promotionsRes, eliteVideosRes, subscriptionsRes, auditLogsRes, analyticsRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getUsers(),
          formationsApi.getFormations(),
          adminApi.getLives(),
          adminApi.getArchivedLives(),
          adminApi.getCalendar(),
          adminApi.getSettings(),
          adminApi.getSpotlights(),
          adminApi.getPlans(),
          adminApi.getPromotions(),
          adminApi.getEliteVideos(),
          adminApi.getSubscriptions(),
          adminApi.getAuditLogs(),
          adminApi.getAnalytics()
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setFormations(formationsRes.data);
        setLives(livesRes.data);
        setArchivedLives(archivedLivesRes.data);
        setCalendar(calendarRes.data);
        setSpotlights(spotlightsRes.data);
        setPlans(plansRes.data);
        setPromotions(promotionsRes.data);
        setEliteVideos(eliteVideosRes.data);
        setSubscriptions(subscriptionsRes.data);
        setAuditLogs(auditLogsRes.data);
        setAnalytics(analyticsRes.data);
        
        // Convert settings array to object
        const settingsObj = {};
        settingsRes.data.forEach(s => settingsObj[s.key] = s.value);
        setSettings(settingsObj);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateSetting = async (key, value) => {
    try {
      await adminApi.updateSetting({ key, value });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      alert("Erreur lors de la mise à jour : " + formatError(err));
    }
  };

  // Improved Modal Submission Logic
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'spotlight') {
        if (!formData.image_url) { alert("Veuillez uploader une image"); return; }
        const res = await adminApi.createSpotlight(formData);
        setSpotlights([...spotlights, res.data]);
      } else if (modalType === 'video') {
        if (!formData.video_url) { alert("Veuillez uploader une vidéo"); return; }
        const res = await adminApi.createEliteVideo(formData);
        setEliteVideos([...eliteVideos, res.data]);
      } else if (modalType === 'live') {
        let res;
        if (formData.id) {
          res = await adminApi.updateLive(formData.id, formData);
          // Update both lists
          setLives(lives.map(l => l.id === formData.id ? res.data : l).filter(l => !l.is_archived));
          setArchivedLives([...archivedLives.filter(l => l.id !== formData.id), res.data].filter(l => l.is_archived));
        } else {
          res = await adminApi.createLive(formData);
          setLives([...lives, res.data]);
        }
      } else if (modalType === 'calendar') {
        const res = await adminApi.createCalendarEvent(formData);
        setCalendar([...calendar, res.data]);
      } else if (modalType === 'formation') {
        if (formData.id) {
          const res = await adminApi.updateFormation(formData.id, {
            ...formData,
            price: parseFloat(formData.price)
          });
          setFormations(formations.map(f => f.id === formData.id ? res.data : f));
        } else {
          if (!formData.image_url) { alert("Veuillez uploader une image de couverture"); return; }
          const res = await adminApi.createFormation({
            ...formData,
            price: parseFloat(formData.price),
            rating: 5.0,
            reviews: 0
          });
          setFormations([...formations, res.data]);
        }
      } else if (modalType === 'plan') {
        if (formData.id) {
          const res = await adminApi.updatePlan(formData.id, {
            ...formData,
            price_tnd: parseFloat(formData.price_tnd),
            price_usd: parseFloat(formData.price_usd),
            duration_months: parseInt(formData.duration_months),
            features: serializePlanFeatures(formData.features)
          });
          setPlans(plans.map(p => p.id === formData.id ? res.data : p));
        } else {
          const res = await adminApi.createPlan({
            ...formData,
            price_tnd: parseFloat(formData.price_tnd),
            price_usd: parseFloat(formData.price_usd),
            duration_months: parseInt(formData.duration_months),
            features: serializePlanFeatures(formData.features)
          });
          setPlans([...plans, res.data]);
        }
      } else if (modalType === 'user-edit') {
        const res = await adminApi.updateUser(formData.id, formData);
        setUsers(users.map(u => u.id === formData.id ? res.data : u));
      } else if (modalType === 'sub-edit') {
        const res = await adminApi.updateSubscription(formData.id, formData);
        setSubscriptions(subscriptions.map(s => s.id === formData.id ? res.data : s));
      } else if (modalType === 'sub-manual') {
        const res = await adminApi.createManualSubscription(formData);
        setSubscriptions([...subscriptions, res.data]);
      } else if (modalType === 'lesson-edit') {
        const res = await courseContentApi.updateLesson(formData.id, formData);
        setCourseModules(courseModules.map(m => 
          m.id === formData.moduleId 
            ? { 
                ...m, 
                lessons: m.lessons.map(l => l.id === formData.id ? res.data : l)
              }
            : m
        ));
      }
      setIsModalOpen(false);
      setFormData({});
    } catch (err) {
      alert("Erreur lors de l'action : " + formatError(err));
    }
  };

  const handleResetPassword = async (id) => {
    if (window.confirm("Envoyer un lien de réinitialisation ?")) {
      try {
        await adminApi.resetUserPassword(id);
        alert("Lien envoyé");
      } catch (err) {
        alert("Erreur lors de l'envoi : " + formatError(err));
      }
    }
  };

  const handleEditUser = (user) => {
    setModalType('user-edit');
    setFormData(user);
    setIsModalOpen(true);
  };

  const handleEditFormation = (formation) => {
    setModalType('formation');
    setFormData(formation);
    setIsModalOpen(true);
  };

  const handleEditSubscription = (sub) => {
    setModalType('sub-edit');
    setFormData(sub);
    setIsModalOpen(true);
  };

  const openModal = (type) => {
    setModalType(type);
    let defaults = {};
    if (type === 'calendar') {
      defaults = { title: '', day: 'Lundi', time: '', category: 'Trading' };
    } else if (type === 'live') {
      defaults = { title: '', description: '', google_meet_link: '', start_time: '', end_time: '', is_active: true, is_archived: false, replay_url: '', thumbnail_url: '', formation_id: null };
    } else if (type === 'spotlight') {
      defaults = { title: '', description: '', image_url: '', link: '', is_active: true };
    } else if (type === 'formation') {
      defaults = { 
        title: '', description: '', content: '', category: 'Trading', 
        price: 0, level: 'debutant', duration: '10h', image_url: '',
        rating: 4.5, reviews: 0, learning_objectives: '', prerequisites: '', curriculum_data: ''
      };
    } else if (type === 'video') {
      defaults = { title: '', description: '', video_url: '', thumbnail_url: '' };
    } else if (type === 'plan') {
      defaults = { 
        name: '', slug: '', price_tnd: 0, price_usd: 0, 
        duration_months: 1, features: '', is_popular: false, 
        is_active: true, button_text: 'Get Started' 
      };
    } else if (type === 'user-edit') {
      defaults = { full_name: '', email: '', role: 'standard', is_active: true };
    } else if (type === 'sub-edit') {
      defaults = { payment_status: 'pending', is_active: true, end_date: '' };
    } else if (type === 'sub-manual') {
      defaults = { user_email: '', package_name: 'starter', duration_months: 1 };
    } else if (type === 'user-access') {
      // formData should already be set to the user object before calling openModal
      return; 
    }
    setFormData(defaults);
    setIsModalOpen(true);
  };

  const handleToggleAccess = async (userId, formationId, hasAccess) => {
    try {
      if (hasAccess) {
        await adminApi.revokeFormationAccess(userId, formationId);
        setUsers(users.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              accessible_formation_ids: (u.accessible_formation_ids || []).filter(id => id !== formationId)
            };
          }
          return u;
        }));
        // Also update formData if the modal is open for this user
        if (formData.id === userId) {
          setFormData(prev => ({
            ...prev,
            accessible_formation_ids: (prev.accessible_formation_ids || []).filter(id => id !== formationId)
          }));
        }
      } else {
        await adminApi.grantFormationAccess(userId, formationId);
        setUsers(users.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              accessible_formation_ids: [...(u.accessible_formation_ids || []), formationId]
            };
          }
          return u;
        }));
        // Also update formData if the modal is open for this user
        if (formData.id === userId) {
          setFormData(prev => ({
            ...prev,
            accessible_formation_ids: [...(prev.accessible_formation_ids || []), formationId]
          }));
        }
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour de l'accès : " + formatError(err));
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await adminApi.uploadFile(file);
      setFormData(prev => ({ ...prev, [field]: res.data.url }));
    } catch (err) {
      alert("Erreur lors de l'upload : " + formatError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await adminApi.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        alert("Erreur lors de la suppression : " + formatError(err));
      }
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'standard' : 'admin';
    try {
      await adminApi.updateUserRole(user.id, newRole);
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert("Erreur lors de la mise à jour du rôle : " + formatError(err));
    }
  };

  const handleDeleteFormation = async (id) => {
    if (window.confirm("Supprimer cette formation ?")) {
      try {
        await adminApi.deleteFormation(id);
        setFormations(formations.filter(f => f.id !== id));
      } catch (err) {
        alert("Erreur lors de la suppression : " + formatError(err));
      }
    }
  };

  // Course Content Management Functions
  const handleSelectFormationForContent = async (formation) => {
    setSelectedFormation(formation);
    try {
      const res = await courseContentApi.getModules(formation.id);
      setCourseModules(res.data);
      setActiveTab('course-content');
    } catch (err) {
      alert("Erreur lors du chargement des modules : " + formatError(err));
    }
  };

  const handleCreateModule = async () => {
    if (!selectedFormation) return;
    const title = prompt("Titre du module :");
    if (!title) return;
    try {
      const res = await courseContentApi.createModule(selectedFormation.id, {
        title,
        description: prompt("Description (optionnel) :") || "",
        order: courseModules.length + 1
      });
      setCourseModules([...courseModules, { ...res.data, lessons: [] }]);
    } catch (err) {
      alert("Erreur lors de la création : " + formatError(err));
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Supprimer ce module ?")) return;
    try {
      await courseContentApi.deleteModule(moduleId);
      setCourseModules(courseModules.filter(m => m.id !== moduleId));
    } catch (err) {
      alert("Erreur lors de la suppression : " + formatError(err));
    }
  };

  const handleCreateLesson = async (moduleId) => {
    const title = prompt("Titre de la leçon :");
    if (!title) return;
    try {
      const res = await courseContentApi.createLesson(moduleId, {
        title,
        description: prompt("Description (optionnel) :") || "",
        duration: prompt("Durée (ex: 15 min) :") || "",
        order: (courseModules.find(m => m.id === moduleId)?.lessons?.length || 0) + 1
      });
      setCourseModules(courseModules.map(m => 
        m.id === moduleId 
          ? { ...m, lessons: [...(m.lessons || []), res.data] }
          : m
      ));
    } catch (err) {
      alert("Erreur lors de la création : " + formatError(err));
    }
  };

  const handleEditLesson = async (lesson, moduleId) => {
    setModalType('lesson-edit');
    setFormData({ ...lesson, moduleId });
    setIsModalOpen(true);
  };

  const handleDeleteLesson = async (lessonId, moduleId) => {
    if (!window.confirm("Supprimer cette leçon ?")) return;
    try {
      await courseContentApi.deleteLesson(lessonId);
      setCourseModules(courseModules.map(m => 
        m.id === moduleId 
          ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
          : m
      ));
    } catch (err) {
      alert("Erreur lors de la suppression : " + formatError(err));
    }
  };

  if (loading) return <div className="p-20 text-center text-white">Chargement du panneau admin...</div>;

  return (
    <div className="dashboard admin-dashboard min-h-screen pb-12">
      <div className="container mx-auto px-4">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-white mb-2">Panneau d'Administration</h1>
          <p className="text-zinc-400">Gérez les utilisateurs, les formations et suivez les performances.</p>
        </header>

        {/* Admin Tabs */}
        <div className="flex flex-wrap gap-3 mb-10 border-b border-zinc-800 pb-4">
          {['overview', 'analytics', 'formations', 'course-content', 'users', 'subscriptions', 'content', 'spotlights', 'plans', 'elite', 'audit', 'settings', 'certificates'].map(tab => (
            <button
              key={tab}
              onClick={() => tab !== 'course-content' || selectedFormation ? setActiveTab(tab) : null}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                activeTab === tab ? 
                  'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 
                tab === 'course-content' && !selectedFormation ? 
                  'text-zinc-700 cursor-not-allowed opacity-50' :
                  'bg-zinc-900/30 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
              }`}
            >
              {tab === 'overview' ? '📊 Stats' : 
               tab === 'analytics' ? '📈 Analytics' : 
               tab === 'formations' ? '📚 Formations' : 
               tab === 'course-content' ? '📖 Contenu des Cours' :
               tab === 'users' ? '👥 Utilisateurs' : 
               tab === 'subscriptions' ? '💳 Abonnements' :
               tab === 'content' ? '🎥 Lives & Calendrier' : 
               tab === 'spotlights' ? '✨ Spotlights' :
               tab === 'plans' ? '💰 Plans & Promos' : 
               tab === 'elite' ? '⭐ Elite Circle' : 
               tab === 'audit' ? '📝 Audit Logs' : 
               tab === 'certificates' ? '🏆 Certificats' : 
               '⚙️ Paramètres'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/10 p-8 rounded-[32px] border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Utilisateurs Totaux</div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-2xl text-indigo-400">
                  👥
                </div>
              </div>
              <div className="text-5xl font-black text-white">{stats.total_users}</div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 p-8 rounded-[32px] border border-amber-500/20 shadow-xl shadow-amber-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Formations</div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl text-amber-400">
                  📚
                </div>
              </div>
              <div className="text-5xl font-black text-white">{stats.total_formations}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 p-8 rounded-[32px] border border-green-500/20 shadow-xl shadow-green-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Abonnements Actifs</div>
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-2xl text-green-400">
                  ✅
                </div>
              </div>
              <div className="text-5xl font-black text-white">{stats.total_active_subscriptions}</div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-10">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/10 p-6 rounded-[24px] border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Utilisateurs Totaux</div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl text-indigo-400">👥</div>
                </div>
                <div className="text-4xl font-black text-white">{analytics.total_users}</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 p-6 rounded-[24px] border border-green-500/20 shadow-xl shadow-green-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Utilisateurs Actifs (7j)</div>
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl text-green-400">✅</div>
                </div>
                <div className="text-4xl font-black text-white">{analytics.active_users_7d}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 p-6 rounded-[24px] border border-purple-500/20 shadow-xl shadow-purple-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Abonnements Actifs</div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl text-purple-400">💳</div>
                </div>
                <div className="text-4xl font-black text-white">{analytics.subscriptions?.active || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 p-6 rounded-[24px] border border-amber-500/20 shadow-xl shadow-amber-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Leçons Complétées</div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl text-amber-400">📝</div>
                </div>
                <div className="text-4xl font-black text-white">{analytics.total_lessons_completed}</div>
              </div>
            </div>

            {/* Charts Row 1 - Combined Growth Chart */}
            <div className="grid grid-cols-1">
              <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-zinc-800">
                <h3 className="text-xl font-bold text-white mb-4">Croissance des Utilisateurs et Abonnements (14j)</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: (analytics.user_growth || []).map(d => d.day),
                      datasets: [
                        {
                          label: 'Nouveaux Utilisateurs',
                          data: (analytics.user_growth || []).map(d => d.new_users),
                          borderColor: '#6366f1',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          fill: true,
                          tension: 0.4,
                          pointRadius: 5,
                          pointHoverRadius: 7,
                        },
                        {
                          label: 'Nouveaux Abonnements',
                          data: (analytics.subscriptions?.growth || []).map(d => d.new_subscriptions),
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
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Subscriptions per Plan Chart */}
              <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-zinc-800">
                <h3 className="text-xl font-bold text-white mb-4">Abonnements par Forfait</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: (analytics.subscriptions?.per_plan || []).map(p => p.plan),
                      datasets: [
                        {
                          label: 'Abonnements',
                          data: (analytics.subscriptions?.per_plan || []).map(p => p.count),
                          backgroundColor: (analytics.subscriptions?.per_plan || []).map((_, index) => {
                            const colors = [
                              'rgba(99, 102, 241, 0.8)',
                              'rgba(168, 85, 247, 0.8)',
                              'rgba(236, 72, 153, 0.8)',
                              'rgba(245, 158, 11, 0.8)',
                              'rgba(34, 197, 94, 0.8)',
                              'rgba(59, 130, 246, 0.8)'
                            ];
                            return colors[index % colors.length];
                          }),
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

              {/* Daily Activity Chart */}
              <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-zinc-800">
                <h3 className="text-xl font-bold text-white mb-4">Activité Hebdomadaire</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: (analytics.daily_activity || []).map(d => d.day),
                      datasets: [
                        {
                          label: 'Points Gagnés',
                          data: (analytics.daily_activity || []).map(d => d.points),
                          borderColor: '#8b5cf6',
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          fill: true,
                          tension: 0.4,
                          pointRadius: 5,
                          pointHoverRadius: 7,
                        },
                        {
                          label: 'Temps (min)',
                          data: (analytics.daily_activity || []).map(d => d.time_spent_minutes),
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
            </div>



            {/* Formation Statistics Grid */}
            <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-zinc-800">
              <h3 className="text-xl font-bold text-white mb-6">Statistiques des Formations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(analytics.formations || []).map(formation => (
                  <div key={formation.id} className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700">
                    <h4 className="text-lg font-bold text-white mb-3">{formation.title}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Taux de complétion</span>
                        <span className="font-bold text-green-400">{formation.completion_rate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(formation.completion_rate, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Utilisateurs avec accès</span>
                        <span className="font-bold text-white">{formation.users_with_access}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Leçons complétées</span>
                        <span className="font-bold text-purple-400">{formation.completed_lessons}/{formation.total_lessons}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Temps Total</span>
                        <span className="font-bold text-amber-400">{formation.total_time_spent_minutes} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Note</span>
                        <span className="font-bold text-amber-400">⭐ {formation.rating?.toFixed(1) || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Sessions & Revenue Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Live Sessions Stats */}
              <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-zinc-800">
                <h3 className="text-xl font-bold text-white mb-6">Sessions Live</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-indigo-900/30 to-indigo-800/10 rounded-2xl border border-indigo-500/20 text-center">
                    <div className="text-3xl font-black text-white">{analytics.live_sessions?.total || 0}</div>
                    <div className="text-xs text-zinc-400 uppercase font-bold mt-1">Total</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/10 rounded-2xl border border-green-500/20 text-center">
                    <div className="text-3xl font-black text-white">{analytics.live_sessions?.active || 0}</div>
                    <div className="text-xs text-zinc-400 uppercase font-bold mt-1">Actifs</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-900/30 to-amber-800/10 rounded-2xl border border-amber-500/20 text-center">
                    <div className="text-3xl font-black text-white">{analytics.live_sessions?.archived || 0}</div>
                    <div className="text-xs text-zinc-400 uppercase font-bold mt-1">Archivés</div>
                  </div>
                </div>
              </div>

              {/* Revenue Stats */}
              <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-zinc-800">
                <h3 className="text-xl font-bold text-white mb-6">Revenus</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-amber-900/30 to-amber-800/10 rounded-2xl border border-amber-500/20">
                    <div className="text-xs text-zinc-400 uppercase font-bold mb-1">Total</div>
                    <div className="text-3xl font-black text-white">{analytics.revenue?.total || 0} <span className="text-sm text-zinc-400">(mixte)</span></div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(analytics.revenue?.per_currency || {}).map(([currency, amount]) => (
                      <div key={currency} className="flex justify-between p-3 bg-zinc-800/50 rounded-xl border border-zinc-700">
                        <span className="text-zinc-300 font-bold uppercase">{currency}</span>
                        <span className="text-white font-black">{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-zinc-800">
              <h3 className="text-xl font-bold text-white mb-6">Classement (Top 10)</h3>
              <div className="space-y-4">
                {(analytics.leaderboard || []).map((user, idx) => (
                  <div key={user.id} className="flex items-center justify-between p-5 bg-zinc-800/50 rounded-2xl border border-zinc-700">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                        idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' :
                        idx === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black' :
                        idx === 2 ? 'bg-gradient-to-r from-orange-700 to-orange-600 text-white' :
                        'bg-zinc-700 text-zinc-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{user.name}</div>
                        <div className="text-xs text-zinc-500">🔥 Streak: {user.streak} jours • 📚 Formations: {user.formations_completed}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-purple-400">{user.points} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Tab (Lives & Calendar) */}
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-zinc-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">Lives & Replays</h2>
                <BaseButton onClick={() => openModal('live')} variant="primary" size="small">Nouveau Live</BaseButton>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setLivesTab('active')} 
                  className={`px-4 py-2 rounded-full text-xs font-black transition-all ${livesTab === 'active' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  Lives Actifs
                </button>
                <button 
                  onClick={() => setLivesTab('archived')} 
                  className={`px-4 py-2 rounded-full text-xs font-black transition-all ${livesTab === 'archived' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  Archives & Replays
                </button>
              </div>

              <div className="space-y-4">
                {(livesTab === 'active' ? lives : archivedLives).map(live => (
                  <div key={live.id} className="p-4 bg-zinc-800/50 rounded-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-white text-sm">{live.title}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-black">{new Date(live.start_time).toLocaleString()}</div>
                        {live.google_meet_link && livesTab === 'active' && (
                          <div className="text-[10px] text-indigo-400 font-mono truncate max-w-[200px]">{live.google_meet_link}</div>
                        )}
                        {live.replay_url && livesTab === 'archived' && (
                          <div className="text-[10px] text-green-400 font-mono truncate max-w-[200px]">Replay: {live.replay_url}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setModalType('live');
                            setFormData({ ...live });
                            setIsModalOpen(true);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-bold"
                        >
                          Modifier
                        </button>
                        <button 
                          onClick={async () => {
                            if(window.confirm("Supprimer ce live ?")) {
                              await adminApi.deleteLive(live.id);
                              if (livesTab === 'active') {
                                setLives(lives.filter(l => l.id !== live.id));
                              } else {
                                setArchivedLives(archivedLives.filter(l => l.id !== live.id));
                              }
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-xs font-bold"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-zinc-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">Calendrier Hebdomadaire</h2>
                <BaseButton onClick={() => openModal('calendar')} variant="primary" size="small">Ajouter Event</BaseButton>
              </div>
              <div className="space-y-6">
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                  <div key={day} className="flex flex-col gap-2">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{day}</div>
                    <div className="space-y-2">
                      {calendar.filter(e => e.day === day).map((event, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl border border-zinc-700">
                          <div>
                            <span className="text-xs font-bold text-white">{event.title}</span>
                            <span className="ml-2 text-[10px] text-zinc-500">{event.time}</span>
                          </div>
                          <button 
                            onClick={async () => {
                              if(window.confirm("Supprimer cet événement ?")) {
                                await adminApi.deleteCalendarEvent(event.id);
                                setCalendar(calendar.filter(e => e.id !== event.id));
                              }
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {calendar.filter(e => e.day === day).length === 0 && (
                        <div className="p-3 bg-zinc-800/20 rounded-xl border border-dashed border-zinc-700 text-[10px] text-zinc-600 text-center">
                          Aucun événement
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Spotlights Tab */}
        {activeTab === 'spotlights' && (
          <div className="bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white">Gestion Our Spotlights</h2>
              <BaseButton onClick={() => openModal('spotlight')} variant="primary" size="small">Nouveau Spotlight</BaseButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spotlights.map(spot => (
                <div key={spot.id} className="bg-zinc-800/50 rounded-2xl overflow-hidden border border-zinc-700">
                  <img src={spot.image_url} alt={spot.title} className="w-full h-40 object-cover opacity-60" />
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-1">{spot.title}</h3>
                    <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{spot.description}</p>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${spot.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {spot.is_active ? 'ACTIF' : 'INACTIF'}
                      </span>
                      <button onClick={async () => {
                        if(window.confirm("Supprimer ce spotlight ?")) {
                          await adminApi.deleteSpotlight(spot.id);
                          setSpotlights(spotlights.filter(s => s.id !== spot.id));
                        }
                      }} className="text-red-400 hover:text-red-300 text-xs font-bold">Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans & Promos Tab */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white">Evolution Plans</h2>
                <BaseButton onClick={() => openModal('plan')} variant="primary" size="small">Nouveau Plan</BaseButton>
              </div>
              <div className="space-y-4">
                {plans.map(plan => (
                  <div key={plan.id} className="p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-black text-white uppercase tracking-wider">{plan.name}</h3>
                        <div className="flex gap-4 mt-1">
                          <div className="text-xl font-black text-indigo-400">{(Number(plan.price_tnd) / 1000).toFixed(0)} DT</div>
                          <div className="text-xl font-black text-amber-400">{plan.price_usd} $</div>
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Slug: {plan.slug} | Durée: {plan.duration_months} mois</div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${plan.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {plan.is_active ? 'ACTIF SUR HOME' : 'MASQUE SUR HOME'}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setModalType('plan');
                            setFormData({ ...plan, features: planFeaturesToTextarea(plan.features) });
                            setIsModalOpen(true);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-bold"
                        >
                          Modifier
                        </button>
                        <button 
                          onClick={async () => {
                            if(window.confirm("Supprimer ce plan ?")) {
                              await adminApi.deletePlan(plan.id);
                              setPlans(plans.filter(p => p.id !== plan.id));
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-xs font-bold"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 line-clamp-2 mb-2">{plan.features}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800">
              <h2 className="text-2xl font-black text-white mb-8">Promos & Coupons</h2>
              <div className="space-y-4 mb-8">
                {promotions.map(promo => (
                  <div key={promo.id} className="p-4 bg-zinc-800/50 rounded-2xl flex justify-between items-center border border-dashed border-zinc-700">
                    <div>
                      <span className="font-mono font-black text-white tracking-widest">{promo.code}</span>
                      <span className="ml-3 text-xs font-bold text-green-400">-{promo.discount_percent}%</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-black">Exp: {new Date(promo.expiry_date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                <h4 className="text-sm font-bold text-white mb-4">Créer une promo</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input type="text" placeholder="CODE" className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-xs outline-none" />
                  <input type="number" placeholder="%" className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-xs outline-none" />
                </div>
                <BaseButton variant="primary" size="small" fullWidth>Générer</BaseButton>
              </div>
            </div>
          </div>
        )}

        {/* Elite Circle Tab */}
        {activeTab === 'elite' && (
          <div className="bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white">Gestion Elite Circle</h2>
              <BaseButton onClick={() => openModal('video')} variant="primary" size="small">Uploader une Vidéo</BaseButton>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eliteVideos.map(video => (
                <div key={video.id} className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-white">{video.title}</h3>
                      <button 
                        onClick={async () => {
                          if(window.confirm("Supprimer cette vidéo ?")) {
                            await adminApi.deleteEliteVideo(video.id);
                            setEliteVideos(eliteVideos.filter(v => v.id !== video.id));
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                      >
                        Supprimer
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">{video.description}</p>
                    <div className="bg-black/40 rounded-xl p-3 text-[10px] font-mono text-zinc-400 truncate">
                      {video.video_url}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab (Social Links & Contact) */}
        {activeTab === 'settings' && (
          <div className="bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800 max-w-2xl">
            <h2 className="text-2xl font-black text-white mb-8">Paramètres du Site</h2>
            
            <h3 className="text-lg font-bold text-zinc-300 mb-4">Coordonnées</h3>
            <div className="space-y-6 mb-8">
              {[
                { key: 'contact_address', label: 'Adresse' },
                { key: 'contact_email', label: 'Email de contact' },
                { key: 'contact_phone', label: 'Téléphone' },
                { key: 'contact_hours', label: 'Horaires' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{field.label}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                      defaultValue={settings[field.key] || ''}
                      onBlur={(e) => handleUpdateSetting(field.key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className="text-lg font-bold text-zinc-300 mb-4">Réseaux Sociaux</h3>
            <div className="space-y-6 mb-8">
              {[
                { key: 'telegram_url', label: 'Lien Telegram', icon: '✉️' },
                { key: 'youtube_url', label: 'Lien YouTube', icon: '📺' },
                { key: 'instagram_url', label: 'Lien Instagram', icon: '📸' },
                { key: 'twitter_url', label: 'Lien Twitter', icon: '🐦' },
                { key: 'linkedin_url', label: 'Lien LinkedIn', icon: '💼' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{field.icon} {field.label}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                      defaultValue={settings[field.key] || ''}
                      onBlur={(e) => handleUpdateSetting(field.key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <label className="block text-xs font-black text-zinc-500 uppercase mb-2">Contenu Elite Circle</label>
              <textarea 
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors resize-none"
                defaultValue={settings['elite_circle_desc'] || ''}
                onBlur={(e) => handleUpdateSetting('elite_circle_desc', e.target.value)}
              ></textarea>
            </div>
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800">
              <h2 className="text-2xl font-black text-white mb-8">Créer un Certificat</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2">Type de certificat</label>
                  <select
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                    value={certificateForm.certificate_type}
                    onChange={(e) => setCertificateForm((prev) => ({
                      ...prev,
                      certificate_type: e.target.value,
                      formation_id: e.target.value === 'custom' ? prev.formation_id : prev.formation_id,
                    }))}
                  >
                    <option value="completion">Fin de formation</option>
                    <option value="custom">Personnalisé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2">Utilisateur</label>
                  <select 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                    value={certificateForm.user_id}
                    onChange={(e) => setCertificateForm((prev) => ({ ...prev, user_id: e.target.value }))}
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2">
                    Formation {certificateForm.certificate_type === 'custom' ? '(optionnel)' : ''}
                  </label>
                  <select 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                    value={certificateForm.formation_id}
                    onChange={(e) => setCertificateForm((prev) => ({ ...prev, formation_id: e.target.value }))}
                  >
                    <option value="">Sélectionner une formation</option>
                    {formations.map(f => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2">Titre du certificat</label>
                  <input
                    type="text"
                    placeholder={certificateForm.certificate_type === 'custom' ? 'Ex: Certificat d Excellence' : 'Optionnel'}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                    value={certificateForm.custom_title}
                    onChange={(e) => setCertificateForm((prev) => ({ ...prev, custom_title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2">Message personnalisé</label>
                  <textarea
                    rows="4"
                    placeholder="Ex: Félicitations pour votre engagement et votre progression."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors resize-none"
                    value={certificateForm.custom_message}
                    onChange={(e) => setCertificateForm((prev) => ({ ...prev, custom_message: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2">Signataire</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                    value={certificateForm.issuer_name}
                    onChange={(e) => setCertificateForm((prev) => ({ ...prev, issuer_name: e.target.value }))}
                  />
                </div>
                <BaseButton 
                  variant="primary" 
                  size="large" 
                  fullWidth
                  disabled={!certificateForm.user_id || (certificateForm.certificate_type === 'completion' && !certificateForm.formation_id)}
                  onClick={async () => {
                    try {
                      await certificatesApi.issueCertificate({
                        user_id: parseInt(certificateForm.user_id, 10),
                        formation_id: certificateForm.formation_id ? parseInt(certificateForm.formation_id, 10) : null,
                        certificate_type: certificateForm.certificate_type,
                        custom_title: certificateForm.custom_title || null,
                        custom_message: certificateForm.custom_message || null,
                        issuer_name: certificateForm.issuer_name || 'TradeMaster Academy',
                      });
                      alert("Certificat délivré !");
                      setCertificateForm({
                        user_id: '',
                        formation_id: '',
                        certificate_type: 'completion',
                        custom_title: '',
                        custom_message: '',
                        issuer_name: 'TradeMaster Academy',
                      });
                    } catch (err) {
                      alert("Erreur : " + formatError(err));
                    }
                  }}
                >
                  Délivrer le certificat
                </BaseButton>
              </div>
            </div>
            <div className="bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800">
              <h2 className="text-2xl font-black text-white mb-8">Règles de délivrance</h2>
              <div className="space-y-4 text-sm text-zinc-300">
                <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/10 p-6 rounded-2xl border border-indigo-500/20">
                  <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Automatique</div>
                  <div>
                    Lorsqu'un étudiant termine toutes les leçons d'une formation, un certificat de fin de formation est ajouté automatiquement à son compte.
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 p-6 rounded-2xl border border-amber-500/20">
                  <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Personnalisé</div>
                  <div>
                    L'admin peut aussi créer un certificat personnalisé avec un titre, un message et un signataire pour n'importe quel étudiant.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-6 rounded-[32px] border border-zinc-800">
              <div className="relative w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="Rechercher par nom ou email..." 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-white outline-none focus:border-indigo-500 transition-all pl-12"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-500 text-sm font-bold">{users.length} Utilisateurs</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-[32px] border border-zinc-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-black">
                  <tr>
                    <th className="p-6">Utilisateur</th>
                    <th className="p-6">Rôle</th>
                    <th className="p-6">Statut</th>
                    <th className="p-6">Points</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {users.filter(u => 
                    u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
                    (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase()))
                  ).map(user => (
                    <tr key={user.id} className="text-zinc-300 hover:bg-zinc-800/20 transition-colors">
                      <td className="p-6">
                        <div className="font-bold text-white">{user.full_name || 'Utilisateur'}</div>
                        <div className="text-xs text-zinc-500">{user.email}</div>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 
                          user.role === 'subscriber' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {user.is_active ? 'ACTIF' : 'INACTIF'}
                        </span>
                      </td>
                      <td className="p-6 font-mono">{user.total_points}</td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-xs font-bold text-zinc-400 hover:text-white"
                          >
                            Détails
                          </button>
                          <button 
                            onClick={() => handleResetPassword(user.id)}
                            className="text-xs font-bold text-amber-400 hover:text-amber-300"
                          >
                            Pass
                          </button>
                          <button 
                            onClick={() => {
                              setFormData(user);
                              setModalType('user-access');
                              setIsModalOpen(true);
                            }}
                            className="text-xs font-bold text-green-400 hover:text-green-300"
                          >
                            Accès
                          </button>
                          <button 
                            onClick={() => handleToggleRole(user)}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                          >
                            Rôle
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-xs font-bold text-red-400 hover:text-red-300"
                          >
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formations Tab */}
        {activeTab === 'formations' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-white">Gestion des Formations</h2>
              <BaseButton onClick={() => openModal('formation')} variant="primary" size="small">Ajouter une formation</BaseButton>
            </div>
            <div className="grid grid-cols-1 gap-5">
              {formations.map(f => (
                <div key={f.id} className="bg-gradient-to-r from-zinc-900/70 to-zinc-900/40 p-7 rounded-[28px] border border-zinc-800 flex justify-between items-center hover:border-zinc-700 transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl">
                      📖
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{f.title}</h3>
                      <p className="text-sm text-zinc-400">{f.category} • {f.price}€</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => handleEditFormation(f)} className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-sm transition-all duration-300">Modifier</button>
                    <button 
                      onClick={() => handleSelectFormationForContent(f)} 
                      className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-indigo-500/25">
                      Gérer le contenu
                    </button>
                    <button 
                      onClick={() => handleDeleteFormation(f.id)}
                      className="px-5 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-sm transition-all duration-300">
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Content Tab */}
        {activeTab === 'course-content' && selectedFormation && (
          <div className="space-y-7">
            <div className="flex justify-between items-center bg-gradient-to-r from-indigo-900/20 to-zinc-900/50 p-8 rounded-[32px] border border-indigo-500/20 shadow-xl">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-4xl">
                  📚
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">{selectedFormation.title}</h2>
                  <p className="text-md text-zinc-400">Gestion des modules et des leçons</p>
                </div>
              </div>
              <div className="flex gap-4">
                <BaseButton onClick={handleCreateModule} variant="primary" size="small">Ajouter un module</BaseButton>
                <button onClick={() => setSelectedFormation(null)} className="px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-sm transition-all duration-300">
                  Retour
                </button>
              </div>
            </div>
            
            {courseModules.length === 0 ? (
              <div className="bg-gradient-to-br from-zinc-900/70 to-zinc-900/40 p-12 rounded-[32px] border border-zinc-800 text-center">
                <div className="text-5xl mb-4 text-zinc-600">📚</div>
                <p className="text-zinc-400 text-xl">Aucun module créé pour cette formation</p>
              </div>
            ) : (
              <div className="space-y-6">
                {courseModules.map((module, idx) => (
                  <div key={module.id} className="bg-gradient-to-br from-zinc-900/70 to-zinc-900/40 rounded-[32px] border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all duration-300">
                    <div 
                      className="p-7 flex justify-between items-center cursor-pointer hover:bg-zinc-800/20 transition-all duration-300"
                      onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl">
                          📚
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{module.title}</h3>
                          {module.description && (
                            <p className="text-sm text-zinc-400">{module.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-md text-zinc-400 font-bold bg-zinc-800 px-4 py-2 rounded-xl">{module.lessons?.length || 0} leçons</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateLesson(module.id);
                          }}
                          className="px-5 py-3 rounded-2xl bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 font-bold text-sm transition-all duration-300"
                        >
                          + Leçon
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModule(module.id);
                          }}
                          className="px-5 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-sm transition-all duration-300"
                        >
                          Supprimer
                        </button>
                        <span className={`text-2xl transition-transform duration-300 ${expandedModule === module.id ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </div>
                    
                    {expandedModule === module.id && module.lessons && (
                      <div className="border-t border-zinc-800 p-7 space-y-4">
                        {module.lessons.length === 0 ? (
                          <p className="text-zinc-500 text-md">Aucune leçon dans ce module</p>
                        ) : (
                          module.lessons.map((lesson) => (
                            <div key={lesson.id} className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-700 flex justify-between items-center hover:border-zinc-600 transition-all duration-300">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl">
                                  {lesson.video_url ? '🎥' : '📄'}
                                </div>
                                <div>
                                  <h4 className="font-bold text-white text-lg">{lesson.title}</h4>
                                  {lesson.description && <p className="text-sm text-zinc-400">{lesson.description}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {lesson.duration && <span className="px-4 py-2 bg-zinc-800 rounded-xl text-sm text-zinc-400 font-bold">{lesson.duration}</span>}
                                <button 
                                  onClick={() => handleEditLesson(lesson, module.id)}
                                  className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-sm transition-all duration-300"
                                >
                                  Modifier
                                </button>
                                <button 
                                  onClick={() => handleDeleteLesson(lesson.id, module.id)}
                                  className="px-4 py-2 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-sm transition-all duration-300"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-6 rounded-[32px] border border-zinc-800">
              <div className="relative w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="Rechercher par utilisateur ou forfait..." 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-white outline-none focus:border-indigo-500 transition-all pl-12"
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
              </div>
              <BaseButton onClick={() => openModal('sub-manual')} variant="primary" size="small">Créer Manuellement</BaseButton>
            </div>

            <div className="bg-zinc-900/50 rounded-[32px] border border-zinc-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-black">
                  <tr>
                    <th className="p-6">Utilisateur</th>
                    <th className="p-6">Forfait</th>
                    <th className="p-6">Statut</th>
                    <th className="p-6">Fin</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {subscriptions.filter(s => 
                    s.user_email?.toLowerCase().includes(subSearch.toLowerCase()) || 
                    s.package_name?.toLowerCase().includes(subSearch.toLowerCase())
                  ).map(sub => (
                    <tr key={sub.id} className="text-zinc-300 hover:bg-zinc-800/20 transition-colors">
                      <td className="p-6">
                        <div className="font-bold text-white">{sub.user_name}</div>
                        <div className="text-xs text-zinc-500">{sub.user_email}</div>
                      </td>
                      <td className="p-6 font-bold text-indigo-400 uppercase text-xs">{sub.package_name}</td>
                      <td className="p-6">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                          sub.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {sub.is_active ? 'ACTIF' : 'INACTIF'}
                        </span>
                        <div className="text-[9px] text-zinc-600 mt-1 uppercase font-bold">{sub.payment_status}</div>
                      </td>
                      <td className="p-6 text-xs">{new Date(sub.end_date).toLocaleDateString()}</td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleEditSubscription(sub)} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Modifier</button>
                          <button onClick={async () => {
                            if(window.confirm("Annuler cet abonnement ?")) {
                              await adminApi.deleteSubscription(sub.id);
                              setSubscriptions(subscriptions.filter(s => s.id !== sub.id));
                            }
                          }} className="text-xs font-bold text-red-400 hover:text-red-300">Annuler</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="bg-zinc-900/50 rounded-[32px] border border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Journal d'Audit</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-black">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Admin</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="text-zinc-400 text-xs hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-4 font-bold text-white">{log.admin_email}</td>
                      <td className="p-4 uppercase font-black text-indigo-400">{log.action}</td>
                      <td className="p-4 italic">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Custom Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-2xl rounded-[40px] p-10 shadow-2xl shadow-indigo-500/10 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                {modalType === 'spotlight' ? 'Nouveau Spotlight' : 
                 modalType === 'video' ? 'Nouvelle Vidéo Elite' : 
                 modalType === 'formation' ? (formData.id ? 'Modifier Formation' : 'Nouvelle Formation') :
                 modalType === 'user-edit' ? 'Modifier Utilisateur' :
                 modalType === 'sub-edit' ? 'Modifier Abonnement' : 
                 modalType === 'plan' ? (formData.id ? 'Modifier Plan' : 'Nouveau Plan') :
                 modalType === 'live' ? 'Programmer un Live' :
                 modalType === 'user-access' ? 'Gestion des Accès' :
                 modalType === 'calendar' ? 'Ajouter au Calendrier' : 'Manual Subscription'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="space-y-6">
              {modalType === 'user-edit' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Nom Complet</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.full_name || ''}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Email</label>
                    <input 
                      required
                      type="email" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.email || ''}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Rôle</label>
                      <select 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        value={formData.role || 'standard'}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                        <option value="standard">Standard</option>
                        <option value="subscriber">Subscriber</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Statut</label>
                      <select 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        value={formData.is_active ? 'true' : 'false'}
                        onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                      >
                        <option value="true">Actif</option>
                        <option value="false">Inactif</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'sub-edit' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Statut Paiement</label>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.payment_status || 'pending'}
                      onChange={e => setFormData({...formData, payment_status: e.target.value})}
                    >
                      <option value="paid">Payé</option>
                      <option value="pending">En attente</option>
                      <option value="failed">Échoué</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Abonnement Actif</label>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                    >
                      <option value="true">Actif</option>
                      <option value="false">Inactif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Date de fin</label>
                    <input 
                      type="date" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.end_date ? new Date(formData.end_date).toISOString().split('T')[0] : ''}
                      onChange={e => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {modalType === 'sub-manual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Email Utilisateur</label>
                    <input 
                      required
                      type="email" 
                      placeholder="user@example.com"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.user_email || ''}
                      onChange={e => setFormData({...formData, user_email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Forfait</label>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.package_name || (plans.length > 0 ? plans[0].name : 'starter')}
                      onChange={e => setFormData({...formData, package_name: e.target.value})}
                    >
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.name}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Durée (mois)</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.duration_months || 1}
                      onChange={e => setFormData({...formData, duration_months: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              )}

              {modalType === 'user-access' && (
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-500/10 rounded-[24px] border border-indigo-500/20 flex justify-between items-center">
                    <div>
                      <div className="text-xl font-black text-white italic uppercase tracking-tighter">{formData.full_name || 'Utilisateur'}</div>
                      <div className="text-xs text-zinc-500 font-medium">{formData.email}</div>
                    </div>
                    {/* Show subscription status */}
                    {(() => {
                      const userSub = subscriptions.find(s => s.user_email === formData.email && s.is_active);
                      return userSub ? (
                        <div className="text-right">
                          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Abonnement Actif</div>
                          <div className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                            {userSub.package_name}
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-black uppercase tracking-wider border border-zinc-700">
                          Pas d'abonnement
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gérer les Accès aux Formations</label>
                    <div className="grid grid-cols-1 gap-2">
                      {formations.map(formation => {
                        const hasAccess = (formData.accessible_formation_ids || []).includes(formation.id);
                        return (
                          <div key={formation.id} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors">
                            <div>
                              <div className="text-sm font-bold text-white">{formation.title}</div>
                              <div className="text-[10px] text-zinc-500 uppercase">{formation.category}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleAccess(formData.id, formation.id, hasAccess)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                hasAccess 
                                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                                  : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                              }`}
                            >
                              {hasAccess ? 'Révoquer' : 'Accorder'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'plan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Nom du Plan</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: PRO PACKAGE"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Slug (ID unique)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: pro"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.slug || ''}
                      onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase()})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Prix TND (Millimes)</label>
                    <input 
                      required
                      type="number" 
                      placeholder="Ex: 29000 pour 29DT"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.price_tnd || ''}
                      onChange={e => setFormData({...formData, price_tnd: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Prix USD ($)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      placeholder="Ex: 29.99"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.price_usd || ''}
                      onChange={e => setFormData({...formData, price_usd: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Durée (Mois)</label>
                    <input 
                      required
                      type="number" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.duration_months || 1}
                      onChange={e => setFormData({...formData, duration_months: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Texte Bouton</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.button_text || 'Get Started'}
                      onChange={e => setFormData({...formData, button_text: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Fonctionnalités</label>
                    <textarea 
                      required
                      placeholder={'Une ligne par fonctionnalite\nAcces Elite Circle\nSupport prioritaire'}
                      className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all resize-none shadow-inner"
                      value={formData.features || ''}
                      onChange={e => setFormData({...formData, features: e.target.value})}
                    ></textarea>
                    <div className="mt-2 text-[10px] text-zinc-500">
                      Chaque ligne sera synchronisee automatiquement avec la section `Evolution Plans`.
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                        checked={formData.is_popular || false}
                        onChange={e => setFormData({...formData, is_popular: e.target.checked})}
                      />
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Plan Populaire</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                        checked={formData.is_active !== false}
                        onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      />
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Plan Actif</span>
                    </label>
                  </div>
                </div>
              )}

              {modalType === 'spotlight' && (
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Lien (Optionnel)</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={formData.link || ''}
                    onChange={e => setFormData({...formData, link: e.target.value})}
                  />
                </div>
              )}

              {modalType === 'video' && (
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Miniature (Optionnel)</label>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="w-full text-zinc-500 text-xs file:bg-zinc-800 file:border-none file:rounded-xl file:text-white file:font-black file:uppercase file:text-[10px] file:mr-4 file:px-6 file:py-3 hover:file:bg-zinc-700 cursor-pointer"
                      onChange={e => handleFileUpload(e, 'thumbnail_url')}
                    />
                    {formData.thumbnail_url && (
                      <div className="text-[10px] text-green-400 font-black italic truncate bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                        ✓ MINIATURE : {formData.thumbnail_url}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(modalType === 'spotlight' || modalType === 'video' || modalType === 'formation' || modalType === 'live' || modalType === 'calendar') && (
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Titre</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              )}

              {modalType === 'live' && (
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Lien Google Meet / Direct</label>
                    <input 
                      required
                      type="url" 
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.google_meet_link || ''}
                      onChange={e => setFormData({...formData, google_meet_link: e.target.value})}
                    />
                  </div>

                  {/* Archived Live Fields */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Replay Vidéo (Optionnel)</label>
                      <div className="flex flex-col gap-3">
                        <input 
                          type="file" 
                          accept="video/*"
                          className="w-full text-zinc-500 text-xs file:bg-zinc-800 file:border-none file:rounded-xl file:text-white file:font-black file:uppercase file:text-[10px] file:mr-4 file:px-6 file:py-3 hover:file:bg-zinc-700 cursor-pointer"
                          onChange={e => handleFileUpload(e, 'replay_url')}
                        />
                        {formData.replay_url && (
                          <div className="text-[10px] text-green-400 font-black italic truncate bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                            ✓ REPLAY : {formData.replay_url}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Miniature (Optionnel)</label>
                      <div className="flex flex-col gap-3">
                        <input 
                          type="file" 
                          accept="image/*"
                          className="w-full text-zinc-500 text-xs file:bg-zinc-800 file:border-none file:rounded-xl file:text-white file:font-black file:uppercase file:text-[10px] file:mr-4 file:px-6 file:py-3 hover:file:bg-zinc-700 cursor-pointer"
                          onChange={e => handleFileUpload(e, 'thumbnail_url')}
                        />
                        {formData.thumbnail_url && (
                          <div className="text-[10px] text-green-400 font-black italic truncate bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                            ✓ MINIATURE : {formData.thumbnail_url}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                        checked={formData.is_archived || false}
                        onChange={e => setFormData({...formData, is_archived: e.target.checked})}
                      />
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Archiver ce live</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Formation Associée (Optionnel)</label>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.formation_id || ''}
                      onChange={e => setFormData({...formData, formation_id: e.target.value ? parseInt(e.target.value) : null})}
                    >
                      <option value="">Aucune formation</option>
                      {formations.map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Début</label>
                      <input 
                        required
                        type="datetime-local" 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all"
                        value={formData.start_time || ''}
                        onChange={e => setFormData({...formData, start_time: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Fin</label>
                      <input 
                        required
                        type="datetime-local" 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all"
                        value={formData.end_time || ''}
                        onChange={e => setFormData({...formData, end_time: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'calendar' && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Jour</label>
                    <select 
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.day || 'Lundi'}
                      onChange={e => setFormData({...formData, day: e.target.value})}
                    >
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Heure</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: 09:00 - 11:00"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.time || ''}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Catégorie</label>
                    <select 
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.category || 'Trading'}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="Trading">Trading</option>
                      <option value="Coaching">Coaching</option>
                      <option value="Analyse">Analyse</option>
                      <option value="Psychologie">Psychologie</option>
                    </select>
                  </div>
                </div>
              )}

              {modalType === 'formation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Prix (€)</label>
                    <input 
                      required
                      type="number" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.price || ''}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Catégorie</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.category || 'analyse-technique'}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Niveau</label>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.level || 'debutant'}
                      onChange={e => setFormData({...formData, level: e.target.value})}
                    >
                      <option value="debutant">Débutant</option>
                      <option value="intermediaire">Intermédiaire</option>
                      <option value="avance">Avancé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Durée</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: 10 heures"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.duration || ''}
                      onChange={e => setFormData({...formData, duration: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Note (0-5)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="5"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.rating || 0}
                      onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Nombre d'avis</label>
                    <input 
                      type="number" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.reviews || 0}
                      onChange={e => setFormData({...formData, reviews: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Ce que vous allez apprendre (une ligne par point)</label>
                    <textarea 
                      className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all resize-none shadow-inner"
                      placeholder={'Maîtriser les bougies japonaises\nComprendre les supports et résistances'}
                      value={formData.learning_objectives || ''}
                      onChange={e => setFormData({...formData, learning_objectives: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Prérequis</label>
                    <textarea 
                      className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all resize-none shadow-inner"
                      placeholder={'Ordinateur et connexion internet\nNotions de base en mathématiques'}
                      value={formData.prerequisites || ''}
                      onChange={e => setFormData({...formData, prerequisites: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Programme (JSON ou texte libre)</label>
                    <textarea 
                      className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all resize-none shadow-inner font-mono text-xs"
                      placeholder={'Module 1: Introduction\nModule 2: Analyse Technique\n...'}
                      value={formData.curriculum_data || ''}
                      onChange={e => setFormData({...formData, curriculum_data: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Contenu complet du cours (Détails)</label>
                    <textarea 
                      required
                      className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all resize-none shadow-inner"
                      value={formData.content || ''}
                      onChange={e => setFormData({...formData, content: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              )}

              {(modalType === 'spotlight' || modalType === 'video' || modalType === 'formation') && (
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-dashed border-zinc-800">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest">
                    {modalType === 'video' ? 'Fichier Vidéo' : 'Fichier Image'}
                  </label>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="file" 
                      accept={modalType === 'video' ? "video/*" : "image/*"}
                      className="w-full text-zinc-500 text-xs file:bg-indigo-600 file:border-none file:rounded-xl file:text-white file:font-black file:uppercase file:text-[10px] file:mr-4 file:px-6 file:py-3 hover:file:bg-indigo-500 cursor-pointer"
                      onChange={e => handleFileUpload(e, modalType === 'video' ? 'video_url' : 'image_url')}
                    />
                    {uploading && <div className="text-[10px] text-indigo-400 font-black animate-pulse italic uppercase tracking-widest">Upload en cours...</div>}
                    {(formData.video_url || formData.image_url) && !uploading && (
                      <div className="text-[10px] text-green-400 font-black italic truncate bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                        ✓ PRÊT : {modalType === 'video' ? formData.video_url : formData.image_url}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {['spotlight', 'video', 'formation', 'live'].includes(modalType) && (
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">
                    Description {modalType === 'live' && '(Optionnel)'}
                  </label>
                  <textarea 
                    required={modalType !== 'live'}
                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all resize-none shadow-inner"
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
              )}

              {modalType === 'lesson-edit' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Titre de la leçon</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.title || ''}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Description</label>
                    <textarea 
                      className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all resize-none shadow-inner"
                      value={formData.description || ''}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Durée</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 15 min"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.duration || ''}
                      onChange={e => setFormData({...formData, duration: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Vidéo (URL)</label>
                    <div className="space-y-3">
                      <input 
                        type="url" 
                        placeholder="https://..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                        value={formData.video_url || ''}
                        onChange={e => setFormData({...formData, video_url: e.target.value})}
                      />
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setUploading(true);
                              try {
                                const res = await adminApi.uploadFile(file);
                                setFormData({...formData, video_url: res.data.url});
                              } catch (err) {
                                alert("Erreur lors de l'upload: " + formatError(err));
                              } finally {
                                setUploading(false);
                              }
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors"
                          onClick={() => document.querySelector('input[type="file"][accept="video/*"]').click()}
                        >
                          {uploading ? 'Upload en cours...' : '📤 Uploader une vidéo'}
                        </button>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">PDF (URL)</label>
                    <div className="space-y-3">
                      <input 
                        type="url" 
                        placeholder="https://..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                        value={formData.pdf_url || ''}
                        onChange={e => setFormData({...formData, pdf_url: e.target.value})}
                      />
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setUploading(true);
                              try {
                                const res = await adminApi.uploadFile(file);
                                setFormData({...formData, pdf_url: res.data.url});
                              } catch (err) {
                                alert("Erreur lors de l'upload: " + formatError(err));
                              } finally {
                                setUploading(false);
                              }
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors"
                          onClick={() => document.querySelector('input[type="file"][accept=".pdf"]').click()}
                        >
                          {uploading ? 'Upload en cours...' : '📤 Uploader un PDF'}
                        </button>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Ordre</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={formData.order || 0}
                      onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 rounded-[24px] bg-zinc-800 text-zinc-400 font-black uppercase text-[11px] tracking-widest hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
                >
                  {modalType === 'user-access' ? 'Fermer' : 'Annuler'}
                </button>
                {modalType !== 'user-access' && (
                  <button 
                    type="submit"
                    className="flex-1 py-5 rounded-[24px] bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
                  >
                    Confirmer
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
