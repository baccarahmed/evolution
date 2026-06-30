/**
 * Utility to format API errors, specifically handling FastAPI's validation error format.
 * @param {Error} err The error object from axios or catch block
 * @returns {string} A human-readable error message
 */
export const formatError = (err) => {
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return "Impossible de joindre le backend. Vérifiez que l'API FastAPI tourne sur http://127.0.0.1:8000.";
  }

  if (err.response?.data?.detail) {
    const detail = err.response.data.detail;
    
    // Handle FastAPI's list of validation errors
    if (Array.isArray(detail)) {
      return detail.map(d => {
        const field = d.loc ? d.loc.filter(l => l !== 'body' && l !== 'query').join(' > ') : '';
        return `${field ? field + ': ' : ''}${d.msg}`;
      }).join('\n');
    }
    
    // Handle single string error (manual HTTPException)
    if (typeof detail === 'string') {
      return detail;
    }
    
    // Fallback for other object structures in detail
    return JSON.stringify(detail);
  }
  
  // Standard Axios/JS error
  return err.message || "Une erreur inconnue est survenue";
};
