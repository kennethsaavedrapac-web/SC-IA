import React, { useState } from "react";
import { Star, Building, Check, ShieldCheck, Ticket, Sparkles, X, Gift, Heart, ShieldAlert, CreditCard, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

import { UserProfile } from "../types";

interface PremiumViewProps {
  user: UserProfile;
  onUnlockPremium: () => void;
  isPremium: boolean;
  onNavigate?: (tab: "home" | "consulta" | "buscar" | "premium" | "perfil") => void;
}

export default function PremiumView({ user, onUnlockPremium, isPremium, onNavigate }: PremiumViewProps) {
  const { t } = useLanguage();
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [showBadgeMessage, setShowBadgeMessage] = useState(false);

  // Checkout simulator
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: string } | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === "SALUD100") {
      onUnlockPremium();
      setPromoMessage({ text: t('promoSuccess'), error: false });
      setPromoCode("");
    } else if (promoCode.trim() === "") {
      setPromoMessage({ text: t('promoEmpty'), error: true });
    } else {
      setPromoMessage({ text: t('promoInvalid'), error: true });
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingCheckout(true);

    // Simulated network delay
    setTimeout(() => {
      setIsProcessingCheckout(false);
      setCheckoutSuccess(true);
      onUnlockPremium(); // set parent State to premium

      setTimeout(() => {
        setCheckoutSuccess(false);
        setCheckoutPlan(null);
      }, 2500);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-dvh relative overflow-hidden">
      {}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-brand-600/10 dark:bg-brand-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-400/10 dark:bg-cyan-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-amber-500/5 dark:bg-amber-500/5 blur-[100px] pointer-events-none"></div>

      {}
      <header className="flex justify-between items-center px-6 py-4 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl sticky top-0 z-30 border-b border-white/20 dark:border-slate-800/50">
        <div className="flex justify-between items-center w-full max-w-5xl mx-auto">
          <div
            onClick={() => onNavigate && onNavigate("home")}
            className="flex items-center space-x-2 cursor-pointer active:opacity-75 transition-opacity"
          >
            <img
              src="/app-logo-v2.jpg"
              alt="Logo"
              className="w-8 h-8 rounded-lg shadow-sm object-cover border border-brand-100 dark:border-brand-900/30"
            />
            <span className="font-display font-bold text-lg text-slate-800 dark:text-white">
              Salud-Conecta <span className="text-brand-600">IA</span>
            </span>
          </div>

          <div className="relative flex flex-col items-end">
            <button
              onClick={() => {
                setShowBadgeMessage(true);
                setTimeout(() => setShowBadgeMessage(false), 3000);
              }}
              className="flex items-center space-x-1.5 text-[11px] font-extrabold text-amber-800 dark:text-amber-300 bg-gradient-to-r from-amber-100 to-yellow-50 dark:from-amber-900/50 dark:to-amber-800/30 px-4 py-1.5 rounded-full border border-amber-300/60 dark:border-amber-700/50 backdrop-blur-sm transition-all active:scale-95 shadow-sm uppercase tracking-wider"
            >
              <Crown className="w-4 h-4" />
              <span>Premium</span>
            </button>
            <AnimatePresence>
              {showBadgeMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-slate-900 dark:bg-slate-800 text-white text-[11px] p-3 rounded-2xl shadow-xl border border-slate-700 z-50 text-center font-medium leading-relaxed"
                >
                  Servicios exclusivos y atención prioritaria para tu salud.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {}
      <div className="px-6 pt-8 pb-4 max-w-5xl mx-auto w-full relative z-10">
        <h2 className="font-display font-bold text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 tracking-tight leading-tight pb-1">
          {t('premiumTitle')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed max-w-xl">
          {t('premiumSubtitle')}
        </p>

        {isPremium && (
          <div className="mt-6 bg-emerald-500/10 dark:bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 p-4.5 rounded-2xl text-sm text-emerald-800 dark:text-emerald-300 font-bold flex items-center space-x-4 shadow-lg shadow-emerald-500/5">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-inner">🏆</div>
            <div>
              <span className="text-base">{t('premiumActiveMsg').replace('{name}', (user.id === "guest" || user.name === "Invitado") ? t('guest') : user.name.split(" ")[0])}</span>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5">{t('premiumActiveSub')}</p>
            </div>
          </div>
        )}

        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-200 mt-8 mb-5 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <span>{t('choosePlan')}</span>
        </h3>
      </div>

      {}
      <main className="px-6 flex-1 space-y-8 max-w-5xl mx-auto w-full relative z-10">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 items-center max-w-5xl mx-auto">
          {}
          <div className="bg-gradient-to-br from-white to-cyan-50/50 dark:from-slate-900 dark:to-cyan-950/20 rounded-[2rem] p-8 border border-cyan-100 dark:border-cyan-900/50 shadow-xl shadow-cyan-500/5 relative overflow-hidden flex flex-col gap-6 justify-between transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 group ring-1 ring-white/50 dark:ring-white/5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-200/40 dark:bg-cyan-800/30 rounded-full blur-3xl pointer-events-none group-hover:scale-125 group-hover:bg-cyan-300/40 dark:group-hover:bg-cyan-700/40 transition-all duration-700"></div>

            <div className="flex-1 text-left relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-100 to-brand-50 dark:from-cyan-900/50 dark:to-brand-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold shadow-sm border border-cyan-200/50 dark:border-cyan-800/50">
                  <Star className="w-6 h-6 fill-cyan-400 stroke-cyan-600 dark:fill-cyan-500 dark:stroke-cyan-300" />
                </div>
                <h4 className="font-display font-bold text-2xl text-slate-900 dark:text-white">{t('basicPlan')}</h4>
              </div>

              <div className="mb-6 mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold text-cyan-700 dark:text-cyan-400 drop-shadow-sm">$4.99</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">/mes</span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-sm mb-6">
                {t('basicDesc')}
              </p>

              <button
                id="btn-choose-plan-basic"
                onClick={() => setCheckoutPlan({ name: t('basicPlan'), price: "$4.99/mes" })}
                className="block w-full sm:max-w-xs bg-gradient-to-r from-cyan-600 to-brand-600 hover:from-cyan-500 hover:to-brand-600 text-white font-bold py-3.5 px-6 rounded-2xl text-sm tracking-wide transition-all active:scale-95 text-center shadow-lg shadow-cyan-500/25 mb-2 border border-cyan-400/50"
              >
                {t('selectPlan')}
              </button>
            </div>

            {}
            <div className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-md p-5 rounded-2xl border border-cyan-100/50 dark:border-cyan-900/30 shrink-0 select-none md:w-72 relative z-10 shadow-inner">
              <ul className="space-y-3.5">
                {[
                  t('basicBenefit1'),
                  t('basicBenefit2'),
                  t('basicBenefit3'),
                  t('basicBenefit4'),
                  t('basicBenefit5')
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start space-x-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <Check className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {}
          <div className="bg-gradient-to-br from-slate-900 via-[#0a192f] to-slate-900 dark:from-slate-950 dark:via-brand-600 dark:to-slate-950 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6 justify-between transform hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(251,191,36,0.15)] transition-all duration-500 border border-amber-500/30 ring-1 ring-amber-400/20 scale-100 md:scale-[1.05] z-10 group">
            {}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-colors duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-600/20 rounded-full blur-2xl pointer-events-none group-hover:bg-brand-400/20 transition-colors duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            {}
            <div className="absolute top-6 right-6 text-[11px] font-extrabold text-amber-900 bg-gradient-to-r from-amber-200 to-yellow-400 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center space-x-1 uppercase tracking-widest border border-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIP PRO</span>
            </div>

            <div className="flex-1 text-left relative z-10 mt-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-500 p-[1px] shadow-lg">
                  <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center">
                     <Building className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <h4 className="font-display font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-amber-400">{t('institutionPlan')}</h4>
              </div>

              <div className="mb-6 mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold text-white drop-shadow-sm">$9.99</span>
                <span className="text-amber-200/70 text-sm font-medium">/mes</span>
              </div>

              <p className="text-brand-100/80 text-sm leading-relaxed max-w-sm mb-6 font-light">
                {t('institutionDesc')}
              </p>

              <button
                id="btn-choose-plan-institution"
                onClick={() => setCheckoutPlan({ name: t('institutionPlan'), price: "$9.99/mes" })}
                className="block w-full sm:max-w-xs bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-amber-950 font-bold py-3.5 px-6 rounded-2xl text-sm tracking-wide transition-all active:scale-95 text-center shadow-[0_0_20px_rgba(251,191,36,0.25)] border border-amber-300/50 mb-2"
              >
                {t('selectPlan')}
              </button>
            </div>

            {}
            <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-amber-500/20 shrink-0 select-none md:w-72 relative z-10 shadow-inner">
              <ul className="space-y-3.5">
                {[
                  t('institutionBenefit1'),
                  t('institutionBenefit2'),
                  t('institutionBenefit3'),
                  t('institutionBenefit4'),
                  t('institutionBenefit5'),
                  t('institutionBenefit6')
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start space-x-3 text-sm font-medium text-amber-50/90">
                    <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[1.5rem] p-5 border border-white/50 dark:border-slate-800/50 flex items-center space-x-4 relative overflow-hidden shadow-lg shadow-slate-200/20 dark:shadow-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/10 dark:bg-brand-600/5 rounded-full blur-2xl"></div>
          <div className="w-12 h-12 rounded-full bg-brand-50/80 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-100/50 dark:border-brand-900/50 shadow-sm backdrop-blur-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              {t('secureInfo')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('secureDesc')}
            </p>
          </div>
        </div>

        {}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[1.5rem] p-5 border border-white/50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-5 mt-4 shadow-lg shadow-slate-200/20 dark:shadow-none relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-2xl"></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <Ticket className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('havePromo')}</span>
          </div>

          <div className="flex gap-3 items-center w-full sm:w-auto relative z-10">
            <input
              id="input-premium-promo-code"
              type="text"
              placeholder={t('promoPlaceholder')}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 sm:w-36 bg-white/80 dark:bg-slate-950/50 rounded-xl py-2.5 px-4 border border-slate-200/80 dark:border-slate-700/80 outline-none text-sm text-slate-800 dark:text-slate-200 font-mono shadow-inner focus:ring-2 focus:ring-brand-600/20 transition-all"
            />
            <button
              id="btn-apply-promo-code"
              onClick={handleApplyPromo}
              className="bg-brand-600 hover:bg-brand-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm active:scale-95 transition-all outline-none shadow-md shadow-brand-500/20"
            >
              {t('redeemCode')}
            </button>
          </div>
        </div>

        {promoMessage && (
          <p className={`text-sm ml-2 text-left font-bold ${promoMessage.error ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"} animate-in fade-in slide-in-from-top-1`}>
            {promoMessage.text}
          </p>
        )}

      </main>

      {}
      <AnimatePresence>
        {checkoutPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
            >
              {checkoutSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-emerald-50 dark:border-emerald-900/50">
                    <Check className="w-8 h-8 text-emerald-600 animate-bounce" />
                  </div>
                  <h3 className="font-display font-medium text-2xl text-slate-950 dark:text-white">{t('subscriptionActive')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                    {t('checkoutSuccessMsg').replace('{price}', checkoutPlan.price).replace('{name}', checkoutPlan.name)}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{t('transactionId')}: TXN-{Math.floor(Math.random() * 89999 + 10000)}</p>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{t('checkoutTitle')}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('checkoutSubtitle')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutPlan(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {}
                  <div className="p-3.5 bg-brand-50/50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-900/40 flex justify-between items-center text-xs font-bold leading-none mt-1">
                    <span className="text-slate-600 dark:text-slate-300">{checkoutPlan.name}</span>
                    <span className="text-brand-900 font-mono">{checkoutPlan.price}</span>
                  </div>

                  {}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('cardNumber')}</label>
                    <div className="relative">
                      <input
                        id="input-checkout-card-number"
                        type="text"
                        placeholder="4500 1200 4566 9800"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        className="w-full text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 px-3.5 pl-10 border border-slate-200 dark:border-slate-700 outline-none text-xs font-mono"
                      />
                      <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('expiry')}</label>
                      <input
                        id="input-checkout-card-expiry"
                        type="text"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                        className="w-full text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 px-3.5 border border-slate-200 dark:border-slate-700 outline-none text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('cvv')}</label>
                      <input
                        id="input-checkout-card-cvv"
                        type="text"
                        placeholder="123"
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value)}
                        required
                        className="w-full text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 px-3.5 border border-slate-200 dark:border-slate-700 outline-none text-xs font-mono"
                      />
                    </div>
                  </div>

                  {}
                  <button
                    id="btn-confirm-checkout-payment"
                    type="submit"
                    disabled={isProcessingCheckout}
                    className="w-full bg-brand-600 hover:bg-brand-900 active:scale-95 py-3.5 rounded-2xl text-white font-bold text-xs tracking-wider shadow-md shadow-brand-500/10 mt-3 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{isProcessingCheckout ? t('processing') : t('pay').replace('{price}', checkoutPlan.price)}</span>
                  </button>

                  <div className="text-[10px] text-slate-400/80 dark:text-slate-500/80 text-center leading-normal">
                    {t('pciStandard')}
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
