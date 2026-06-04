import React, { useState } from "react";
import { Star, Building, Check, ShieldCheck, Ticket, Sparkles, X, Gift, Heart, ShieldAlert, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

import { UserProfile } from "../types";

interface PremiumViewProps {
  user: UserProfile;
  onUnlockPremium: () => void;
  isPremium: boolean;
  onNavigate?: (tab: "home" | "consulta" | "centros" | "buscar" | "premium" | "perfil") => void;
}

export default function PremiumView({ user, onUnlockPremium, isPremium, onNavigate }: PremiumViewProps) {
  const { t } = useLanguage();
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; error: boolean } | null>(null);

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
    <div className="flex flex-col min-h-screen pb-24 bg-gradient-to-b from-[#f5f8ff] to-[#f8fafc] dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-blue-50/50 dark:border-slate-800">
        <div className="flex justify-between items-center w-full max-w-5xl mx-auto">
          <div
            onClick={() => onNavigate && onNavigate("home")}
            className="flex items-center space-x-2 cursor-pointer active:opacity-75 transition-opacity"
          >
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-8 h-8 rounded-lg shadow-sm object-cover border border-blue-100 dark:border-blue-900/30"
            />
            <span className="font-display font-bold text-lg text-slate-800 dark:text-white">
              Salud-Conecta <span className="text-blue-600">IA</span>
            </span>
          </div>
          <span className="text-xs font-bold text-blue-600 animate-pulse bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/50">🔥 Premium</span>
        </div>
      </header>

      {/* Hero Header */}
      <div className="px-6 pt-5 pb-3 max-w-5xl mx-auto w-full">
        <h2 className="font-display font-bold text-3.5xl text-slate-900 dark:text-white tracking-tight leading-tight">
          {t('premiumTitle')}
        </h2>
        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
          {t('premiumSubtitle')}
        </p>

        {isPremium && (
          <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl text-xs text-emerald-800 dark:text-emerald-400 font-bold flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">🏆</div>
            <div>
              <span>{t('premiumActiveMsg').replace('{name}', (user.id === "guest" || user.name === "Invitado") ? t('guest') : user.name.split(" ")[0])}</span>
              <p className="text-[10px] text-emerald-500 font-normal mt-0.5">{t('premiumActiveSub')}</p>
            </div>
          </div>
        )}

        <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-200 mt-6 mb-4">
          {t('choosePlan')}
        </h3>
      </div>

      {/* Main content grids */}
      <main className="px-6 flex-1 space-y-6 max-w-5xl mx-auto w-full">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PREMIUM BÁSICO CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-6 justify-between transform hover:scale-[1.01] transition-transform duration-200">
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex-1 text-left">
              <div className="flex items-center space-x-2.5 mb-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Star className="w-5 h-5 fill-blue-500 stroke-blue-700" />
                </div>
                <h4 className="font-display font-bold text-xl text-slate-900 dark:text-white">{t('basicPlan')}</h4>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4">
                {t('basicDesc')}
              </p>

              <span className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] px-3.5 py-1.5 rounded-full font-bold border border-blue-100 dark:border-blue-900/50 mb-4 font-mono">
                {t('idealForYou')}
              </span>

              <button
                id="btn-choose-plan-basic"
                onClick={() => setCheckoutPlan({ name: t('basicPlan'), price: "$4.99/mes" })}
                className="block w-full sm:max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl text-xs tracking-wider transition-all active:scale-95 text-center shadow-md shadow-blue-500/10 mb-4"
              >
                {t('selectPlan')}
              </button>
            </div>

            {/* Checklist list */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 shrink-0 select-none md:w-64">
              <ul className="space-y-3">
                {[
                  t('basicBenefit1'),
                  t('basicBenefit2'),
                  t('basicBenefit3'),
                  t('basicBenefit4'),
                  t('basicBenefit5')
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* PREMIUM INSTITUCIÓN CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-6 justify-between transform hover:scale-[1.01] transition-transform duration-200">
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex-1 text-left">
              <div className="flex items-center space-x-2.5 mb-2.5">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-display font-bold text-xl text-slate-900 dark:text-white">{t('institutionPlan')}</h4>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4">
                {t('institutionDesc')}
              </p>

              <span className="inline-block bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] px-3.5 py-1.5 rounded-full font-bold border border-purple-100 dark:border-purple-900/50 mb-4 font-mono">
                {t('forTeams')}
              </span>

              <button
                id="btn-choose-plan-institution"
                onClick={() => setCheckoutPlan({ name: t('institutionPlan'), price: "$49.99/mes" })}
                className="block w-full sm:max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl text-xs tracking-wider transition-all active:scale-95 text-center shadow-md shadow-indigo-500/10 mb-4"
              >
                {t('selectPlan')}
              </button>
            </div>

            {/* Checklist list */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 shrink-0 select-none md:w-64">
              <ul className="space-y-3">
                {[
                  t('institutionBenefit1'),
                  t('institutionBenefit2'),
                  t('institutionBenefit3'),
                  t('institutionBenefit4'),
                  t('institutionBenefit5'),
                  t('institutionBenefit6')
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Security protection banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center space-x-3.5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-md"></div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              {t('secureInfo')}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {t('secureDesc')}
            </p>
          </div>
        </div>

        {/* PROMO CODES SEGMENT */}
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl p-4.5 border border-slate-200/50 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
          <div className="flex items-center space-x-3">
            <Ticket className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('havePromo')}</span>
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            <input
              id="input-premium-promo-code"
              type="text"
              placeholder={t('promoPlaceholder')}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 sm:w-32 bg-white dark:bg-slate-800 rounded-xl py-2 px-3 border border-slate-200 dark:border-slate-700 outline-none text-xs text-slate-800 dark:text-slate-200 font-mono"
            />
            <button
              id="btn-apply-promo-code"
              onClick={handleApplyPromo}
              className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all outline-none"
            >
              {t('redeemCode')}
            </button>
          </div>
        </div>

        {promoMessage && (
          <p className={`text-xs ml-2 text-left font-medium ${promoMessage.error ? "text-rose-400" : "text-emerald-700"}`}>
            {promoMessage.text}
          </p>
        )}

      </main>

      {/* CHECKOUT MODAL POPUP */}
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

                  {/* Summary row */}
                  <div className="p-3.5 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex justify-between items-center text-xs font-bold leading-none mt-1">
                    <span className="text-slate-600 dark:text-slate-300">{checkoutPlan.name}</span>
                    <span className="text-blue-700 font-mono">{checkoutPlan.price}</span>
                  </div>

                  {/* Card number input */}
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

                  {/* Expiry and CVV */}
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

                  {/* Submit checkout billing details */}
                  <button
                    id="btn-confirm-checkout-payment"
                    type="submit"
                    disabled={isProcessingCheckout}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 py-3.5 rounded-2xl text-white font-bold text-xs tracking-wider shadow-md shadow-blue-500/10 mt-3 transition-all flex items-center justify-center space-x-2"
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
