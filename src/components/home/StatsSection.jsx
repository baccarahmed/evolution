import React from 'react';
import './StatsSection.css';

const StatsSection = () => {
  const stats = [
    { number: "5,000+", label: "Élèves Formés" },
    { number: "95%", label: "Taux de Satisfaction" },
    { number: "50+", label: "Heures de Contenu" },
    { number: "24/7", label: "Support Disponible" },
  ];

  return (
    <section className="stats-section overflow-hidden">
      <div className="stats-container">
        <div className="stats-track">
          {[...stats, ...stats, ...stats, ...stats].map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
