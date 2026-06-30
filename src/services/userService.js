// User data service
export const userData = {
  name: 'Jean Dupont',
  email: 'jean.dupont@email.com',
  avatar: '👨‍💼',
  stats: {
    formationsCompleted: 12,
    livesAttended: 8,
    currentStreak: 15,
    totalPoints: 2450
  },
  rank: 47
}

// Dashboard data
export const dashboardData = {
  inProgressCourses: [
    {
      id: 1,
      title: 'Analyse Technique Avancée',
      progress: 75
    },
    {
      id: 2,
      title: 'Gestion des Risques',
      progress: 45
    },
    {
      id: 3,
      title: 'Psychologie du Trading',
      progress: 20
    }
  ],
  recentAchievements: [
    {
      id: 1,
      title: 'Apprenti Trader',
      description: 'Terminer 5 formations',
      icon: '🎓',
      unlocked: true
    },
    {
      id: 2,
      title: 'Analyste Junior',
      description: 'Compléter le module d\'analyse technique',
      icon: '📊',
      unlocked: true
    },
    {
      id: 3,
      title: 'Risk Manager',
      description: 'Maîtriser la gestion des risques',
      icon: '🛡️',
      unlocked: false
    },
    {
      id: 4,
      title: 'Trader Confirmé',
      description: 'Assister à 20 sessions live',
      icon: '🏆',
      unlocked: false
    }
  ],
  recentActivities: [
    {
      id: 1,
      title: 'Formation "Analyse Technique" terminée',
      time: 'Il y a 2 heures',
      icon: '🎓',
      points: 50
    },
    {
      id: 2,
      title: 'Session live assistée',
      time: 'Hier',
      icon: '🔴',
      points: 25
    },
    {
      id: 3,
      title: 'Quiz réussi - Gestion des risques',
      time: 'Il y a 2 jours',
      icon: '✅',
      points: 30
    },
    {
      id: 4,
      title: 'Nouveau badge débloqué',
      time: 'Il y a 3 jours',
      icon: '🏅',
      points: 0
    }
  ],
  learningPath: [
    {
      id: 1,
      title: 'Les Bases du Trading',
      description: 'Comprendre les marchés financiers',
      completed: true,
      current: false
    },
    {
      id: 2,
      title: 'Analyse Technique',
      description: 'Apprendre à lire les graphiques',
      completed: true,
      current: false
    },
    {
      id: 3,
      title: 'Gestion des Risques',
      description: 'Protéger votre capital',
      completed: false,
      current: true
    },
    {
      id: 4,
      title: 'Stratégies de Trading',
      description: 'Développer votre edge',
      completed: false,
      current: false
    },
    {
      id: 5,
      title: 'Psychologie',
      description: 'Maîtriser vos émotions',
      completed: false,
      current: false
    }
  ]
}

// Community data
export const communityData = {
  stats: {
    totalMembers: 2847,
    dailyMessages: 342,
    onlineNow: 156
  },
  onlineUsers: [
    {
      id: 1,
      name: 'Marc Trading',
      avatar: '🧑‍💼',
      status: 'Analyse EUR/USD'
    },
    {
      id: 2,
      name: 'Sophie Analyst',
      avatar: '👩‍💼',
      status: 'Dispo pour questions'
    },
    {
      id: 3,
      name: 'David Risk',
      avatar: '🧑‍💻',
      status: 'En formation'
    },
    {
      id: 4,
      name: 'Alex Crypto',
      avatar: '👨‍💼',
      status: 'Trading BTC'
    }
  ],
  trendingTopics: [
    { id: 1, tag: 'EURUSD', posts: 24 },
    { id: 2, tag: 'Bitcoin', posts: 18 },
    { id: 3, tag: 'RiskManagement', posts: 15 },
    { id: 4, tag: 'ForexAnalysis', posts: 12 },
    { id: 5, tag: 'CryptoNews', posts: 9 }
  ]
}