import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './FAQ.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqItems = [
    {
      question: 'Comment accéder à mes formations ?',
      answer: 'Une fois connecté, rendez-vous sur votre Tableau de Bord pour retrouver tous vos cours en cours. Vous pouvez aussi accéder à la page Formations pour voir toutes les formations disponibles.'
    },
    {
      question: 'Proposez-vous un remboursement ?',
      answer: 'Oui, nous offrons une garantie satisfait ou remboursé de 14 jours sur toutes nos formations. Si vous n\'êtes pas satisfait, contactez notre support pour demander un remboursement.'
    },
    {
      question: 'Comment rejoindre les sessions live ?',
      answer: 'Les liens vers les sessions live sont disponibles sur la page "Lives" 15 minutes avant le début. Assurez-vous d\'être connecté pour y accéder.'
    },
    {
      question: 'Quels sont les moyens de paiement acceptés ?',
      answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et les cryptomonnaies via notre intégration de paiement.'
    },
    {
      question: 'Puis-je suivre les formations sur mobile ?',
      answer: 'Absolument ! Notre plateforme est entièrement responsive et optimisée pour les mobiles et les tablettes.'
    },
    {
      question: 'Comment obtenir un certificat ?',
      answer: 'Vous recevez automatiquement un certificat de complétion lorsque vous terminez toutes les leçons d\'une formation. Les certificats sont disponibles dans la section Certificats de votre tableau de bord.'
    },
    {
      question: 'Y a-t-il un support technique disponible ?',
      answer: 'Oui, notre équipe de support est disponible 24h/24 et 7j/7. Vous pouvez nous contacter via la page Contact ou par email à support@evolutionacademy.com.'
    },
    {
      question: 'Puis-je partager mon compte avec quelqu\'un d\'autre ?',
      answer: 'Non, chaque compte est personnel et non transférable. Le partage de compte est interdit et peut entraîner la résiliation de votre accès.'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq">
      <motion.section 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container">
          <h1 className="page-title">Foire Aux Questions</h1>
          <p className="page-description">
            Trouvez les réponses à vos questions les plus fréquentes.
          </p>
        </div>
      </motion.section>

      <section className="faq-content">
        <div className="container">
          <motion.div 
            className="faq-list"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {faqItems.map((item, index) => (
              <motion.div 
                key={index} 
                className="faq-item"
                variants={itemVariants}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{item.question}</span>
                  {openIndex === index ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
                <motion.div 
                  className="faq-answer"
                  initial={false}
                  animate={{ 
                    height: openIndex === index ? 'auto' : 0,
                    opacity: openIndex === index ? 1 : 0,
                    paddingTop: openIndex === index ? '1rem' : 0,
                    paddingBottom: openIndex === index ? '1.5rem' : 0
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <p>{item.answer}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
