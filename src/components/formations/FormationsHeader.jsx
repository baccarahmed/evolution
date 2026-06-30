import React from 'react';
import './FormationsHeader.css';

const FormationsHeader = () => {
  return (
    <section className="relative pt-12 pb-20 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0 opacity-10">
        <h1 className="text-[120px] md:text-[200px] font-black tracking-tighter uppercase leading-none whitespace-nowrap text-center">
          Elite Learning
        </h1>
      </div>

      <div className="container relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          ACADÉMIE DE TRADING PRO
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-6">
          Nos <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Formations</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Maîtrisez les marchés financiers avec nos programmes d'élite conçus par des experts du trading professionnel.
        </p>
      </div>
    </section>
  );
};

export default FormationsHeader;
