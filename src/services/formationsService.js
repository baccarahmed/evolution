// Formation data service
export const formationsData = [
  {
    id: 1,
    title: 'Trading pour Débutants',
    description: 'Apprenez les bases du trading, comprenez les marchés financiers et développez votre première stratégie.',
    level: 'debutant',
    category: 'analyse-technique',
    duration: '8 heures',
    price: '€99',
    originalPrice: '€149',
    rating: 4.8,
    reviews: 234,
    image: '/api/placeholder/300/200'
  },
  {
    id: 2,
    title: 'Analyse Technique Avancée',
    description: 'Maîtrisez les indicateurs techniques, les patterns chartistes et les stratégies de scalping.',
    level: 'avance',
    category: 'analyse-technique',
    duration: '12 heures',
    price: '€199',
    rating: 4.9,
    reviews: 156,
    image: '/api/placeholder/300/200'
  },
  {
    id: 3,
    title: 'Gestion des Risques',
    description: 'Apprenez à protéger votre capital et optimiser vos ratios risque/rendement.',
    level: 'intermediaire',
    category: 'risk-management',
    duration: '6 heures',
    price: '€79',
    originalPrice: '€119',
    rating: 4.7,
    reviews: 89,
    image: '/api/placeholder/300/200'
  },
  {
    id: 4,
    title: 'Psychologie du Trading',
    description: 'Développez la discipline mentale nécessaire pour réussir dans le trading.',
    level: 'intermediaire',
    category: 'psychology',
    duration: '4 heures',
    price: '€69',
    rating: 4.6,
    reviews: 67,
    image: '/api/placeholder/300/200'
  },
  {
    id: 5,
    title: 'Analyse Fondamentale',
    description: 'Évaluez la valeur intrinsèque des actifs grâce à l\'analyse économique et financière.',
    level: 'avance',
    category: 'analyse-fondamentale',
    duration: '10 heures',
    price: '€149',
    rating: 4.8,
    reviews: 112,
    image: '/api/placeholder/300/200'
  },
  {
    id: 6,
    title: 'Stratégies de Day Trading',
    description: 'Découvrez les techniques professionnelles pour trader efficacement en intraday.',
    level: 'intermediaire',
    category: 'analyse-technique',
    duration: '8 heures',
    price: '€129',
    originalPrice: '€179',
    rating: 4.9,
    reviews: 198,
    image: '/api/placeholder/300/200'
  }
]

// Filter formations
export const filterFormations = (formations, filters) => {
  return formations.filter(formation => {
    const matchesLevel = !filters.level || formation.level === filters.level
    const matchesCategory = !filters.category || formation.category === filters.category
    const matchesSearch = !filters.search || 
      formation.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      formation.description.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesLevel && matchesCategory && matchesSearch
  })
}

// Get formations by level
export const getFormationsByLevel = (formations, level) => {
  return formations.filter(formation => formation.level === level)
}

// Get formations by category
export const getFormationsByCategory = (formations, category) => {
  return formations.filter(formation => formation.category === category)
}

// Sort formations by rating
export const sortFormationsByRating = (formations) => {
  return [...formations].sort((a, b) => b.rating - a.rating)
}

// Sort formations by price (low to high)
export const sortFormationsByPrice = (formations) => {
  return [...formations].sort((a, b) => {
    const priceA = parseInt(a.price.replace('€', ''))
    const priceB = parseInt(b.price.replace('€', ''))
    return priceA - priceB
  })
}