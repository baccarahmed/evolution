import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Rocket, ArrowRight, ShieldCheck, Globe, Infinity, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { livesApi, paymentsApi } from '../../api';
import { formatError } from '../../utils/errorUtils';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '../lightswind/button';
import { Badge } from '../lightswind/badge';

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
        <div key={i} className="relative overflow-hidden h-[3rem] w-[1.5rem] flex items-center justify-center">
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
              className="text-4xl md:text-5xl font-black text-white leading-none absolute orbitron drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]"
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
      <span className="text-lg md:text-xl font-bold text-zinc-500 ml-2 orbitron">{currency}</span>
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
  const [isYearly, setIsYearly] = useState(false);

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

  // Group plans by duration to handle Yearly/Monthly toggle if possible
  // We keep all plans to show what's in the admin dashboard, but we can use the toggle 
  // to highlight specific plans if needed. For now, we show all plans as requested.
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
    <section className="w-full py-24 px-6 relative overflow-hidden flex flex-col items-center bg-transparent" id="plans">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
        .orbitron { font-family: 'Orbitron', sans-serif; }
        .exo-2 { font-family: 'Exo 2', sans-serif; }
        .neon-text-gold { text-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
        .evolution-gradient {
          background: linear-gradient(to right, #6366f1, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .evolution-bg {
          background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
        }
        .popular-border {
          position: relative;
        }
        .popular-border::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 3.6rem;
          padding: 2px;
          background: linear-gradient(135deg, #F59E0B, transparent, #ec4899);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}} />

      {/* Mesh Background */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#a855f7]/30 to-transparent" />
      <div className="absolute top-1/4 -left-[10%] w-[50%] h-[50%] bg-[#6366f1]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-[10%] w-[50%] h-[50%] bg-[#ec4899]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-6">
          <Badge variant="outline" className="rounded-full px-6 py-2 uppercase tracking-[0.2em] text-[10px] font-black bg-[#a855f7]/5 text-[#a855f7] border-[#a855f7]/20 orbitron">
            Elite Access
          </Badge>
          <h2 style={{ fontFamily: '"Times New Roman", Times, serif' }} className="orbitron text-4xl md:text-7xl font-black tracking-tighter text-white leading-tight uppercase">
            Evolution <br /> <span className="evolution-gradient italic">Tiers</span>
          </h2>
        </div>

        <div className="flex flex-wrap gap-8 justify-center items-stretch max-w-7xl mx-auto">
          {plansToShow.map((plan, idx) => {
            const Icon = getPlanIcon(idx);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className={`relative p-6 md:p-8 rounded-[3.5rem] bg-white/[0.02] border-2 backdrop-blur-3xl transition-all group w-full max-w-[380px] ${plan.is_popular ? 'popular-border border-transparent ring-8 ring-[#F59E0B]/5 shadow-2xl shadow-[#F59E0B]/10 z-10' : 'border-white/10 hover:border-[#F59E0B]/30'}`}
              >
                {/* Surface Reflection */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {plan.is_popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F59E0B] text-black text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-lg shadow-[#F59E0B]/20 orbitron">
                    Most Recommended
                  </div>
                )}

                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform ${plan.is_popular ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-white/5 text-zinc-400'}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="orbitron text-lg font-black text-white uppercase tracking-widest">{plan.name}</h3>
                    <p className="exo-2 text-xs text-zinc-500 font-medium leading-relaxed">
                      {plan.description || "Master the markets with elite guidance."}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1 h-12">
                    <AnimatedPrice 
                      price={(plan.price_tnd / 1000).toFixed(0)} 
                      style={idx === 2 ? { fontFamily: 'Helvetica, Arial, sans-serif' } : {}}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-zinc-500 exo-2 text-xs font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full">
                    <Calendar size={12} className="text-[#F59E0B]" />
                    {plan.duration_months} Months Access
                  </div>

                  <Button 
                    onClick={() => handlePlanClick(plan)}
                    size="lg" 
                    className={`w-full h-14 rounded-[1.5rem] font-black text-base transition-all orbitron tracking-widest
                    ${plan.is_popular 
                      ? 'evolution-bg text-white shadow-xl shadow-[#a855f7]/20 hover:scale-[1.02] hover:brightness-110' 
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
                  >
                    {plan.button_text || (user?.active_subscription ? 'Accéder au Dashboard' : 'Commencer')} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <motion.div 
                  className="mt-8 space-y-3 pt-8 border-t border-white/5"
                  initial={{ opacity: 0.6, maxHeight: 100, overflow: 'hidden' }}
                  whileHover={{ opacity: 1, maxHeight: 1000 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex gap-3 items-center text-xs font-bold text-zinc-400 group-hover:text-white transition-colors exo-2">
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.is_popular ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-white/5 text-zinc-600'}`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      {feature}
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center gap-3 font-black text-xl italic text-white orbitron"><ShieldCheck className="w-6 h-6 text-[#F59E0B]" /> SECURED TRANSFERS</div>
          <div className="flex items-center gap-3 font-black text-xl italic text-white orbitron"><Globe className="w-6 h-6 text-[#F59E0B]" /> GLOBAL EDGE L1</div>
          <div className="flex items-center gap-3 font-black text-xl italic text-white orbitron"><Infinity className="w-6 h-6 text-[#F59E0B]" /> UNLIMITED SCALE</div>
        </div>
      </div>

      {/* Payment Selection Modal (Kept from original logic) */}
      <AnimatePresence>
        {selectedPlanForModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl my-8 z-[10000]">
              <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
                {binanceManualData ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <div className="orbitron text-green-500 text-[9px] tracking-[0.4em] uppercase font-black">Secure SSL Verified</div>
                    </div>
                    <div className="orbitron text-[#f3ba2f] text-xs tracking-[0.3em] mb-4 uppercase font-bold flex items-center justify-center gap-2">
                      <ShieldCheck size={14} /> Binance Secure Deposit
                    </div>
                    <div className="bg-white p-6 rounded-2xl inline-block mb-6 shadow-[0_0_50px_rgba(243,186,47,0.2)]">
                      <QRCodeCanvas value={binanceManualData.wallet_address} size={220} level="H" />
                    </div>
                    <div className="space-y-4 text-left">
                      <div className="bg-zinc-900 p-5 rounded-2xl border border-white/5">
                        <label className="text-[9px] text-zinc-500 orbitron uppercase tracking-widest font-bold">Amount to send</label>
                        <div className="text-3xl font-black text-white orbitron tracking-tighter">{binanceManualData.amount} <span className="text-[#f3ba2f]">USDT</span></div>
                        <div className="text-[10px] text-zinc-400 font-bold orbitron uppercase tracking-wider mt-1">Network: <span className="text-blue-400">TRC20 (Tron)</span></div>
                      </div>
                      <div className="bg-zinc-900 p-5 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] text-zinc-500 orbitron uppercase tracking-widest font-bold mb-1 block">Wallet Address</label>
                          <div className="text-[11px] text-white font-mono break-all">{binanceManualData.wallet_address}</div>
                        </div>
                        <button onClick={() => handleCopy(binanceManualData.wallet_address)} className="shrink-0 h-10 w-10 flex items-center justify-center bg-[#f3ba2f] text-black rounded-xl hover:scale-105 transition-transform shadow-lg">
                          <i className={`fas ${copyStatus ? 'fa-check' : 'fa-copy'}`}></i>
                        </button>
                      </div>
                    </div>
                    <button onClick={closeModal} className="w-full mt-8 bg-white hover:bg-[#f3ba2f] text-black font-black orbitron rounded-2xl py-5 transition-all uppercase tracking-[0.3em] text-[11px]">Transfer Sent</button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <div className="orbitron text-[#F59E0B] text-xs tracking-[0.3em] mb-2 uppercase font-bold">Payment Selection</div>
                      <h3 className="orbitron text-2xl font-black text-white uppercase tracking-wider">{selectedPlanForModal.name}</h3>
                    </div>
                    <div className="space-y-4">
                      <button onClick={() => handlePayment(selectedPlanForModal.slug, 'binance')} disabled={loadingPayment !== null} className="w-full bg-[#f3ba2f] hover:bg-[#ffc107] text-black font-black orbitron rounded-2xl transition-all uppercase tracking-[0.15em] text-[12px] shadow-lg flex items-center justify-center gap-3 py-4">
                        <span className="text-2xl">🌍</span>
                        <div className="text-left"><div className="leading-none mb-1">Binance Pay</div><div className="text-[10px] text-black/60 font-medium">USDT & Crypto</div></div>
                      </button>
                    </div>
                    <button onClick={closeModal} className="w-full mt-6 text-zinc-500 hover:text-white orbitron text-[10px] uppercase tracking-[0.2em]">Cancel</button>
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
