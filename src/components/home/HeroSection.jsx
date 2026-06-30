import React, { useEffect, Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useFBX, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import traderImg from '../../assets/images/trader-hero21.png';
import btcModelPath from '../../assets/bitcoin/source/moneta low poly.fbx';
import btcAlbedo from '../../assets/bitcoin/textures/bitcoin_albedo.png';
import btcNormal from '../../assets/bitcoin/textures/bitcoin_normals.png';
import btcMetallic from '../../assets/bitcoin/textures/bitcoin_metalic.png';
import ethModelPath from '../../assets/ethereum-logo/source/Эфириум.fbx';
import { GeometricSplitText } from '../ui/GeometricSplitText';
import { useIsMobile } from '../../hooks/use-mobile';
import './HeroSection.css';

const FLAME_CSS = `
  @keyframes coin-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  .coin-wrapper {
    animation: coin-float 4s ease-in-out infinite;
  }
  .flame-anchor { position: absolute; pointer-events: none; z-index: 20; }
`;

const BitcoinModel = () => {
  const fbx = useFBX(btcModelPath);
  const meshRef = useRef();
  
  const [albedo, normal, metallic] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tAlbedo = loader.load(btcAlbedo);
    const tNormal = loader.load(btcNormal);
    const tMetallic = loader.load(btcMetallic);
    
    [tAlbedo, tNormal, tMetallic].forEach(t => {
      t.anisotropy = 16;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      t.needsUpdate = true;
    });
    
    return [tAlbedo, tNormal, tMetallic];
  }, []);

  const btcMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: albedo,
    normalMap: normal,
    normalScale: new THREE.Vector2(6, 6),
    metalnessMap: metallic,
    metalness: 1.0,
    roughness: 0.05,
    envMapIntensity: 2.0,
    color: "#ffffff",
  }), [albedo, normal, metallic]);

  useEffect(() => {
    fbx.traverse((child) => {
      if (child.isMesh) {
        child.material = btcMaterial;
        child.geometry.computeVertexNormals();
        child.geometry.attributes.position.needsUpdate = true;
        child.castShadow = true;
      }
    });
  }, [fbx, btcMaterial]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.012;
    }
  });

  return (
    <primitive 
      ref={meshRef}
      object={fbx} 
      scale={0.014} 
      position={[0, 0, 0]} 
      rotation={[Math.PI / 5, 0, 0]} 
    />
  );
};

const EthereumModel = () => {
  const fbx = useFBX(ethModelPath);
  const meshRef = useRef();

  const ethMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#627EEA",
    metalness: 1.0,
    roughness: 0.1,
    emissive: "#627EEA",
    emissiveIntensity: 0.2,
  }), []);

  useEffect(() => {
    fbx.traverse((child) => {
      if (child.isMesh) {
        child.material = ethMaterial;
        child.geometry.computeVertexNormals();
        child.castShadow = true;
      }
    });
  }, [fbx, ethMaterial]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.015;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <primitive 
      ref={meshRef}
      object={fbx} 
      scale={0.0035} 
      position={[0, 0, 0]} 
      rotation={[0, 0, 0]} 
    />
  );
};

const Bitcoin3D = () => (
  <div className="btc-canvas-container">
    <div className="btc-canvas-wrapper">
      <Canvas 
        camera={{ position: [0, 0, 3.8], fov: 32 }} 
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping,
          exposure: 1.8,
          pixelRatio: window.devicePixelRatio
        }}
        shadows
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[2, 2, 5]} intensity={3.5} color="#ffffff" />
        <directionalLight position={[-2, -2, 2]} intensity={1.5} color="#f7931a" />
        <pointLight position={[0, 5, 0]} intensity={1} color="#ffffff" />
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
            <BitcoinModel />
          </Float>
        </Suspense>
      </Canvas>
    </div>
  </div>
);

const Ethereum3D = () => (
  <div className="btc-canvas-container">
    <div className="btc-canvas-wrapper">
      <Canvas 
        camera={{ position: [0, 0, 3.5], fov: 30 }} 
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping,
          exposure: 1.5,
          pixelRatio: window.devicePixelRatio
        }}
        shadows
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 2, 5]} intensity={2.5} color="#ffffff" />
        <directionalLight position={[-2, -2, 2]} intensity={1.5} color="#627EEA" />
        <pointLight position={[0, 5, 0]} intensity={1} color="#ffffff" />
        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={0.3} floatIntensity={0.4}>
            <EthereumModel />
          </Float>
        </Suspense>
      </Canvas>
    </div>
  </div>
);

const HeroSection = () => {
  const isMobile = useIsMobile();
  const traderRef = useRef(null);
  const [positions, setPositions] = useState({ btc: { x: 0, y: 500.5 }, eth: { x: 0, y: 500.5 } });

  useEffect(() => {
    if (!document.getElementById('flame-btc-css')) {
      const style = document.createElement('style');
      style.id = 'flame-btc-css';
      style.textContent = FLAME_CSS;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const updatePositions = () => {
      if (!traderRef.current) return;

      // 1. Get REAL dimensions of the image and its relative container
      const rect = traderRef.current.getBoundingClientRect();
      const containerRect = traderRef.current.parentElement.getBoundingClientRect();

      // 2. Mathematical ratios for the hands (relative to the image itself)
      const handLeft = { x: 0.157, y: 0.628 };  // Bitcoin
      const handRight = { x: 0.885, y: 0.582 }; // Ethereum

      // 3. THE EQUATION: Calculate position relative to the parent container
      // offsetX/Y handles image overflow (like scale(1.2)) or shifts
      const offsetX = rect.left - containerRect.left;
      const offsetY = rect.top - containerRect.top;
      
      const btcX = offsetX + (rect.width * handLeft.x);
      const btcY = offsetY + (rect.height * handLeft.y);
      
      const ethX = offsetX + (rect.width * handRight.x);
      const ethY = offsetY + (rect.height * handRight.y);

      setPositions({
        btc: { x: btcX, y: btcY },
        eth: { x: ethX, y: ethY }
      });
    };

    const observer = new ResizeObserver(updatePositions);
    if (traderRef.current) observer.observe(traderRef.current);
    window.addEventListener('resize', updatePositions);
    
    updatePositions();
    const timer = setTimeout(updatePositions, 100);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePositions);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="hero-section pt-10 pb-10 text-center flex flex-col items-center min-h-[90vh] md:justify-center relative">
      <div className="container flex flex-col items-center bg-white/0 relative z-10 mt-0 mb-0 px-6">
        
        <div className="relative w-full max-w-[1200px] mx-auto flex flex-col items-center pt-0">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full z-0 pointer-events-none select-none opacity-20 text-center transition-all duration-700 hover:opacity-100 hover:z-30 cursor-default flex flex-col items-center">
            <h1 className="text-[50px] sm:text-[70px] md:text-[100px] lg:text-[140px] font-black tracking-tighter uppercase leading-none flex flex-col items-center">
              Tunisia's Elite <br />
              <GeometricSplitText 
                text="EVOLUTION"
                textClassName="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                subText="TRADING ACADEMY"
                subTextClassName="text-[12px] sm:text-[16px] md:text-[20px] lg:text-[30px] text-white font-bold tracking-[0.3em] md:tracking-[0.5em] opacity-80"
              />
            </h1>
          </div>

          <div className="w-full max-w-[700px] relative z-10 hero-trader-container" style={{ marginTop: isMobile ? '80px' : '0px' }}>
            <div className="w-full aspect-[4/5] relative">
              <div 
                className="flame-anchor dynamic-btc" 
                style={{ 
                  left: `${positions.btc.x}px`, 
                  top: `${positions.btc.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="coin-wrapper">
                  <Bitcoin3D />
                </div>
              </div>

              <div 
                className="flame-anchor dynamic-eth" 
                style={{ 
                  left: `${positions.eth.x}px`, 
                  top: `${positions.eth.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="coin-wrapper">
                  <Ethereum3D />
                </div>
              </div>

              <img 
                ref={traderRef}
                src={traderImg} 
                alt="Elite Trader" 
                className="trader-image"
                onLoad={() => {
                  window.dispatchEvent(new Event('resize'));
                }}
              />
            </div>
          </div>
        </div>

        <div className="hero-content w-full flex flex-col items-center mt-[-60px] md:mt-[-180px] relative z-20 px-4 md:px-[50px] py-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] md:text-xs font-bold mb-4 md:mb-[20px] pb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            NOUVEAU: Live Trading Session à 20h
          </div>
          
          <h1 className="hero-title text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-4 md:mb-[20px] pb-2 md:pb-5 flex flex-col items-center">
            <GeometricSplitText 
              text="EVOLUTION"
              textClassName="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent py-0"
              subText="TRADING ACADEMY"
              subTextClassName="text-[14px] sm:text-[18px] md:text-[25px] text-white font-bold tracking-[0.3em] md:tracking-[0.5em] opacity-80"
            />
          </h1>
          <p className="hero-description text-base sm:text-lg md:text-2xl text-zinc-400 max-w-2xl mt-0 mb-6 md:mb-[20px] leading-relaxed mx-auto pt-0 pb-4 md:pb-[20px]">
            La plateforme d'élite pour apprendre, pratiquer et réussir sur les marchés financiers avec les meilleurs experts.
          </p>
          <div className="hero-actions flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full sm:w-auto">
            <Link to="/register" className="no-underline w-full sm:w-auto">
              <button className="w-full sm:w-auto py-4 md:py-5 px-8 md:px-[50px] bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] text-base md:text-lg cursor-pointer border-none">
                Démarrer Maintenant
              </button>
            </Link>
            <Link to="/formations" className="no-underline w-full sm:w-auto">
              <button className="w-full sm:w-auto py-4 md:py-5 px-8 md:px-[50px] bg-zinc-900/50 text-white font-bold rounded-2xl border border-zinc-800 hover:bg-zinc-800/80 backdrop-blur-md transition-all active:scale-95 text-base md:text-lg cursor-pointer">
                Voir les Formations
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
