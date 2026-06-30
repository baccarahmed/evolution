import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatError } from '../utils/errorUtils';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData.email, formData.password, formData.name); 
      alert('Inscription réussie ! Veuillez vous connecter.');
      navigate('/login');
    } catch (err) {
      console.error('Registration failed:', err);
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <div className="auth-card form-container">
          <div className="auth-header">
            <h1 className="auth-title">Inscription</h1>
            <p className="auth-subtitle">Commencez votre voyage dans le trading dès aujourd'hui</p>
          </div>

          {error && (
            <div className="form-group">
              <div className="error-message">
                <AlertCircle size={20} />
                {error}
              </div>
            </div>
          )}
          
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">
                <User size={18} />
                Nom complet
                <span className="required-star">*</span>
              </label>
              <input 
                type="text" 
                id="name" 
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Jean Dupont" 
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email
                <span className="required-star">*</span>
              </label>
              <input 
                type="email" 
                id="email" 
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre@email.com" 
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">
                <Lock size={18} />
                Mot de passe
                <span className="required-star">*</span>
              </label>
              <input 
                type="password" 
                id="password" 
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••" 
                required
              />
              <p className="input-hint" style={{ 
                color: 'rgba(255,255,255,0.6)', 
                fontSize: '0.875rem', 
                marginTop: '0.5rem' 
              }}>
                Minimum 8 caractères
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={18} />
                Confirmer le mot de passe
                <span className="required-star">*</span>
              </label>
              <input 
                type="password" 
                id="confirmPassword" 
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••" 
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="acceptTerms" style={{ cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="acceptTerms" 
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  required 
                />
                J'accepte les <a href="#">conditions d'utilisation</a> et la <a href="#">politique de confidentialité</a>
              </label>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? (
                <>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTopColor: 'white', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite', 
                    marginRight: '0.5rem' 
                  }}></div>
                  Inscription en cours...
                </>
              ) : 'Créer un compte'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Vous avez déjà un compte ? <Link to="/login">Se connecter</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
