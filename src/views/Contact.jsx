import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Video, Camera } from 'lucide-react';
import { settingsApi } from '../api';
import BaseButton from '../components/ui/BaseButton';
import './Contact.css';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsApi.getSettings();
        const settingsObj = {};
        res.data.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        setSettings(settingsObj);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const handleSubmitContact = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Contact form submitted:', contactForm);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.');
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 1500);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setContactForm(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="contact">
      <motion.section 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container">
          <h1 className="page-title">Contactez-nous</h1>
          <p className="page-description">
            Une question ? Un problème technique ? Notre équipe est là pour vous aider.
          </p>
        </div>
      </motion.section>

      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            <motion.div 
              className="contact-info"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="info-card" variants={itemVariants}>
                <h2 className="info-title">Nos coordonnées</h2>
                <div className="info-items">
                  <div className="info-item">
                    <span className="info-icon">📧</span>
                    <div className="info-text">
                      <strong>Email</strong>
                      <p>{settings.contact_email || 'support@evolutionacademy.com'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📞</span>
                    <div className="info-text">
                      <strong>Téléphone</strong>
                      <p>{settings.contact_phone || '+33 (0)1 23 45 67 89'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">⏰</span>
                    <div className="info-text">
                      <strong>Horaires</strong>
                      <p>{settings.contact_hours || 'Lundi - Vendredi: 9h00 - 18h00'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div className="social-card" variants={itemVariants}>
                <h3 className="social-title">Suivez-nous</h3>
                <div className="social-links">
                  {settings.telegram_url && (
                    <a href={settings.telegram_url} target="_blank" rel="noopener noreferrer" className="social-link telegram" aria-label="Telegram">
                      <Send size={24} color="#26A5E4" />
                      <span>Telegram</span>
                    </a>
                  )}
                  {settings.youtube_url && (
                    <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="social-link youtube" aria-label="YouTube">
                      <Video size={24} color="#FF0000" />
                      <span>YouTube</span>
                    </a>
                  )}
                  {settings.instagram_url && (
                    <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="social-link instagram" aria-label="Instagram">
                      <Camera size={24} color="#D6249F" />
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="contact-form-container"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="form-card">
                <h2 className="form-title">Envoyez-nous un message</h2>
                <form onSubmit={handleSubmitContact} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Nom complet</label>
                      <input 
                        type="text" 
                        id="name" 
                        value={contactForm.name}
                        onChange={handleInputChange}
                        placeholder="Jean Dupont"
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        value={contactForm.email}
                        onChange={handleInputChange}
                        placeholder="votre@email.com"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject">Sujet</label>
                    <select 
                      id="subject" 
                      value={contactForm.subject} 
                      onChange={handleInputChange}
                      className="form-input" 
                      required
                    >
                      <option value="">Choisissez un sujet</option>
                      <option value="support">Support Technique</option>
                      <option value="billing">Facturation</option>
                      <option value="content">Contenu Pédagogique</option>
                      <option value="partnership">Partenariat</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea 
                      id="message" 
                      value={contactForm.message}
                      onChange={handleInputChange}
                      placeholder="Comment pouvons-nous vous aider ?"
                      className="form-input"
                      rows="6"
                      required
                    ></textarea>
                  </div>

                  <BaseButton variant="primary" size="large" fullWidth={true} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                  </BaseButton>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="faq-preview">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Questions Fréquentes
          </motion.h2>
          <motion.div 
            className="faq-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="faq-item" variants={itemVariants}>
              <h3>Comment accéder à mes formations ?</h3>
              <p>Une fois connecté, rendez-vous sur votre Tableau de Bord pour retrouver tous vos cours en cours.</p>
            </motion.div>
            <motion.div className="faq-item" variants={itemVariants}>
              <h3>Proposez-vous un remboursement ?</h3>
              <p>Oui, nous offrons une garantie satisfait ou remboursé de 14 jours sur toutes nos formations.</p>
            </motion.div>
            <motion.div className="faq-item" variants={itemVariants}>
              <h3>Comment rejoindre les sessions live ?</h3>
              <p>Les liens vers les sessions live sont disponibles sur la page "Lives" 15 minutes avant le début.</p>
            </motion.div>
          </motion.div>
          <div className="faq-cta">
            <Link to="/faq" className="btn btn-secondary">Voir toute la FAQ</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
