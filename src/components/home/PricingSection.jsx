import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Rocket, ArrowRight, ShieldCheck, Globe, Infinity, Calendar, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { livesApi, paymentsApi } from '../../api';
import { formatError } from '../../utils/errorUtils';
import { QRCodeCanvas } from 'qrcode.react';

const parsePlanFeatures = (features) => {
  if (Array.isArray(features)) {
    return features;
  }
  if (typeof features !== 'string') return [];
  const trimmed = features.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return trimmed.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
};

const AnimatedPrice = ({ price, currency = 'DT' }) => {
  const digits = String(price).split('');

  return (
    <div className="flex items-baseline gap-0">
      {digits.map((digit, i) => (
        <div key={i} className="relative overflow-hidden h-8 w-6 md:h-10 md:w-7 flex items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`price-${i}-${digit}`}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: i * 0.08,
              }}
              className="text-2xl md:text-4xl font-black text-slate-50 leading-none absolute font-['Plus_Jakarta_Sans']"
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
      <span className="text-xs md:text-sm font-semibold text-slate-400 ml-1.5">{currency}</span>
    </div>
  );
};

const PricingSection = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loadingPayment, setLoadingPayment] = useState(null);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState(null);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [binanceManualData, setBinanceManualData] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await livesApi.getPublicPlans();
        const activePlans = res.data.filter((p) => p.is_active);
        setPricingPlans(
          activePlans.map((p) => ({
            ...p,
            features: parsePlanFeatures(p.features)
          }))
        );
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
    window.addEventListener('focus', fetchPlans);
    return () => window.removeEventListener('focus', fetchPlans);
  }, []);

  const handlePlanClick = (plan) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    if (user?.active_subscription) {
      navigate('/dashboard');
    } else {
      setSelectedPlanForModal(plan);
    }
  };

  const closeModal = () => {
    setSelectedPlanForModal(null);
    setBinanceManualData(null);
  };

  const handlePayment = async (planSlug, gateway) => {
    try {
      setLoadingPayment(`${planSlug}-${gateway}`);
      const response = await paymentsApi.createHybridPayment(planSlug, gateway);
      if (response.data && response.data.payment_url) {
        window.location.href = response.data.payment_url;
      } else if (gateway === 'binance' && response.data.wallet_address) {
        setBinanceManualData(response.data);
      }
    } catch (err) {
      alert('Erreur lors de la création du paiement : ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingPayment(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const getPlanIcon = (idx) => {
    if (idx === 0) return Rocket;
    if (idx === 1) return Zap;
    return Crown;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.92 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        type: 'spring',
        stiffness: 100,
        damping: 15,
        mass: 0.8,
      },
    }),
  };

  const plansToShow = pricingPlans;

  if (loading) return null;

  return (
    <section id="plans" className="w-full py-24 md:py-32 px-4 md:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center bg-transparent">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        .evolution-gradient {
          background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 25%, #A855F7 75%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% 200%;
          animation: gradient-shift 8s ease-in-out infinite;
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .popular-border {
          position: relative;
        }
        
        .popular-border::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 1.5rem;
          padding: 3px;
          background: linear-gradient(135deg, #F59E0B, #A855F7, #EC4899, #F59E0B);
          background-size: 300% 300%;
          animation: border-glow 6s ease infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 0;
        }
        
        @keyframes border-glow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .card-glow {
          box-shadow: 0 0 60px -20px rgba(245, 158, 11, 0.2), 0 0 120px -40px rgba(139, 92, 246, 0.15);
        }
        
        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        
        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transform: skewX(-25deg);
        }
        
        .btn-shine:hover::after {
          animation: shine 0.7s ease-in-out;
        }
        
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}} />

      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/20 via-[#8B5CF6]/20 to-transparent" />
      <div className="absolute top-1/4 -left-[30%] w-[70%] h-[70%] bg-[#8B5CF6]/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-[30%] w-[70%] h-[70%] bg-[#F59E0B]/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20 space-y-4 md:space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-black tracking-[0.35em] uppercase text-amber-300 font-['Plus_Jakarta_Sans']">
              ELITE EVOLUTION
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-50 leading-tight">
            <span className="font-['Cormorant'] italic">Evolution</span> <span className="evolution-gradient font-black">Tiers</span>
          </h2>
          <p className="max-w-xl mx-auto text-slate-400 text-base md:text-lg font-medium font-['Plus_Jakarta_Sans']">
            Choose the perfect tier for your trading journey — from beginner to professional
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid gap-5 md:gap-7 md:grid-cols-2 lg:grid-cols-3 justify-items-center max-w-7xl mx-auto w-full"
        >
          {plansToShow.map((plan, i) => {
            const Icon = getPlanIcon(i);
            return (
              <motion.div
                key={plan.id}
                custom={i}
                variants={cardVariants}
                whileHover={{ 
                  y: -10, 
                  scale: 1.02, 
                  transition: { type: 'spring', stiffness: 200, damping: 15 } 
                }}
                className={`relative flex flex-col p-5 md:p-6 rounded-[1.5rem] bg-slate-900/60 border backdrop-blur-2xl transition-all duration-400 cursor-pointer will-change-transform overflow-hidden w-full max-w-sm ${
                  plan.is_popular 
                    ? 'popular-border border-transparent shadow-2xl card-glow z-20 bg-slate-900/80' 
                    : 'border-slate-800/50 hover:border-amber-500/40 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-amber-500/10'
                }`}
                onClick={() => handlePlanClick(plan)}
              >
                {plan.is_popular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                )}
                
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {plan.is_popular && (
                  <motion.div 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 text-[9px] font-black uppercase tracking-[0.35em] rounded-full shadow-2xl shadow-amber-500/40 z-30 flex items-center gap-1.5"
                  >
                    <Star className="w-3 h-3 fill-amber-900/50 text-amber-900" />
                    Most Recommended
                    <Star className="w-3 h-3 fill-amber-900/50 text-amber-900" />
                  </motion.div>
                )}

                <div className="flex flex-col items-center text-center space-y-3 mb-5 relative z-10">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`p-3 rounded-xl transition-all duration-400 ${
                      plan.is_popular 
                        ? 'bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-amber-400 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20' 
                        : 'bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className={`text-lg md:text-xl font-black uppercase tracking-tight font-['Plus_Jakarta_Sans'] ${
                      plan.is_popular ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500' : 'text-slate-50'
                    }`}>
                      {plan.name}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto font-['Plus_Jakarta_Sans']">
                      {plan.description || 'Master the markets with elite guidance.'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <AnimatedPrice 
                      price={(plan.price_tnd / 1000).toFixed(0)} 
                    />
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/40">
                    <Calendar size={13} className={plan.is_popular ? 'text-amber-400' : 'text-slate-500'} />
                    {plan.duration_months} Months Access
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePlanClick(plan); }}
                    className={`group relative w-full h-11 px-6 rounded-[1rem] font-extrabold text-xs transition-all duration-400 flex items-center justify-center gap-2 btn-shine ${
                      plan.is_popular 
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-[0.97]' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 hover:shadow-lg'
                    }`}
                  >
                    <span className="relative z-10 font-['Plus_Jakarta_Sans']">
                      {plan.button_text || (user?.active_subscription ? 'Go to Dashboard' : 'Get Started')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 relative z-10 group-hover:translate-x-1 transition-transform duration-400" />
                  </button>
                </div>

                <div className="flex-1 pt-4 border-t border-slate-700/40 relative z-10">
                  <div className="space-y-2.5">
                    {plan.features.map((feature, fIdx) => (
                      <motion.div 
                        key={fIdx} 
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + fIdx * 0.03 }}
                        className="flex gap-2.5 items-start text-slate-300 group-hover:text-slate-100 transition-colors duration-300"
                      >
                        <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                          plan.is_popular 
                            ? 'bg-gradient-to-br from-amber-500/25 to-purple-500/25 text-amber-400' 
                            : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'
                        }`}>
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                        <span className="font-medium leading-relaxed text-xs font-['Plus_Jakarta_Sans']">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 md:mt-20 flex flex-wrap justify-center gap-x-12 gap-y-6 text-slate-400"
        >
          <div className="flex items-center gap-3 font-semibold text-sm md:text-base">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-amber-400" strokeWidth={2} />
            <span>Secured Transfers</span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-sm md:text-base">
            <Globe className="w-5 h-5 md:w-6 md:h-6 text-amber-400" strokeWidth={2} />
            <span>Global Network</span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-sm md:text-base">
            <Infinity className="w-5 h-5 md:w-6 md:h-6 text-amber-400" strokeWidth={2} />
            <span>Unlimited Access</span>
          </div>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {selectedPlanForModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closeModal()}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4 font-['Plus_Jakarta_Sans']">
                Subscribe to {selectedPlanForModal.name}
              </h3>
              <p className="text-slate-400 mb-6 font-['Plus_Jakarta_Sans']">
                Select your preferred payment method to continue
              </p>
              <div className="space-y-4 mb-6">
                <button 
                  onClick={() => handlePayment(selectedPlanForModal.slug, 'stripe')}
                  disabled={loadingPayment === `${selectedPlanForModal.slug}-stripe`}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:brightness-110 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loadingPayment === `${selectedPlanForModal.slug}-stripe` ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>Pay with Stripe (Credit Card)</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handlePayment(selectedPlanForModal.slug, 'binance')}
                  disabled={loadingPayment === `${selectedPlanForModal.slug}-binance`}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-lg hover:brightness-110 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loadingPayment === `${selectedPlanForModal.slug}-binance` ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>Pay with Binance (Crypto)</span>
                    </>
                  )}
                </button>
              </div>
              {binanceManualData && (
                <div className="border-t border-slate-700 pt-4 space-y-4">
                  <div className="text-center">
                    <div className="inline-block p-3 bg-white rounded-lg">
                      <QRCodeCanvas 
                        value={binanceManualData.wallet_address} 
                        size={150} 
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-slate-300 mt-3 font-['Plus_Jakarta_Sans']">Scan this QR code to pay</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1 font-['Plus_Jakarta_Sans']">Wallet Address</p>
                    <p className="text-sm text-white break-all select-all font-['Plus_Jakarta_Sans']">{binanceManualData.wallet_address}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(binanceManualData.wallet_address)}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    {copyStatus ? 'Copied!' : 'Copy Address'}
                  </button>
                </div>
              )}
              <div className="border-t border-slate-700 pt-4">
                <button 
                  onClick={() => closeModal()}
                  className="w-full py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PricingSection;
