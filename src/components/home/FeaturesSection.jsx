import React from 'react';
import { GraduationCap, Radio, Users, BarChart3 } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import formationCompleteImg from '../../assets/images/formation complete.png';
import sessionLiveImg from '../../assets/images/session live.png';
import communauteActiveImg from '../../assets/images/communauté active.png';
import outilsProfessionnelsImg from '../../assets/images/outils professionnels.png';
import './FeaturesSection.css';

const FeaturesSection = () => {
  const features = [
    {
      icon: GraduationCap,
      title: "Formations Complètes",
      description: "Des programmes structurés du débutant à l'expert avec des supports vidéo et PDF.",
      image: formationCompleteImg
    },
    {
      icon: Radio,
      title: "Sessions Live",
      description: "Analysez les marchés en temps réel avec nos traders professionnels.",
      image: sessionLiveImg,
      highlight: true
    },
    {
      icon: Users,
      title: "Communauté Active",
      description: "Échangez avec d'autres traders et partagez vos expériences.",
      image: communauteActiveImg
    },
    {
      icon: BarChart3,
      title: "Outils Professionnels",
      description: "Accédez à des outils d'analyse et des indicateurs performants.",
      image: outilsProfessionnelsImg
    }
  ];

  const FeatureCard = ({ feature, index }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" });

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: index * 0.15 }}
        className="feature-card group"
      >
        <div className="feature-image-container">
          <img 
            src={feature.image} 
            alt={feature.title} 
            className="feature-image"
          />
        </div>
        
        <div className="feature-content">
          <div className="feature-icon">
            <feature.icon size={24} />
          </div>
          <h3 className="feature-title">{feature.title}</h3>
          <p className="feature-description">{feature.description}</p>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="features-section">
      <div className="container">
        <h2 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="section-title text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase italic">
          POURQUOI CHOISIR <span className="gradient-text">EVOLUTION</span> ?
        </h2>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <FeatureCard feature={feature} index={index} key={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
