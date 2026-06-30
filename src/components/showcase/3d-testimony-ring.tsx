"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useMotionValue, easeOut, animate, useTransform, MotionValue } from "framer-motion";
import { cn } from "../../lib/utils";
import { Play, Pause, Volume2, VolumeX, Quote } from "lucide-react";

export interface Testimony {
  id: number;
  name: string;
  role: string;
  text: string;
  avatar: string;
  videoUrl: string;
  rating: number;
}

export interface ThreeDTestimonyRingProps {
  testimonials: Testimony[];
  width?: number;
  perspective?: number;
  imageDistance?: number;
  initialRotation?: number;
  animationDuration?: number;
  staggerDelay?: number;
  hoverOpacity?: number;
  containerClassName?: string;
  ringClassName?: string;
  cardClassName?: string;
  draggable?: boolean;
  ease?: string;
  mobileBreakpoint?: number;
  mobileScaleFactor?: number;
  inertiaPower?: number;
  inertiaTimeConstant?: number;
  inertiaVelocityMultiplier?: number;
  visibleCount?: number; // Nombre de cartes visibles simultanément
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  onVideoStateChange?: (isPlaying: boolean) => void;
}

interface TestimonyCardProps {
  testimonial: Testimony;
  index: number;
  angle: number;
  imageDistance: number;
  currentScale: number;
  staggerDelay: number;
  animationDuration: number;
  cardClassName?: string;
  hoverOpacity: number;
  ringRef: React.RefObject<HTMLDivElement>;
  rotationY: MotionValue<number>;
  visibleCount: number;
  onVideoStateChange: (isPlaying: boolean) => void;
}

const TestimonyCard = ({ 
  testimonial, 
  index, 
  angle, 
  imageDistance, 
  currentScale, 
  staggerDelay, 
  animationDuration, 
  cardClassName,
  hoverOpacity,
  ringRef,
  rotationY,
  visibleCount,
  onVideoStateChange
}: TestimonyCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Sync internal isPlaying with parent state
  useEffect(() => {
    onVideoStateChange?.(isPlaying);
  }, [isPlaying, onVideoStateChange]);

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  // Calculer l'opacité en fonction de l'angle relatif à la vue de face
  const opacity = useTransform(
    rotationY,
    (latest: number) => {
      const cardRotation = index * -angle;
      const relativeRotation = ((latest + cardRotation) % 360 + 360) % 360;
      
      // Centre de face = 0° (ou 360°)
      // On calcule la distance par rapport à 0°
      let distance = Math.abs(relativeRotation);
      if (distance > 180) distance = 360 - distance;
      
      const threshold = (visibleCount / 2) * angle + 20;
      
      if (distance < threshold) return 1;
      if (distance < threshold + 40) return 1 - (distance - threshold) / 40;
      return 0;
    }
  );

  // Ajouter un effet de flou et de noirceur pour les cartes sur les côtés
  const filter = useTransform(
    rotationY,
    (latest: number) => {
      const cardRotation = index * -angle;
      const relativeRotation = ((latest + cardRotation) % 360 + 360) % 360;
      
      let distance = Math.abs(relativeRotation);
      if (distance > 180) distance = 360 - distance;
      
      const blur = Math.max(0, (distance - 30) / 25);
      const brightness = Math.max(0.3, 1 - distance / 100);
      
      return `blur(${blur}px) brightness(${brightness})`;
    }
  );

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <motion.div
      className={cn(
        "w-full h-full absolute rounded-[40px] overflow-hidden group border border-white/10 shadow-2xl",
        cardClassName
      )}
      style={{
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        rotateY: index * -angle,
        z: imageDistance * currentScale,
        transformOrigin: `50% 50% ${-imageDistance * currentScale}px`,
        opacity,
        filter
      }}
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0 }}
      transition={{
        delay: index * staggerDelay,
        duration: animationDuration,
        ease: easeOut,
      }}
      onHoverStart={() => {
        if (ringRef.current) {
          Array.from(ringRef.current.children).forEach((el, i) => {
            if (i !== index) (el as HTMLElement).style.opacity = `${hoverOpacity}`;
          });
        }
        videoRef.current?.play().catch(() => {});
        setIsPlaying(true);
      }}
      onHoverEnd={() => {
        if (ringRef.current) {
          Array.from(ringRef.current.children).forEach((el) => {
            (el as HTMLElement).style.opacity = "";
          });
        }
        videoRef.current?.pause();
        setIsPlaying(false);
      }}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        src={testimonial.videoUrl}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        loop={false}
        muted={isMuted}
        playsInline
        onEnded={handleVideoEnd}
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-purple-500/10 opacity-40 group-hover:opacity-60 transition-opacity" />

      {/* Content - Removed comments and profiles as requested */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end pointer-events-none">
        {/* Only video title if needed, or empty */}
      </div>

      {/* Video Controls */}
      <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
        </button>
        <button 
          onClick={toggleMute}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Light Reflection Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000" />
    </motion.div>
  );
};

export function ThreeDTestimonyRing({
  testimonials,
  width = 350,
  perspective = 2000,
  imageDistance = 600,
  initialRotation = 0,
  animationDuration = 1.5,
  staggerDelay = 0.1,
  hoverOpacity = 0.5,
  containerClassName,
  ringClassName,
  cardClassName,
  draggable = true,
  mobileBreakpoint = 768,
  mobileScaleFactor = 0.7,
  inertiaPower = 0.8,
  inertiaTimeConstant = 300,
  inertiaVelocityMultiplier = 20,
  visibleCount = 4,
  autoRotate = true,
  autoRotateSpeed = 0.5,
}: ThreeDTestimonyRingProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const rotationY = useMotionValue(initialRotation);
  const startX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const velocity = useRef<number>(0);

  const [currentScale, setCurrentScale] = useState(1);
  const angle = useMemo(() => 360 / testimonials.length, [testimonials.length]);

  // Auto-rotation logic
  useEffect(() => {
    if (!autoRotate) return;
    
    let animationFrameId: number;
    const rotate = () => {
      if (!isDragging.current && !isVideoPlaying) {
        rotationY.set(rotationY.get() - autoRotateSpeed);
      }
      animationFrameId = requestAnimationFrame(rotate);
    };
    
    animationFrameId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [autoRotate, autoRotateSpeed, isDragging, isVideoPlaying]);

  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      setCurrentScale(viewportWidth <= mobileBreakpoint ? mobileScaleFactor : 1);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileBreakpoint, mobileScaleFactor]);

  const handleDragStart = (event: React.MouseEvent | React.TouchEvent) => {
    if (!draggable) return;
    isDragging.current = true;
    const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
    startX.current = clientX;
    rotationY.stop();
    velocity.current = 0;
    if (ringRef.current) ringRef.current.style.cursor = "grabbing";
    
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchmove", handleDrag);
    document.addEventListener("touchend", handleDragEnd);
  };

  const handleDrag = (event: MouseEvent | TouchEvent) => {
    if (!draggable || !isDragging.current) return;
    const clientX = "touches" in event ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
    const deltaX = clientX - startX.current;
    velocity.current = -deltaX * 0.5;
    rotationY.set(rotationY.get() + velocity.current);
    startX.current = clientX;
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    if (ringRef.current) ringRef.current.style.cursor = "grab";

    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchmove", handleDrag);
    document.removeEventListener("touchend", handleDragEnd);

    const initial = rotationY.get();
    const velocityBoost = velocity.current * inertiaVelocityMultiplier;
    const target = initial + velocityBoost;

    // Reset auto-rotation speed if we were moving in the same direction
    // but here we just want to ensure smooth inertia
    animate(initial, target, {
      type: "inertia",
      velocity: velocityBoost,
      power: inertiaPower,
      timeConstant: inertiaTimeConstant,
      restDelta: 0.5,
      modifyTarget: (target) => Math.round(target / angle) * angle,
      onUpdate: (latest) => rotationY.set(latest),
    });

    velocity.current = 0;
  };

  return (
    <div
      className={cn("w-full h-full select-none relative", containerClassName)}
      style={{
        transform: `scale(${currentScale})`,
        transformOrigin: "center center",
      }}
      onMouseDown={draggable ? handleDragStart : undefined}
      onTouchStart={draggable ? handleDragStart : undefined}
    >
      <div
        style={{
          perspective: `${perspective}px`,
          width: `${width}px`,
          height: `${width * 1.33}px`,
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          ref={ringRef}
          className={cn("w-full h-full absolute", ringClassName)}
          style={{
            transformStyle: "preserve-3d",
            rotateY: rotationY,
            cursor: draggable ? "grab" : "default",
          }}
        >
          {testimonials.map((t, index) => (
            <TestimonyCard
              key={t.id}
              testimonial={t}
              index={index}
              angle={angle}
              imageDistance={imageDistance}
              currentScale={currentScale}
              staggerDelay={staggerDelay}
              animationDuration={animationDuration}
              cardClassName={cardClassName}
              hoverOpacity={hoverOpacity}
              ringRef={ringRef}
              rotationY={rotationY}
              visibleCount={visibleCount}
              onVideoStateChange={setIsVideoPlaying}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default ThreeDTestimonyRing;
