import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BaseButton from '../components/ui/BaseButton';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { formatError } from '../utils/errorUtils';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      const response = await authApi.getMe();
      const userData = response.data;
      
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="auth-card form-container">
          <div className="auth-header">
            <h1 className="auth-title">Connexion</h1>
            <p className="auth-subtitle">Accédez à votre espace de trading</p>
          </div>
          
          {error && (
            <div className="form-group">
              <div className="error-message">
                <AlertCircle size={20} />
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email
                <span className="required-star">*</span>
              </label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="votre@email.com" 
                required
              />
            </div>
            
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">
                  <Lock size={18} />
                  Mot de passe
                  <span className="required-star">*</span>
                </label>
                <a href="#" className="forgot-link">Mot de passe oublié ?</a>
              </div>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••" 
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="remember" style={{ cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Se souvenir de moi
              </label>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Pas encore de compte ? <Link to="/register">S'inscrire</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
