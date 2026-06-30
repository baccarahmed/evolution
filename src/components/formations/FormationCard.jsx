import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Users, ArrowRight, Lock } from 'lucide-react';
import './FormationCard.css';

const FormationCard = ({ formation }) => {
  const cardContent = (
    <div className={`group formation-card-evolution relative bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 hover:border-indigo-500/50 rounded-[8px] sm:rounded-[12px] overflow-hidden transition-all duration-500 hover:shadow-[0_15px_40px_rgba(79,70,229,0.1)] flex flex-col h-full ${formation.is_locked ? 'opacity-75 grayscale-[0.5] cursor-not-allowed' : 'cursor-pointer'}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .orbitron { font-family: 'Orbitron', sans-serif; }
        .neon-text-sm { text-shadow: 0 0 8px rgba(79, 70, 229, 0.4); }
      `}} />
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"></div>
      {/* Image Container */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img 
          src={formation.image_url || formation.image} 
          alt={formation.title} 
          crossOrigin="anonymous"
          className={`w-full h-full object-cover transition-transform duration-500 ${!formation.is_locked && 'group-hover:scale-105'}`}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1611974717483-9b250aa63d3f?q=80&w=800&auto=format&fit=crop';
          }}
        />
        
        {formation.is_locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px] z-20">
            <div className="bg-zinc-900/90 border border-white/10 p-1 rounded-lg flex flex-col items-center shadow-2xl">
              <Lock className="w-2 h-2 text-indigo-400" />
              <span className="text-[5px] font-black uppercase tracking-widest text-zinc-400">Locked</span>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-zinc-950/90 to-transparent opacity-80"></div>
        <div className={`absolute top-1 left-1 px-1 py-0.5 rounded text-[5px] font-black uppercase tracking-widest backdrop-blur-md border z-10 ${
          formation.level === 'debutant' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          formation.level === 'intermediaire' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
          'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {formation.level}
        </div>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-2.5 flex flex-col flex-grow relative">
        <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        <div className="flex items-center gap-1.5 mb-1 text-[6px] sm:text-[7px] font-black orbitron uppercase tracking-widest text-zinc-500">
          <div className="flex items-center gap-0.5">
            <Clock className="w-1.5 h-1.5 text-indigo-500" />
            {formation.duration}
          </div>
          <div className="flex items-center gap-0.5">
            <Star className="w-1.5 h-1.5 text-amber-500 fill-amber-500" />
            {formation.rating}
          </div>
        </div>

        <h3 className={`text-[10px] sm:text-xs font-black orbitron uppercase tracking-tight text-white mb-0.5 transition-colors leading-tight line-clamp-1 ${!formation.is_locked && 'group-hover:text-indigo-400'}`}>
          {formation.title}
        </h3>
        
        <p className="text-[8px] sm:text-[9px] text-zinc-500 leading-tight mb-2 flex-grow line-clamp-2">
          {formation.description}
        </p>

        <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-black text-white orbitron tracking-tighter">{formation.price}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (formation.is_locked) {
    return cardContent;
  }

  return (
    <Link to={`/formations/${formation.id}`} className="no-underline">
      {cardContent}
    </Link>
  );
};

export default FormationCard;
