import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Briefcase, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  Globe, 
  Target, 
  Wrench,
  ArrowRight 
} from 'lucide-react';

const navItems = [
  { name: "Formations", hasDropdown: true, path: "/formations" },
  { name: "Lives", hasDropdown: false, path: "/lives" },
  { name: "Communauté", hasDropdown: false, path: "/community" },
  { name: "Contact", hasDropdown: false, path: "/contact" },
];

const megaMenuData = [
  { 
    icon: TrendingUp, 
    title: "Analyse Technique", 
    desc: "Maîtrisez les graphiques et les indicateurs.", 
    badge: "Populaire" 
  },
  { 
    icon: ShieldCheck, 
    title: "Gestion des Risques", 
    desc: "Protégez votre capital avec rigueur.", 
    badge: null 
  },
  { 
    icon: Coins, 
    title: "Cryptomonnaies", 
    desc: "Le guide complet du trading crypto.", 
    badge: "New" 
  },
  { 
    icon: Globe, 
    title: "Forex & Indices", 
    desc: "Tradez les marchés mondiaux.", 
    badge: null 
  },
  { 
    icon: Target, 
    title: "Stratégies Pro", 
    desc: "Setups avancés pour traders élites.", 
    badge: "Premium" 
  },
  { 
    icon: Wrench, 
    title: "Outils de Trading", 
    desc: "Les meilleures plateformes et journaux.", 
    badge: null 
  }
];

const DynamicNavigation = () => {
  const [hoveredMenu, setHoveredMenu] = useState(null);

  return (
    <div className="hidden md:flex items-center h-full gap-8 m-0 py-2">
      {navItems.map((item) => (
        <div 
          key={item.name}
          className="h-full flex items-center px-5 font-semibold text-sm text-zinc-400 hover:text-zinc-100 cursor-pointer transition-colors relative group"
          onMouseEnter={() => item.hasDropdown && setHoveredMenu(item.name)}
          onMouseLeave={() => setHoveredMenu(null)}
        >
          <Link to={item.path} className="flex items-center no-underline text-inherit h-full">
            {item.name}
            {item.hasDropdown && (
              <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform opacity-70 ${hoveredMenu === item.name ? 'rotate-180 text-indigo-400' : ''}`} />
            )}
          </Link>
          
          {/* Bottom highlight line */}
          {hoveredMenu === item.name && (
            <motion.div 
              layoutId="nav-highlight"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full z-[60]"
            />
          )}

          {/* Dropdown Panel */}
          <AnimatePresence>
            {item.hasDropdown && hoveredMenu === item.name && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] bg-black/95 backdrop-blur-3xl border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[32px] p-8 cursor-default flex overflow-hidden z-[100] mt-4 before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:w-4 before:h-4 before:rotate-45 before:-z-10 before:bg-black before:border-l before:border-t before:border-zinc-800"
              >
                {/* Left Grid */}
                <div className="w-2/3 grid grid-cols-2 gap-x-8 gap-y-6 pr-8 border-r border-zinc-800/80">
                  {megaMenuData.map((menuItem) => (
                    <Link 
                      key={menuItem.title} 
                      to="/formations"
                      className="flex gap-4 group cursor-pointer hover:bg-zinc-900 p-3 -m-3 rounded-2xl transition-colors no-underline"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center shrink-0 shadow-sm transition-all">
                        <menuItem.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-zinc-100">{menuItem.title}</h4>
                          {menuItem.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">{menuItem.badge}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-zinc-500">{menuItem.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Right Marketing Area */}
                <div className="w-1/3 pl-8 flex flex-col justify-between">
                  <Link to="/formations" className="no-underline group/masterclass">
                    <div>
                      <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-4">Masterclass</h3>
                      <div className="w-full h-32 bg-zinc-900 rounded-2xl mb-4 overflow-hidden relative group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 group-hover/masterclass:opacity-50 transition-opacity"></div>
                        <Briefcase className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500 scale-100 group-hover/masterclass:scale-125 transition-transform" />
                      </div>
                      <h4 className="font-bold text-sm text-zinc-100 mb-2">Devenir Pro en 90 Jours</h4>
                      <p className="text-xs font-medium text-zinc-500 mb-6">Accédez à notre programme intensif de trading et transformez vos résultats.</p>
                    </div>
                  </Link>
                  
                  <Link to="/formations" className="flex items-center font-bold text-indigo-500 text-xs hover:text-indigo-600 transition-colors no-underline">
                    Voir les cours <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default DynamicNavigation;
