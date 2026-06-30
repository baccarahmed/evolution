import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FormationsHeader from '../components/formations/FormationsHeader';
import FormationsFilter from '../components/formations/FormationsFilter';
import FormationCard from '../components/formations/FormationCard';
import { formationsApi } from '../api'; // Import formationsApi
import { filterFormations } from '../services/formationsService'; // Keep filterFormations if needed for client-side filtering
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import './Formations.css';

const Formations = () => {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    level: '',
    category: '',
    search: ''
  });

  useEffect(() => {
    const fetchFormations = async () => {
      try {
        setLoading(true);
        const response = await formationsApi.getFormations();
        setFormations(response.data);
      } catch (err) {
        console.error("Failed to fetch formations:", err);
        setError("Impossible de charger les formations.");
      } finally {
        setLoading(false);
      }
    };
    fetchFormations();
  }, []);

  const filteredFormations = filterFormations(formations, filters);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return <div className="text-center py-20">Chargement des formations...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">Erreur: {error}</div>;
  }

  return (
    <div className="min-h-screen text-white">
      <FormationsHeader />
      <FormationsFilter onFilterChanged={updateFilters} />
      
      {/* Formations Grid */}
      <section className="py-12">
        <div className="container px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredFormations.map(formation => (
              <FormationCard 
                key={formation.id}
                formation={formation}
              />
            ))}
          </div>
          
          {filteredFormations.length === 0 && (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-lg">Aucune formation ne correspond à vos critères.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-600/20 to-purple-700/20 border border-indigo-500/20 rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full"></div>
            
            <div className="flex-grow">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 leading-tight">
                Prêt à devenir un <br />
                <span className="text-indigo-400">Trader d'Élite ?</span>
              </h2>
              <ul className="space-y-4 mb-8">
                {[
                  "Accès à vie aux programmes",
                  "Sessions de live trading hebdomadaires",
                  "Communauté privée de traders"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-zinc-300 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="no-underline">
                <button className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] text-lg flex items-center gap-3 uppercase tracking-wider">
                  Rejoindre l'Académie <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
            
            <div className="hidden lg:block w-1/3">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20"></div>
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl rotate-3">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-10 h-10 rounded-full bg-indigo-500/20"></div>
                     <div className="flex-grow space-y-2">
                       <div className="w-20 h-2 bg-zinc-800 rounded"></div>
                       <div className="w-12 h-2 bg-zinc-800 rounded"></div>
                     </div>
                   </div>
                   <div className="space-y-3">
                     <div className="w-full h-2 bg-zinc-800 rounded"></div>
                     <div className="w-full h-2 bg-zinc-800 rounded"></div>
                     <div className="w-3/4 h-2 bg-zinc-800 rounded"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Formations;
