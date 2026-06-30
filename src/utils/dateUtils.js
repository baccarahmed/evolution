// Utility functions for dates and formatting

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options }).format(date)
}

export const getDay = (date) => {
  return date.getDate()
}

export const getMonth = (date) => {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date)
}

export const formatWeekRange = (weekStart) => {
  const start = new Date(weekStart)
  return `${start.getDate()} ${new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(start)}`
}

export const getWeekDays = (startDate) => {
  const days = []
  const startOfWeek = new Date(startDate)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    days.push({
      name: dayNames[i],
      date: date.getDate(),
      fullDate: date
    })
  }
  
  return days
}

export const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const addWeeks = (date, weeks) => {
  return addDays(date, weeks * 7)
}