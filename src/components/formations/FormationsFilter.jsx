import React, { useState } from 'react';
import { Search, Filter, BookOpen, Brain, ShieldAlert, BarChart3 } from 'lucide-react';
import './FormationsFilter.css';

const FormationsFilter = ({ onFilterChanged }) => {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (updates) => {
    const newFilters = {
      level: updates.level !== undefined ? updates.level : selectedLevel,
      category: updates.category !== undefined ? updates.category : selectedCategory,
      search: updates.search !== undefined ? updates.search : searchTerm
    };
    onFilterChanged(newFilters);
  };

  return (
    <section className="py-8 border-y border-zinc-800 bg-zinc-900/20 backdrop-blur-md sticky top-[80px] z-40">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher une formation..." 
              value={searchTerm}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange({ search: e.target.value });
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <Filter className="w-4 h-4 text-indigo-500" />
              <select 
                value={selectedLevel} 
                className="bg-transparent text-sm text-zinc-300 focus:outline-none cursor-pointer"
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  handleFilterChange({ level: e.target.value });
                }}
              >
                <option value="" className="bg-zinc-900">Tous niveaux</option>
                <option value="debutant" className="bg-zinc-900">Débutant</option>
                <option value="intermediaire" className="bg-zinc-900">Intermédiaire</option>
                <option value="avance" className="bg-zinc-900">Avancé</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <select 
                value={selectedCategory} 
                className="bg-transparent text-sm text-zinc-300 focus:outline-none cursor-pointer"
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  handleFilterChange({ category: e.target.value });
                }}
              >
                <option value="" className="bg-zinc-900">Toutes catégories</option>
                <option value="analyse-technique" className="bg-zinc-900">Analyse Technique</option>
                <option value="analyse-fondamentale" className="bg-zinc-900">Analyse Fondamentale</option>
                <option value="risk-management" className="bg-zinc-900">Gestion des Risques</option>
                <option value="psychology" className="bg-zinc-900">Psychologie</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormationsFilter;
