
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { certificatesApi } from '../api';
import './Certificates.css';

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await certificatesApi.getMyCertificates();
        setCertificates(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = (certificate) => {
    const certificateLabel = certificate.custom_title || certificate.formation_title || 'Certificat personnalisé';
    alert(`Téléchargement du certificat en cours...\nCertificat #${certificate.certificate_number} pour ${certificateLabel} à imprimer ou télécharger!`);
  };

  return (
    <div className="certificates-page text-white">
      <div className="container px-4 sm:px-6">
        <div className="certificates-header">
        <h1 className="page-title">Mes Certificats</h1>
        <p className="page-subtitle">Vos réussites et certifications acquises</p>
        </div>

        {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des certificats...</p>
        </div>
      ) : error ? (
        <div className="error-message">Erreur: {error}</div>
      ) : certificates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h2>Aucun certificat pour le moment</h2>
          <p>Terminez vos formations pour débloquer des certificats</p>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map((cert) => (
            <div key={cert.id} className="certificate-card">
              <div className="certificate-header">
                <div className="certificate-icon">🏆</div>
                <div className="certificate-badge">
                  {cert.certificate_number}
                </div>
              </div>
              <div className="certificate-body">
                <h3 className="certificate-title">{cert.custom_title || cert.formation_title || 'Certificat personnalisé'}</h3>
                <p className="certificate-recipient">
                  Type: {cert.certificate_type === 'custom' ? 'Certificat personnalisé' : 'Fin de formation'}
                </p>
                <p className="certificate-recipient">Décerné à: {cert.user_name}</p>
                {cert.formation_title && (
                  <p className="certificate-recipient">Formation: {cert.formation_title}</p>
                )}
                {cert.custom_message && (
                  <p className="certificate-recipient">{cert.custom_message}</p>
                )}
                {cert.issuer_name && (
                  <p className="certificate-recipient">Signé par: {cert.issuer_name}</p>
                )}
                <p className="certificate-date">
                  Date d'émission: {formatDate(cert.issued_at)}</p>
              </div>
              <div className="certificate-footer">
                <button
                  className="download-btn"
                  onClick={() => handleDownload(cert)}
                >
                  Télécharger le certificat
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
