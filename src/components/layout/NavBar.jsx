import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LayoutDashboard, LogOut, ChevronDown, User, ShieldCheck, Award, Calendar, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './NavBar.css';

const NavBar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const guestDropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navLinks = [
    { name: 'Formations', path: '/formations' },
    { name: 'Lives', path: '/lives' },
    { name: 'Communauté', path: '/community' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className={`navbar-wrapper ${isScrolled ? 'scrolled' : ''}`}>
      <nav className="container flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="logo-container group no-underline">
          <span className="logo-text text-2xl font-black orbitron tracking-tighter text-white">
            EVOL<span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent group-hover:brightness-110 transition-all">UTION</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link text-sm font-bold uppercase tracking-widest orbitron transition-all no-underline ${
                location.pathname === link.path ? 'text-[#F59E0B]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Auth Actions / Profile */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2 hover:bg-zinc-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-haspopup="true"
                aria-expanded={isProfileOpen}
                aria-label="Menu utilisateur"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-bold text-white orbitron uppercase tracking-wider hidden lg:block">
                  {user?.full_name?.split(' ')[0]}
                </span>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-72 bg-gradient-to-br from-zinc-900 to-[#0a0a0a] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-md"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all no-underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset whitespace-nowrap"
                      role="menuitem"
                      tabIndex={0}
                    >
                      <LayoutDashboard size={18} />
                      <span className="text-sm font-bold orbitron uppercase tracking-wider">Dashboard</span>
                    </Link>
                    <Link 
                      to="/certificates" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all no-underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset whitespace-nowrap"
                      role="menuitem"
                      tabIndex={0}
                    >
                      <Award size={18} />
                      <span className="text-sm font-bold orbitron uppercase tracking-wider">Certificats</span>
                    </Link>
                    <Link 
                      to="/chat" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all no-underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset whitespace-nowrap"
                      role="menuitem"
                      tabIndex={0}
                    >
                      <MessageCircle size={18} />
                      <span className="text-sm font-bold orbitron uppercase tracking-wider">Chat</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all no-underline border border-indigo-500/20 mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset whitespace-nowrap"
                        role="menuitem"
                        tabIndex={0}
                      >
                        <ShieldCheck size={18} />
                        <span className="text-sm font-bold orbitron uppercase tracking-wider">Admin Panel</span>
                      </Link>
                    )}
                    <div className="h-px w-full bg-white/10 my-2" />
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/15 text-zinc-300 hover:text-red-400 transition-all cursor-pointer text-left border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset whitespace-nowrap"
                      role="menuitem"
                      tabIndex={0}
                    >
                      <LogOut size={18} />
                      <span className="text-sm font-bold orbitron uppercase tracking-wider">Déconnexion</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="relative" ref={guestDropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center w-10 h-10 bg-zinc-900/50 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all cursor-pointer text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-haspopup="true"
                aria-expanded={isProfileOpen}
                aria-label="Menu connexion"
              >
                <User size={20} />
              </button>

              {/* Guest Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-zinc-900 to-[#0a0a0a] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-md"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <Link 
                      to="/login" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-all no-underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset whitespace-nowrap"
                      role="menuitem"
                      tabIndex={0}
                    >
                      <span className="text-sm font-bold orbitron uppercase tracking-wider">Connexion</span>
                    </Link>
                    <Link 
                      to="/register" 
                      className="flex items-center justify-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white transition-all no-underline mt-2 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset whitespace-nowrap"
                      role="menuitem"
                      tabIndex={0}
                    >
                      <span className="text-sm font-bold orbitron uppercase tracking-wider">Rejoindre</span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white p-2 border-none bg-transparent cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-b border-white/10 overflow-hidden"
          >
            <div className="container py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-lg font-black orbitron uppercase tracking-[0.2em] no-underline ${
                    location.pathname === link.path ? 'text-[#F59E0B]' : 'text-zinc-400'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px w-full bg-white/5 my-2" />
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-lg font-black orbitron uppercase tracking-[0.2em] text-zinc-400 no-underline">Dashboard</Link>
                  <Link to="/certificates" className="text-lg font-black orbitron uppercase tracking-[0.2em] text-zinc-400 no-underline">Certificats</Link>
                  <Link to="/chat" className="text-lg font-black orbitron uppercase tracking-[0.2em] text-zinc-400 no-underline">Chat</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="text-lg font-black orbitron uppercase tracking-[0.2em] text-indigo-400 no-underline">Admin Panel</Link>
                  )}
                  <button onClick={logout} className="text-left text-lg font-black orbitron uppercase tracking-[0.2em] text-red-500/80 border-none bg-transparent cursor-pointer">Déconnexion</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-lg font-black orbitron uppercase tracking-[0.2em] text-zinc-400 no-underline">Connexion</Link>
                  <Link to="/register" className="text-lg font-black orbitron uppercase tracking-[0.2em] text-white no-underline">Rejoindre</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavBar;
