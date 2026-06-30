import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Video, Camera } from 'lucide-react';
import { GeometricSplitText } from '../ui/GeometricSplitText';
import './AppFooter.css';

const AppFooter = () => {
  return (
    <footer className="footer relative overflow-hidden bg-black">
      {/* Background Text */}
      <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden px-[10vw]">
        <GeometricSplitText 
          text="EVOLUTION"
          className="opacity-10 w-full"
          textClassName="text-[12vw] md:text-[15vw] font-black leading-none tracking-tighter uppercase italic text-[rgb(160,32,240)] text-center"
          subText="TRADING ACADEMY"
          subTextClassName="text-[2vw] text-white font-bold tracking-[1em]"
        />
      </div>

      <div className="container relative z-10">
        <div className="footer-content">
          <div className="footer-section">
            <h3 style={{ fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif' }} className="footer-title">EVOLUTION</h3>
            <p className="footer-description">
              Plateforme d'éducation au trading pour apprendre et maîtriser les marchés financiers.
            </p>
            <div className="social-links">
              <a href="#" className="social-link telegram" aria-label="Telegram">
                <Send size={22} color="#26A5E4" />
              </a>
              <a href="#" className="social-link youtube" aria-label="YouTube">
                <Video size={22} color="#FF0000" />
              </a>
              <a href="#" className="social-link instagram" aria-label="Instagram">
                <Camera size={22} color="#D6249F" />
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Formations</h4>
            <ul className="footer-links">
              <li><Link to="/formations">Cours Débutant</Link></li>
              <li><Link to="/formations">Cours Avancé</Link></li>
              <li><Link to="/formations">Analyse Technique</Link></li>
              <li><Link to="/formations">Gestion des Risques</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Ressources</h4>
            <ul className="footer-links">
              <li><Link to="/lives">Sessions Live</Link></li>
              <li><Link to="/community">Communauté</Link></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Support</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact</Link></li>
              <li><a href="#">Aide</a></li>
              <li><a href="#">Conditions</a></li>
              <li><a href="#">Confidentialité</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2026 EVOLUTION. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
