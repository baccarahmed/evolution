import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';

const SpotlightSection = () => {
  const [selectedImg, setSelectedImg] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [images, setImages] = useState([
    'https://images.unsplash.com/photo-1611974717483-9b250aa63d3f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1642388691919-61699924e930?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1640341719917-0a937004d4d2?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611974717483-9b250aa63d3f?q=80&w=800&auto=format&fit=crop',
  ]);

  useEffect(() => {
    const fetchSpotlights = async () => {
      try {
        const response = await api.get('/spotlights/');
        if (response.data && response.data.length > 0) {
          // Extract only the active image URLs
          const backendImages = response.data
            .filter(spotlight => spotlight.is_active)
            .map(spotlight => {
              // Ensure full URL if it's a relative path from backend
              return spotlight.image_url.startsWith('http')
                ? spotlight.image_url
                : `${api.defaults.baseURL.replace('/api', '')}${spotlight.image_url}`;
            });
            
          if (backendImages.length > 0) {
            // Mix backend images with some default ones if there are too few
            const finalImages = backendImages.length < 4 
              ? [...backendImages, ...images.slice(0, 6 - backendImages.length)]
              : backendImages;
              
            setImages(finalImages);
          }
        }
      } catch (error) {
        console.error("Failed to fetch spotlights:", error);
      }
    };

    fetchSpotlights();
  }, []);

  const duplicatedImages = [...images, ...images, ...images];

  return (
    <section className="py-24 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-16 relative z-10 flex flex-col items-center text-center py-2.5">
        <h2 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase italic">
          Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Spotlights</span>
        </h2>
        <p className="text-zinc-400 max-w-xl text-base md:text-lg font-medium px-4 py-2.5">
          Explorez les moments forts et les analyses de notre communauté. Cliquez pour agrandir.
        </p>
      </div>

      <div 
        className="flex flex-col gap-10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Track 1: Left to Right */}
        <div className="flex overflow-hidden">
          <div 
            className="flex gap-4 md:gap-6 whitespace-nowrap animate-marquee-ltr"
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          >
            {duplicatedImages.map((img, i) => (
              <div 
                key={`ltr-${i}`} 
                className="w-[280px] h-[180px] md:w-[350px] md:h-[220px] rounded-2xl overflow-hidden border border-white/10 shrink-0 group cursor-pointer"
                onClick={() => setSelectedImg(img)}
              >
                <img 
                  src={img} 
                  alt="Spotlight" 
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=800&auto=format&fit=crop';
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Track 2: Right to Left */}
        <div className="flex overflow-hidden">
          <div 
            className="flex gap-4 md:gap-6 whitespace-nowrap animate-marquee-rtl pb-[25px]"
            style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
          >
            {duplicatedImages.map((img, i) => (
              <div 
                key={`rtl-${i}`} 
                className="w-[280px] h-[180px] md:w-[350px] md:h-[220px] rounded-2xl overflow-hidden border border-white/10 shrink-0 group cursor-pointer"
                onClick={() => setSelectedImg(img)}
              >
                <img 
                  src={img} 
                  alt="Spotlight" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImg(null)}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10 backdrop-blur-xl bg-black/40 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[85vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl shadow-purple-900/40"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImg} 
                alt="Enlarged Spotlight" 
                className="w-full h-full object-contain bg-zinc-900"
              />
              <button 
                onClick={() => setSelectedImg(null)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-[#a020f0] transition-colors"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .neon-text { text-shadow: 0 0 15px rgba(160, 32, 240, 0.8); }
        .orbitron { font-family: 'Orbitron', sans-serif; }
        
        @keyframes marquee-ltr {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        
        @keyframes marquee-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        
        .animate-marquee-ltr {
          animation: marquee-ltr 60s linear infinite;
        }
        
        .animate-marquee-rtl {
          animation: marquee-rtl 60s linear infinite;
        }
      `}} />
    </section>
  );
};

export default SpotlightSection;
