import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import BaseButton from '../components/ui/BaseButton';
import { formationsApi } from '../api'; // Import formationsApi
import './FormationDetail.css';

const FormationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formation, setFormation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  
  // States for new review
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  
  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setUser({ isAuthenticated: true });
    }
  }, []);

  const tabs = [
    { id: 'overview', label: 'Aperçu' },
    { id: 'curriculum', label: 'Programme' },
    { id: 'reviews', label: 'Avis' }
  ];

  const fetchReviews = async () => {
    try {
      const response = await formationsApi.getReviews(id);
      setReviews(response.data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  useEffect(() => {
    const fetchFormation = async () => {
      try {
        setLoading(true);
        const response = await formationsApi.getFormationById(id);
        setFormation(response.data);
        await fetchReviews();
      } catch (err) {
        console.error("Failed to fetch formation:", err);
        setError("Impossible de charger les détails de la formation.");
        navigate('/formations'); 
      } finally {
        setLoading(false);
      }
    };
    fetchFormation();
  }, [id, navigate]);

  const handleStartCourse = () => {
    if (!user?.isAuthenticated) {
      navigate('/login');
      return;
    }
    if (formation?.can_access) {
      navigate(`/formations/${id}/course`);
    } else {
      // Optionally show a message or redirect to pricing
      navigate('/register');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      setReviewError(null);
      await formationsApi.createReview(id, {
        rating: newRating,
        comment: newComment
      });
      setNewComment('');
      setNewRating(5);
      // Refresh formation details (for new average rating) and reviews
      const formationRes = await formationsApi.getFormationById(id);
      setFormation(formationRes.data);
      await fetchReviews();
    } catch (err) {
      setReviewError(err.response?.data?.detail || "Erreur lors de l'ajout de l'avis.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }

  if (!formation) {
    return <div className="not-found">Formation non trouvée.</div>;
  }

  const curriculumData = formation.curriculum_data ? 
    (typeof formation.curriculum_data === 'string' ? formation.curriculum_data.split('\n') : formation.curriculum_data) 
    : [];

  const learningObjectives = formation.learning_objectives ? 
    (typeof formation.learning_objectives === 'string' ? formation.learning_objectives.split('\n') : formation.learning_objectives) 
    : [1, 2, 3, 4, 5].map(i => `Maîtriser les concepts fondamentaux du module ${i}`);

  return (
    <div className="formation-detail">
      {/* Hero Section */}
      <section className="formation-hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="formation-badge">{formation.category}</div>
              <h1 className="formation-title">{formation.title}</h1>
              <p className="formation-description">{formation.description}</p>
              
              <div className="formation-meta">
                <div className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  <span>{formation.duration}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📊</span>
                  <span className="capitalize">{formation.level}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">⭐</span>
                  <span>{formation.rating} ({formation.reviews} avis)</span>
                </div>
              </div>

              <div className="formation-actions">
                <BaseButton 
                  variant="primary" 
                  size="large" 
                  onClick={handleStartCourse}
                >
                  {formation?.can_access ? 'Commencer la formation' : "Accéder à la formation"}
                </BaseButton>
                <div className="price-container">
                  <span className="current-price">{formation.price}</span>
                  {formation.originalPrice && (
                    <span className="original-price">{formation.originalPrice}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="hero-image">
              <div className="image-placeholder">
                <img src={formation.image_url || formation.image} alt={formation.title} />
                <div className="play-overlay">
                  <div className="play-btn">▶️</div>
                  <span>Aperçu du cours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="formation-tabs">
        <div className="container">
          <div className="tabs-header">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="content-section">
                  <h3>Ce que vous allez apprendre</h3>
                  <ul className="learn-list">
                    {learningObjectives.map((obj, index) => (
                      <li key={index}>{obj}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="content-section">
                  <h3>Prérequis</h3>
                  <ul className="prereq-list">
                    {formation.prerequisites ? (typeof formation.prerequisites === 'string' ? formation.prerequisites.split('\n') : formation.prerequisites).map((item, index) => (
                      <li key={index}>{item}</li>
                    )) : (
                      <li>Aucun prérequis particulier n'est nécessaire pour suivre cette formation, si ce n'est une connexion internet et une envie d'apprendre.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Curriculum Tab */}
            {activeTab === 'curriculum' && (
              <div className="curriculum-tab">
                <div className="curriculum-section">
                  <div className="section-header">
                    <h3>Programme de la formation</h3>
                    <span>{curriculumData.length} modules</span>
                  </div>
                  <div className="curriculum-list">
                    {curriculumData.map((module, index) => (
                      <div key={index} className="curriculum-item">
                        <div className="item-header">
                          <span className="icon">📄</span>
                          <span className="title">{module}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="reviews-tab">
                <div className="reviews-summary">
                  <div className="rating-big">{formation.rating}</div>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Math.round(formation.rating) ? 'star-filled' : 'star-empty'}>⭐</span>
                    ))}
                  </div>
                  <div className="rating-count">Basé sur {formation.reviews} avis</div>
                </div>

                {/* Add Review Form */}
                <div className="add-review-section">
                  <h4>Laisser un avis</h4>
                  <form onSubmit={handleSubmitReview} className="review-form">
                    <div className="rating-input">
                      <span>Votre note :</span>
                      <select 
                        value={newRating} 
                        onChange={(e) => setNewRating(parseInt(e.target.value))}
                        className="rating-select"
                      >
                        {[5, 4, 3, 2, 1].map(num => (
                          <option key={num} value={num}>{num} Étoiles</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      placeholder="Partagez votre expérience sur cette formation..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="review-textarea"
                    ></textarea>
                    {reviewError && <div className="review-error-msg">{reviewError}</div>}
                    <BaseButton 
                      type="submit" 
                      variant="primary" 
                      disabled={submitting}
                    >
                      {submitting ? 'Envoi...' : 'Publier l\'avis'}
                    </BaseButton>
                  </form>
                </div>

                <div className="reviews-list">
                  {reviews.length > 0 ? reviews.map(review => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <div className="review-avatar">👤</div>
                        <div className="review-meta">
                          <strong>{review.author_name}</strong>
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="review-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= review.rating ? 'star-filled' : 'star-empty'}>⭐</span>
                          ))}
                        </div>
                      </div>
                      <p className="review-text">{review.comment}</p>
                    </div>
                  )) : (
                    <p className="no-reviews">Aucun avis pour le moment. Soyez le premier à en laisser un !</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FormationDetail;
