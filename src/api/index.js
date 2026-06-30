import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const livesApi = {
  getLives: () => api.get('/lives/'),
  getUpcomingLives: () => api.get('/lives/upcoming'),
  getArchivedLives: () => api.get('/lives/archived'),
  getLiveById: (id) => api.get(`/lives/${id}`),
  registerForLive: (id) => api.post(`/lives/${id}/register`),
  getCalendar: () => api.get('/calendar/'),
  getPublicPlans: () => api.get('/plans/'),
};

export const authApi = {
  login: (username, password) => api.post('/token', new URLSearchParams({
    username: username,
    password: password
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }),
  register: (email, password, fullName) => api.post('/users/', { 
    email, 
    password, 
    full_name: fullName 
  }),
  getMe: () => api.get('/users/me'),
  getDashboard: () => api.get('/users/me/dashboard'),
  updateProfile: (data) => api.put('/users/me', data),
  cancelSubscription: () => api.post('/subscriptions/me/cancel'),
};

export const formationsApi = {
    getFormations: () => api.get("/formations/"),
    getFormationById: (id) => api.get(`/formations/${id}`),
    createFormation: (formationData) => api.post("/admin/formations/", formationData),
    getReviews: (id) => api.get(`/formations/${id}/reviews`),
    createReview: (id, reviewData) => api.post(`/formations/${id}/reviews`, reviewData),
    getModules: (id) => api.get(`/formations/${id}/modules`),
};

export const courseContentApi = {
    // Modules
    getModules: (formationId) => api.get(`/formations/${formationId}/modules`),
    createModule: (formationId, moduleData) => api.post(`/admin/formations/${formationId}/modules`, moduleData),
    updateModule: (moduleId, moduleData) => api.put(`/admin/modules/${moduleId}`, moduleData),
    deleteModule: (moduleId) => api.delete(`/admin/modules/${moduleId}`),
    
    // Lessons
    createLesson: (moduleId, lessonData) => api.post(`/admin/modules/${moduleId}/lessons`, lessonData),
    updateLesson: (lessonId, lessonData) => api.put(`/admin/lessons/${lessonId}`, lessonData),
    deleteLesson: (lessonId) => api.delete(`/admin/lessons/${lessonId}`),
};

export const subscriptionsApi = {
  getSubscriptions: () => api.get('/subscriptions/'),
  getSubscriptionById: (id) => api.get(`/subscriptions/${id}`),
  createSubscription: (subscriptionData) => api.post('/subscriptions/', subscriptionData),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users/'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  resetUserPassword: (id) => api.post(`/users/${id}/reset-password`),
  
  createFormation: (data) => api.post('/admin/formations/', data),
  updateFormation: (id, data) => api.put(`/admin/formations/${id}`, data),
  deleteFormation: (id) => api.delete(`/admin/formations/${id}`),
  
  getSubscriptions: () => api.get('/admin/subscriptions/'),
  updateSubscription: (id, data) => api.put(`/admin/subscriptions/${id}`, data),
  deleteSubscription: (id) => api.delete(`/admin/subscriptions/${id}`),
  createManualSubscription: (data) => api.post('/admin/subscriptions/manual', data),
  
  getAuditLogs: () => api.get('/admin/audit-logs'),
  
  // New Admin Endpoints
  getLives: () => api.get('/admin/lives/'),
  getArchivedLives: () => api.get('/lives/archived'),
  createLive: (data) => api.post('/admin/lives/', data),
  updateLive: (id, data) => api.put(`/admin/lives/${id}`, data),
  deleteLive: (id) => api.delete(`/admin/lives/${id}`),
  getCalendar: () => api.get('/calendar/'),
  createCalendarEvent: (data) => api.post('/calendar/', data),
  deleteCalendarEvent: (id) => api.delete(`/calendar/${id}`),
  getSettings: () => api.get('/settings/'),
  updateSetting: (data) => api.put('/settings/', data),
  // Even more Admin Endpoints
  getSpotlights: () => api.get('/spotlights/'),
  createSpotlight: (data) => api.post('/spotlights/', data),
  deleteSpotlight: (id) => api.delete(`/spotlights/${id}`),
  
  // Plans & Pricing
  getPlans: () => api.get('/admin/pricing-plans/'),
  createPlan: (data) => api.post('/admin/pricing-plans/', data),
  updatePlan: (id, data) => api.put(`/admin/pricing-plans/${id}`, data),
  deletePlan: (id) => api.delete(`/admin/pricing-plans/${id}`),
  
  getPromotions: () => api.get('/admin/promotions/'),
  createPromotion: (data) => api.post('/admin/promotions/', data),
  deletePromotion: (id) => api.delete(`/admin/promotions/${id}`),
  // Elite Circle Video Endpoints
  getEliteVideos: () => api.get('/elite-videos/'),
  createEliteVideo: (data) => api.post('/elite-videos/', data),
  deleteEliteVideo: (id) => api.delete(`/elite-videos/${id}`),
  
  // Manual Access Management
  grantFormationAccess: (userId, formationId) => api.post(`/admin/users/${userId}/grant-access/${formationId}`),
  revokeFormationAccess: (userId, formationId) => api.delete(`/admin/users/${userId}/revoke-access/${formationId}`),

  // Community Moderation
  getPendingPosts: () => api.get('/admin/community/pending'),
  approvePost: (id, isApproved) => api.post(`/admin/community/posts/${id}/approve`, { is_approved: isApproved }),
  deletePost: (id) => api.delete(`/admin/community/posts/${id}`),
  deleteComment: (id) => api.delete(`/admin/community/comments/${id}`),

  // File Upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),
};

export const paymentsApi = {
  createCheckoutSession: (planName) => api.post(`/payments/create-checkout-session/?plan_name=${encodeURIComponent(planName)}`),
  createHybridPayment: (plan, gateway) => api.post('/api/payment/create', { plan, gateway }),
};

export const notificationsApi = {
  getNotifications: (unreadOnly = false) => api.get(`/notifications/?unread_only=${unreadOnly}`),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};

export const communityApi = {
  getPosts: (skip = 0, limit = 20) => api.get(`/community/posts?skip=${skip}&limit=${limit}`),
  createPost: (content, type = 'discussion') => api.post('/community/posts', { content, type }),
  likePost: (id) => api.post(`/community/posts/${id}/like`),
  commentPost: (id, content) => api.post(`/community/posts/${id}/comment`, { content }),
  sharePost: (id) => api.post(`/community/posts/${id}/share`),
  getStats: () => api.get('/community/stats'),
};

export const certificatesApi = {
  getMyCertificates: () => api.get('/users/me/certificates'),
  getCertificate: (id) => api.get(`/certificates/${id}`),
  issueCertificate: (payload) => api.post('/admin/certificates', payload),
};

export const progressApi = {
  getMyFormationProgress: () => api.get('/users/me/formation-progress'),
  updateLessonProgress: (lessonId, data) => api.post(`/lessons/${lessonId}/progress`, data),
  getLessonProgress: (lessonId) => api.get(`/lessons/${lessonId}/progress`),
};

// Add getAnalytics to adminApi (we'll update the existing adminApi object)

export const settingsApi = {
    getSettings: () => api.get('/settings/'),
};

export default api;
