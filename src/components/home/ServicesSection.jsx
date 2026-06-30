import React from 'react';
import { BookOpen, Video, Users, TrendingUp } from 'lucide-react';
import './ServicesSection.css';

const ServicesSection = () => {
  const services = [
    {
      icon: BookOpen,
      title: "Cours Théoriques",
      description: "Apprenez les bases du trading avec nos modules structurés et nos guides PDF complets.",
      gradient: "from-blue-500/20 to-cyan-500/20",
      hoverGradient: "from-blue-500/30 to-cyan-500/30",
      iconGradient: "from-blue-400 to-cyan-400"
    },
    {
      icon: Video,
      title: "Formations Vidéo",
      description: "Des centaines d'heures de contenu vidéo haute définition pour maîtriser l'analyse technique.",
      gradient: "from-purple-500/20 to-pink-500/20",
      hoverGradient: "from-purple-500/30 to-pink-500/30",
      iconGradient: "from-purple-400 to-pink-400"
    },
    {
      icon: Users,
      title: "Coaching de Groupe",
      description: "Rejoignez nos sessions hebdomadaires pour poser vos questions et progresser ensemble.",
      gradient: "from-amber-500/20 to-orange-500/20",
      hoverGradient: "from-amber-500/30 to-orange-500/30",
      iconGradient: "from-amber-400 to-orange-400"
    },
    {
      icon: TrendingUp,
      title: "Analyse de Marché",
      description: "Recevez des analyses quotidiennes sur les crypto-monnaies, le forex et les indices.",
      gradient: "from-emerald-500/20 to-green-500/20",
      hoverGradient: "from-emerald-500/30 to-green-500/30",
      iconGradient: "from-emerald-400 to-green-400"
    }
  ];

  return (
    <section className="services-section py-24 px-6 relative overflow-hidden flex flex-col items-center">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="container max-w-6xl relative z-10 flex flex-col items-center">
        <div className="text-center mb-20 flex flex-col items-center w-full">
          <h2 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase italic">
            Nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Services</span> de Formation
          </h2>
          <p className="text-zinc-300 max-w-2xl text-base md:text-lg">
            Tout ce dont vous avez besoin pour devenir un trader rentable, réuni sur une seule plateforme d'élite.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
          {services.map((service, index) => (
            <div 
              key={index} 
              className={`service-card group p-10 rounded-[28px] bg-gradient-to-br ${service.gradient} border border-white/10 backdrop-blur-xl hover:${service.hoverGradient} hover:border-white/20 transition-all duration-500 text-center flex flex-col items-center hover:-translate-y-3`}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.iconGradient} bg-opacity-20 flex items-center justify-center mb-7 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-black/20`}>
                <service.icon size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-5 tracking-tight">{service.title}</h3>
              <p className="text-zinc-300 leading-relaxed text-sm">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
