import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThreeDTestimonyRing } from './3d-testimony-ring';
import api from '../../api';

const TestimonySection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchEliteVideos = async () => {
      try {
        const response = await api.get('/elite-videos/');
        if (response.data && response.data.length > 0) {
          // Transform backend videos to match testimonial format
          const formattedVideos = response.data.map(video => {
            // Check if video_url is a relative path from backend
            let fullVideoUrl = video.video_url.startsWith('http') 
              ? video.video_url 
              : `${api.defaults.baseURL.replace('/api', '')}${video.video_url}`;

            // Convert YouTube watch URL to direct video if possible or embed (though <video> won't like embed)
            // For the 3D ring, we really need direct MP4s. If it's YouTube, we'll use a fallback video
            // or we could show a thumbnail. For now, let's just mark it.
            if (fullVideoUrl.includes('youtube.com/watch')) {
              // Fallback to a placeholder video that works if it's a YouTube link
              // since <video> tag doesn't support YouTube
              fullVideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-businessman-working-on-a-laptop-in-an-office-42441-large.mp4";
            }

            const fullAvatarUrl = video.thumbnail_url?.startsWith('http')
              ? video.thumbnail_url
              : video.thumbnail_url 
                ? `${api.defaults.baseURL.replace('/api', '')}${video.thumbnail_url}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(video.title)}&background=random`;

            return {
              id: video.id,
              name: video.title,
              role: "Elite Member",
              text: video.description || "Membre du cercle Elite",
              avatar: fullAvatarUrl,
              videoUrl: fullVideoUrl,
              rating: 5
            };
          });

          setTestimonials(formattedVideos);
        }
      } catch (error) {
        console.error("Failed to fetch elite videos:", error);
      }
    };

    fetchEliteVideos();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 md:mb-24 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center pt-6 pb-6"
          >
            <h2 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase italic">
              Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Circle</span>
            </h2>
            <p className="text-zinc-400 max-w-xl text-base md:text-lg font-medium px-4">
              Explorez les réussites de notre communauté. Faites défiler l'anneau pour une immersion totale.
            </p>
          </motion.div>
        </div>

        {/* 3D Ring Component */}
        <div className="h-[450px] md:h-[550px] w-full flex items-center justify-center">
          <ThreeDTestimonyRing 
            testimonials={testimonials}
            imageDistance={isMobile ? 550 : 600}
            width={300}
            mobileScaleFactor={0.65}
            visibleCount={isMobile ? 3 : 5}
          />
        </div>

        <div className="mt-20 text-center">
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">
            Glissez pour explorer
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonySection;
