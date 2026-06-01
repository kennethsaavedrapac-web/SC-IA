import React, { useState } from "react";
import { Search, Pill, Stethoscope, Star, Calendar, Clock, MapPin, ChevronRight, CheckCircle, Navigation, BadgeAlert, Sparkles, Filter, X } from "lucide-react";
import { Doctor, Pharmacy, Appointment } from "../types";
import { DOCTORS, PHARMACIES, INITIAL_APPOINTMENTS } from "../data/medicalData";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

interface BuscarViewProps {
  onAddAppointment: (appointment: Appointment) => void;
  appointments: Appointment[];
  onNavigate?: (tab: "home" | "consulta" | "centros" | "buscar" | "premium" | "perfil") => void;
}

export default function BuscarView({ onAddAppointment, appointments, onNavigate }: BuscarViewProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"farmacias" | "medicos">("medicos");

  // Search state for Doctors
  const [specQuery, setSpecQuery] = useState("");
  const [docCityQuery, setDocCityQuery] = useState("Granada");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("Cardiología");

  // Search state for Pharmacies
  const [drugQuery, setDrugQuery] = useState("Paracetamol 500 mg");
  const [pharmCityQuery, setPharmCityQuery] = useState("Granada");

  // Booking system state
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState("2026-06-05");
  const [bookingTime, setBookingTime] = useState("09:00 AM");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Popular specialties list
  const POPULAR_SPECIALTIES = [
    { id: "Cardiología", label: "Cardiología", icon: "💙" },
    { id: "Dermatología", label: "Dermatología", icon: "🧴" },
    { id: "Pediatría", label: "Pediatría", icon: "👶" },
    { id: "Ginecología", label: "Ginecología", icon: "♀️" },
    { id: "Traumatología", label: "Traumatología", icon: "🦴" },
  ];

  // Filtering doctors
  const filteredDoctors = DOCTORS.filter((doc) => {
    const matchesSpec = specQuery
      ? doc.specialty.toLowerCase().includes(specQuery.toLowerCase())
      : doc.specialty === selectedSpecialty;
    return matchesSpec;
  });

  // Filtering pharmacies
  const filteredPharmacies = PHARMACIES.filter((pharm) => {
    const matchesDrug = drugQuery
      ? pharm.medsAvailable.some((med) => med.toLowerCase().includes(drugQuery.toLowerCase()))
      : true;
    return matchesDrug;
  });

  const handleBookAppointment = () => {
    if (!bookingDoctor) return;
    const newApp: Appointment = {
      id: `app-custom-${Date.now()}`,
      doctorName: bookingDoctor.name,
      specialty: bookingDoctor.specialty,
      date: bookingDate,
      time: bookingTime,
      status: "Confirmada",
    };
    onAddAppointment(newApp);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingDoctor(null);
    }, 2800);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="flex flex-col px-6 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 border-b border-blue-50/50 dark:border-slate-800">
        <div className="flex justify-between items-center w-full max-w-6xl mx-auto">
          <div
            onClick={() => onNavigate && onNavigate("home")}
            className="flex items-center space-x-2 cursor-pointer active:opacity-75 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-display font-bold text-lg text-slate-800 dark:text-white">
              Salud-Conecta <span className="text-blue-600 dark:text-blue-400">IA</span>
            </span>
          </div>
          <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/50">{t('searchTitle')}</span>
        </div>

        {/* Dynamic Dual Tab PWA switch */}
        <div className="mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center relative gap-1 md:max-w-md md:mx-auto md:w-full">
          <button
            id="tab-search-pharmacies"
            onClick={() => setActiveTab("farmacias")}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 active:scale-95 z-10 select-none ${activeTab === "farmacias" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            <Pill className="w-4 h-4 shrink-0" />
            <span>{t('pharmacies')}</span>
          </button>
          <button
            id="tab-search-doctors"
            onClick={() => setActiveTab("medicos")}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 active:scale-95 z-10 select-none ${activeTab === "medicos" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span>{t('doctors')}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-6 pt-5 max-w-6xl mx-auto w-full">
        {/* DOCTORS SCREEN VIEW */}
        <AnimatePresence mode="wait">
          {activeTab === "medicos" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Card Finder Form */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-display font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('searchDoctors')}</h3>

                {/* Specialties picker input field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t('specialty')}</label>
                  <div className="relative">
                    <input
                      id="input-doctor-search-specialty"
                      type="text"
                      placeholder={t('specialtyPlaceholder')}
                      value={specQuery}
                      onChange={(e) => setSpecQuery(e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-2xl py-3 pl-4 pr-10 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-xs"
                    />
                    <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Locality Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t('location')}</label>
                  <div className="relative">
                    <input
                      id="input-doctor-search-locality"
                      type="text"
                      placeholder={t('locationPlaceholder')}
                      value={docCityQuery}
                      onChange={(e) => setDocCityQuery(e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-2xl py-3 pl-4 pr-10 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-xs"
                    />
                    <MapPin className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Submit trigger button */}
                <button
                  id="btn-doctor-run-search"
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 py-3.5 px-4 rounded-2xl text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/10 flex items-center justify-center space-x-2 transition-all mt-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('searchDoctors')}</span>
                </button>
              </div>

              {/* Horizontal sliding popular categories */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('popularSpecialties')}</h4>
                <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 no-scrollbar">
                  {POPULAR_SPECIALTIES.map((spec) => {
                    const isSelected = selectedSpecialty === spec.id && !specQuery;
                    return (
                      <button
                        id={`btn-specialties-shortcut-${spec.id}`}
                        key={spec.id}
                        onClick={() => {
                          setSpecQuery("");
                          setSelectedSpecialty(spec.id);
                        }}
                        className={`px-4.5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all text-center flex flex-col items-center justify-center border shrink-0 ${isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/15"
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                      >
                        <span className="text-lg mb-1">{spec.icon}</span>
                        <span>{spec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Doctors listing */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('featuredDoctors')}</h4>
                  <span className="text-[11px] font-bold text-blue-600 tracking-tight cursor-pointer hover:underline">{t('viewAll')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doc) => (
                      <div
                        id={`row-doctor-profile-${doc.id}`}
                        key={doc.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-blue-100 dark:hover:border-blue-900/50 transition-all"
                      >
                        <div className="flex items-center space-x-3.5">
                          <img
                            src={doc.photoUrl}
                            alt={doc.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h5 className="text-sm font-bold text-slate-800 dark:text-white">{doc.name}</h5>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{doc.specialty}</p>

                            {/* rating and years exp */}
                            <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="flex items-center space-x-0.5 text-yellow-500 font-bold">
                                <Star className="w-3 h-3 fill-yellow-500 shrink-0" />
                                <span>{doc.rating}</span>
                              </span>
                              <span>•</span>
                              <span>{doc.experience} {t('expYears')}</span>
                            </div>
                          </div>
                        </div>

                        {/* availability status badge and action button for schedule */}
                        <div className="text-right flex flex-col items-end gap-1 shrink-0 ml-4">
                          <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            {doc.status}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block font-mono mt-0.5">{doc.distance}</span>

                          <button
                            id={`btn-book-appointment-for-${doc.id}`}
                            onClick={() => setBookingDoctor(doc)}
                            className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-850 flex items-center space-x-0.5 group hover:underline"
                          >
                            <span>{t('bookAppointment')}</span>
                            <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white dark:bg-slate-900 py-10 text-center rounded-3xl border border-dashed border-slate-300/80 dark:border-slate-700 p-6 text-slate-400">
                      <BadgeAlert className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 animate-pulse mb-3" />
                      <p className="text-sm font-medium">{t('noDoctorsFound').replace('{spec}', specQuery || selectedSpecialty).replace('{city}', docCityQuery)}</p>
                      <button
                        onClick={() => {
                          setSpecQuery("");
                          setSelectedSpecialty("Cardiología");
                        }}
                        className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                      >
                        {t('resetFilters')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Informative disclaimer footer */}
              <div className="text-center font-mono text-[10px] text-slate-400/80 py-4 border-t border-slate-100">
                {t('doctorsDisclaimer')}
              </div>
            </motion.div>
          )}

          {/* PHARMACIES SCREEN VIEW */}
          {activeTab === "farmacias" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Card Finder Form */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-display font-semibold text-slate-800 dark:text-slate-200 text-sm">{t('searchPharmacies')}</h3>

                {/* Drugs Query */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t('medicine')}</label>
                  <div className="relative">
                    <input
                      id="input-pharmacy-search-drug"
                      type="text"
                      placeholder={t('medicinePlaceholder')}
                      value={drugQuery}
                      onChange={(e) => setDrugQuery(e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-2xl py-3 pl-4 pr-10 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-xs"
                    />
                    <Pill className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Local select Granada dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t('location')}</label>
                  <div className="relative">
                    <input
                      id="input-pharmacy-search-locality"
                      type="text"
                      placeholder={t('locationPlaceholder')}
                      value={pharmCityQuery}
                      onChange={(e) => setPharmCityQuery(e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-2xl py-3 pl-4 pr-10 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-xs"
                    />
                    <MapPin className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Submit trigger button */}
                <button
                  id="btn-pharmacy-run-search"
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 py-3.5 px-4 rounded-2xl text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/10 flex items-center justify-center space-x-2 transition-all mt-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('searchTitle')}</span>
                </button>
              </div>

              {/* Head line with filter */}
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('nearbyPharmacies')}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('pharmaciesFound').replace('{count}', filteredPharmacies.length.toString())}</p>
                </div>
                <button
                  id="btn-pharmacies-filter-tool"
                  onClick={() => alert("Mostrando opciones de filtros para farmacias: Cobertura de seguros, Horario extendido de 24h, Envío a domicilio.")}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 active:scale-95 flex items-center space-x-1 transition-all shadow-sm"
                >
                  <Filter className="w-3.5 h-3.5 select-none" />
                  <span>{t('filters')}</span>
                </button>
              </div>

              {/* Pharmacies List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                {filteredPharmacies.length > 0 ? (
                  filteredPharmacies.map((pharm) => (
                    <div
                      id={`row-pharmacy-profile-${pharm.id}`}
                      key={pharm.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-blue-100 dark:hover:border-blue-900/50 transition-all group"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30 font-bold text-lg">
                          🏪
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-800 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">{pharm.name}</h5>
                          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center space-x-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                            <span>{pharm.address}</span>
                          </p>
                          <div className="flex items-center space-x-2 mt-1.5 text-[10px] font-bold">
                            <span className="text-slate-500 dark:text-slate-400 font-mono">📍 {pharm.distance}</span>
                            <span>•</span>
                            <span className={pharm.openNow ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400"}>
                              {pharm.openNow ? t('openNow') : pharm.closingTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* availability and GPS Navigation button */}
                      <div className="text-right flex flex-col items-end gap-1 shrink-0 ml-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${pharm.status === "Disponible"
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : pharm.status === "Poco stock"
                            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            : "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                          }`}>
                          ✓ {pharm.status === "Disponible" ? t('available') : pharm.status === "Poco stock" ? t('lowStock') : pharm.status}
                        </span>

                        <button
                          id={`btn-run-route-for-${pharm.id}`}
                          onClick={() => alert(`Iniciando navegación con Google Maps para ${pharm.name} en ${pharm.address}. Distancia aproximada de ${pharm.distance}`)}
                          className="mt-4 px-3.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center space-x-1 transition-all active:scale-95 shadow-sm border border-blue-100 dark:border-blue-900/50"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{t('viewRoute')}</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-slate-900 py-10 text-center rounded-3xl border border-dashed border-slate-300/80 dark:border-slate-700 p-6 text-slate-400">
                    <BadgeAlert className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 animate-pulse mb-3" />
                      <p className="text-sm font-medium">{t('noMedicineFound').replace('{drug}', drugQuery).replace('{city}', pharmCityQuery)}</p>
                    <button
                      onClick={() => setDrugQuery("Paracetamol 500 mg")}
                      className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                    >
                        {t('resetSearch')}
                    </button>
                  </div>
                )}
              </div>

              {/* Informative disclaimer footer */}
              <div className="text-center font-mono text-[10px] text-slate-400/80 py-4 border-t border-slate-100">
                {t('pharmaciesDisclaimer')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* APPOINTMENT BOOKING DIALOG MODAL */}
      <AnimatePresence>
        {bookingDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
            >
              {/* Top border decor */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500"></div>

              {bookingSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-650 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-emerald-50">
                    <CheckCircle className="w-8 h-8 text-emerald-600 animate-bounce" />
                  </div>
                  <h3 className="font-display font-medium text-2xl text-slate-950">{t('bookingSuccessTitle')}</h3>
                  <p className="text-xs text-slate-500 max-w-[260px] mx-auto leading-relaxed">
                    {t('bookingSuccessDesc').replace('{name}', bookingDoctor.name).replace('{id}', Math.floor(Math.random() * 89999 + 10000).toString())}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{t('smsReminder')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900">{t('bookTitle')}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{t('bookSubtitle')}</p>
                    </div>
                    <button
                      onClick={() => setBookingDoctor(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Doctor Profile mini badge */}
                  <div className="p-3 bg-blue-50/40 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 flex items-center space-x-3 mt-1">
                    <img
                      src={bookingDoctor.photoUrl}
                      alt={bookingDoctor.name}
                      className="w-11 h-11 rounded-xl object-cover border border-white dark:border-slate-800 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white">{bookingDoctor.name}</h4>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{bookingDoctor.specialty} • {t('distanceAway').replace('{distance}', bookingDoctor.distance)}</p>
                    </div>
                  </div>

                  {/* Date Picker select option */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t('chooseDate')}</label>
                    <div className="relative">
                      <input
                        id="select-booking-date"
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2.5 px-3.5 border border-slate-200 dark:border-slate-700 outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* Time Selector */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{t('chooseTime')}</label>
                    <select
                      id="select-booking-schedule"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2.5 px-3.5 border border-slate-200 dark:border-slate-700 outline-none text-xs cursor-pointer focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    >
                      <option value="09:00 AM">09:00 AM (Mañana)</option>
                      <option value="10:30 AM">10:30 AM (Mañana)</option>
                      <option value="12:00 PM">12:00 PM (Mediodía)</option>
                      <option value="02:30 PM">02:30 PM (Tarde)</option>
                      <option value="04:15 PM">04:15 PM (Tarde)</option>
                    </select>
                  </div>

                  {/* CTA Checkout Trigger */}
                  <button
                    id="btn-confirm-doctor-booking"
                    onClick={handleBookAppointment}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 py-3.5 rounded-2xl text-white font-bold text-xs tracking-wider shadow-md shadow-blue-500/10 mt-3 transition-all"
                  >
                    {t('confirmBooking')}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
