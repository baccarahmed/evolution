import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Rocket, ArrowRight, ShieldCheck, Globe, Infinity, Calendar, ChevronRight, Star, Sparkles } from 'lucide-react';
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

// Slot-machine style animated price
function AnimatedPrice({ price, currency = 'DT', style = {} }) {
  const digits = String(price).split("");

  return (
    <div className="flex items-center gap-0" style={style}>
      {digits.map((digit, i) => (
        <div key={i} className="relative overflow-hidden h-[2.25rem] w-[1.2rem] flex items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`price-${i}-${digit}`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 26,
                delay: i * 0.05,
              }}
              className="text-3xl md:text-4xl font-black text-slate-50 leading-none absolute"
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
      <span className="text-sm md:text-base font-semibold text-slate-400 ml-2">{currency}</span>
    </div>
  );
}

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
        console.error("Failed to fetch plans:", err);
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
    
    // Si l'utilisateur a déjà un plan actif, on peut le rediriger vers le dashboard
    // Sinon on ouvre le modal de paiement
    if (user?.active_subscription) {
      navigate('/dashboard');
    } else {
      setSelectedPlanForModal(plan);
    }
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
      alert("Erreur lors de la création du paiement : " + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingPayment(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const closeModal = () => {
    setSelectedPlanForModal(null);
    setBinanceManualData(null);
  };

  const getPlanIcon = (idx) => {
    if (idx === 0) return Rocket;
    if (idx === 1) return Zap;
    return Crown;
  };

  const plansToShow = pricingPlans;

  if (loading) return null;

  // Grid logic: 
  // - If <= 3 items: Force 1 line (lg:grid-cols-3 or lg:grid-cols-2 etc)
  // - If > 3 items: 2 columns per line (lg:grid-cols-2)
  const gridColsClass = plansToShow.length > 3 
    ? 'lg:grid-cols-2' 
    : plansToShow.length === 3
      ? 'lg:grid-cols-3'
      : plansToShow.length === 2
        ? 'lg:grid-cols-2'
        : 'lg:grid-cols-1';

  return (
    <section className="w-full py-32 px-6 relative overflow-hidden flex flex-col items-center bg-transparent" id="plans">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        .plus-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        .cormorant { font-family: 'Cormorant', serif; }
        .evolution-gradient {
          background: linear-gradient(135deg, #F59E0B, #FBBF24, #A855F7, #8B5CF6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
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
          border-radius: 2.25rem;
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
          box-shadow: 0 0 60px -20px rgba(245, 158, 11, 0.15), 0 0 120px -40px rgba(139, 92, 246, 0.1);
        }
      `}} />

      {/* Subtle Background Glows */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/20 via-[#8B5CF6]/20 to-transparent" />
      <div className="absolute top-1/4 -left-[30%] w-[70%] h-[70%] bg-[#8B5CF6]/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-[30%] w-[70%] h-[70%] bg-[#F59E0B]/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-black tracking-[0.35em] uppercase text-amber-300">Elite Evolution</span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-50 leading-tight">
            <span className="cormorant italic">Evolution</span> <span className="evolution-gradient font-black">Tiers</span>
          </h2>
          <p className="max-w-xl mx-auto text-slate-400 text-base md:text-lg font-medium">
            Choose the perfect tier for your trading journey — from beginner to professional
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 justify-center items-stretch max-w-7xl mx-auto w-full">
          <div className="grid gap-5 md:gap-7 md:grid-cols-2 lg:grid-cols-3">
            {plansToShow.map((plan, idx) => {
              const Icon = getPlanIcon(idx);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: idx * 0.1, duration: 0.5, type: "spring", bounce: 0.25 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`relative flex flex-col p-4 md:p-5 rounded-[1.75rem] bg-slate-900/50 border backdrop-blur-2xl transition-all duration-400 cursor-pointer will-change-transform overflow-hidden ${
                    plan.is_popular 
                      ? 'popular-border border-transparent shadow-2xl card-glow z-20 bg-slate-900/70' 
                      : 'border-slate-800/50 hover:border-amber-500/40 hover:bg-slate-900/60 hover:shadow-xl hover:shadow-amber-500/10'
                  }`}
                  onClick={() => handlePlanClick(plan)}
                >
                  {/* Background Shine for Popular */}
                  {plan.is_popular && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                  )}
                  
                  {/* Top Surface Gradient Line */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Popular Badge */}
                  {plan.is_popular && (
                    <motion.div 
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 text-[9px] font-black uppercase tracking-[0.35em] rounded-full shadow-2xl shadow-amber-500/40 z-30"
                    >
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 fill-amber-900/50 text-amber-900" />
                        Most Recommended
                        <Star className="w-3 h-3 fill-amber-900/50 text-amber-900" />
                      </div>
                    </motion.div>
                  )}

                  {/* Card Header */}
                  <div className="flex flex-col items-center text-center space-y-3 mb-5 relative z-10">
                    <div className={`p-3 rounded-xl transition-all duration-400 ${
                      plan.is_popular 
                        ? 'bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-amber-400 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20' 
                        : 'bg-slate-800/40 text-slate-400'
                    }`}>
                      <Icon className="w-6 h-6" strokeWidth={2} />
                    </div>

                    <div className="space-y-2">
                      <h3 className={`text-lg font-black uppercase tracking-tight ${
                        plan.is_popular ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500' : 'text-slate-50'
                      }`}>
                        {plan.name}
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                        {plan.description || "Master the markets with elite guidance."}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 pt-2">
                      <AnimatedPrice 
                        price={(plan.price_tnd / 1000).toFixed(0)} 
                        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      />
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/40">
                      <Calendar size={13} className={plan.is_popular ? 'text-amber-400' : 'text-slate-500'} />
                      {plan.duration_months} Months Access
                    </div>

                    {/* CTA Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePlanClick(plan); }}
                      className={`group relative w-full h-11 px-6 rounded-[1rem] font-extrabold text-xs transition-all duration-400 flex items-center justify-center gap-2 overflow-hidden ${
                        plan.is_popular 
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.97]' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 hover:shadow-lg'
                      }`}
                    >
                      <span className="relative z-10">
                        {plan.button_text || (user?.active_subscription ? 'Go to Dashboard' : 'Get Started')}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 relative z-10 group-hover:translate-x-1 transition-transform duration-400" />
                      
                      {/* Shine effect for popular */}
                      {plan.is_popular && (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000 ease-out" />
                      )}
                    </button>
                  </div>

                  {/* Features List */}
                  <div className="flex-1 pt-4 border-t border-slate-700/40 relative z-10">
                    <div className="space-y-2.5">
                      {plan.features.map((feature, fIdx) => (
                        <motion.div 
                          key={fIdx} 
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.1 + fIdx * 0.03 }}
                          className="flex gap-2.5 items-start text-slate-300 group-hover:text-slate-100 transition-colors duration-300"
                        >
                          <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                            plan.is_popular 
                              ? 'bg-gradient-to-br from-amber-500/25 to-purple-500/25 text-amber-400' 
                              : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'
                          }`}>
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                          <span className="font-medium leading-relaxed text-xs">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-6 text-slate-500/80">
          <div className="flex items-center gap-3 font-semibold text-base text-slate-400">
            <ShieldCheck className="w-6 h-6 text-amber-400" strokeWidth={2} /> 
            <span>Secured Transfers</span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-base text-slate-400">
            <Globe className="w-6 h-6 text-amber-400" strokeWidth={2} /> 
            <span>Global Network</span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-base text-slate-400">
            <Infinity className="w-6 h-6 text-amber-400" strokeWidth={2} /> 
            <span>Unlimited Access</span>
          </div>
        </div>
      </div>

      {/* Payment Selection Modal (Kept from original logic) */}
      <AnimatePresence>
        {selectedPlanForModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-[32px] overflow-hidden shadow-2xl my-8 z-[10000]">
              <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
                {binanceManualData ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <div className="text-green-400 text-[9px] tracking-[0.4em] uppercase font-black">Secure SSL Verified</div>
                    </div>
                    <div className="text-amber-400 text-xs tracking-[0.3em] mb-6 uppercase font-bold flex items-center justify-center gap-2">
                      <ShieldCheck size={14} strokeWidth={2} /> Binance Secure Deposit
                    </div>
                    <div className="bg-white p-6 rounded-2xl inline-block mb-6 shadow-[0_0_50px_rgba(243,186,47,0.2)]">
                      <QRCodeCanvas value={binanceManualData.wallet_address} size={220} level="H" />
                    </div>
                    <div className="space-y-4 text-left">
                      <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/30">
                        <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Amount to send</label>
                        <div className="text-3xl font-black text-slate-50 tracking-tighter">{binanceManualData.amount} <span className="text-amber-400">USDT</span></div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Network: <span className="text-blue-400">TRC20 (Tron)</span></div>
                      </div>
                      <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/30 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 block">Wallet Address</label>
                          <div className="text-[11px] text-slate-200 font-mono break-all">{binanceManualData.wallet_address}</div>
                        </div>
                        <button onClick={() => handleCopy(binanceManualData.wallet_address)} className="shrink-0 h-10 w-10 flex items-center justify-center bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all shadow-lg active:scale-95">
                          {copyStatus ? <Check className="w-4 h-4" strokeWidth={3} /> : <ChevronRight className="w-4 h-4 rotate-90" strokeWidth={2} />}
                        </button>
                      </div>
                    </div>
                    <button onClick={closeModal} className="w-full mt-8 bg-slate-100 hover:bg-white text-slate-950 font-black rounded-2xl py-5 transition-all uppercase tracking-[0.3em] text-[11px]">Transfer Sent</button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <div className="text-amber-400 text-xs tracking-[0.3em] mb-2 uppercase font-bold">Payment Selection</div>
                      <h3 className="text-2xl font-black text-slate-50 uppercase tracking-wider">{selectedPlanForModal.name}</h3>
                    </div>
                    <div className="space-y-4">
                      <button onClick={() => handlePayment(selectedPlanForModal.slug, 'binance')} disabled={loadingPayment !== null} className="w-full bg-[#F3BA2F] hover:bg-[#FBBF24] text-slate-950 font-black rounded-2xl transition-all uppercase tracking-[0.15em] text-[12px] shadow-lg flex items-center justify-center gap-3 py-4 active:scale-[0.98]">
                        <Globe size={20} strokeWidth={2} />
                        <div className="text-left"><div className="leading-none mb-1">Binance Pay</div><div className="text-[10px] text-black/60 font-medium">USDT & Crypto</div></div>
                      </button>
                    </div>
                    <button onClick={closeModal} className="w-full mt-6 text-slate-500 hover:text-slate-300 text-[10px] uppercase tracking-[0.2em] font-semibold">Cancel</button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PricingSection;
