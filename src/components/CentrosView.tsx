import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HealthCenter } from "../types";
import { HEALTH_CENTERS, HEALTH_CENTER_DEPARTMENTS, HEALTH_CENTER_TOTAL } from "../data/healthUnits";
import { useLanguage } from "../contexts/LanguageContext";
import { AlertTriangle, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CentrosViewProps {
  onNavigate?: (tab: "home" | "consulta" | "centros" | "buscar" | "premium" | "perfil") => void;
  onTriggerEmergency?: () => void;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const NEARBY_RADIUS_KM = 25;
const COORDINATED_CENTER_COUNT = HEALTH_CENTERS.filter((center) => center.latitude && center.longitude).length;

function getDistanceKm(from: UserLocation, to: HealthCenter): number {
  if (!to.latitude || !to.longitude) return Number.POSITIVE_INFINITY;

  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export default function CentrosView({ onNavigate, onTriggerEmergency }: CentrosViewProps) {
  const { t } = useLanguage();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [locationQuery, setLocationQuery] = useState("Granada");
  const [selectedCenter, setSelectedCenter] = useState<HealthCenter | null>(
    HEALTH_CENTERS.find((center) => center.department?.toLowerCase().includes("granada")) ?? HEALTH_CENTERS[0],
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [detectedCity, setDetectedCity] = useState("");
  const [locationMode, setLocationMode] = useState<"nearby" | "manual">("nearby");
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [geoError, setGeoError] = useState("");
  const [activeFilter, setActiveFilter] = useState<"todos" | "hospital" | "centro" | "farmacia">("todos");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const normalizeQuery = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const requestCurrentLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoError("Tu navegador no permite usar ubicación en tiempo real.");
      setLocationMode("manual");
      return;
    }

    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGeoStatus("ready");
        setGeoError("");
        setLocationMode("nearby");
      },
      (error) => {
        setGeoStatus("error");
        setGeoError(error.message || "No se pudo obtener tu ubicación.");
        setLocationMode("manual");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 12000,
      },
    );
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoError("Tu navegador no permite usar ubicación en tiempo real.");
      setLocationMode("manual");
      return;
    }

    setGeoStatus("loading");
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGeoStatus("ready");
        setGeoError("");
        setLocationMode("nearby");
      },
      (error) => {
        setGeoStatus("error");
        setGeoError(error.message || "No se pudo obtener tu ubicación.");
        setLocationMode("manual");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 12000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!userLocation) return;

    const nearestCenter = HEALTH_CENTERS
      .filter((center) => center.latitude && center.longitude)
      .map((center) => ({ center, distanceKm: getDistanceKm(userLocation, center) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0]?.center;

    const fallbackCity = nearestCenter?.municipality ?? "";

    if (!googleMapsApiKey) {
      setDetectedCity(fallbackCity);
      setLocationQuery(fallbackCity || "Mi ubicación");
      return;
    }

    const controller = new AbortController();
    const reverseGeocode = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLocation.latitude},${userLocation.longitude}&key=${encodeURIComponent(googleMapsApiKey)}&language=es`,
          { signal: controller.signal },
        );
        const data = await response.json();
        const components = data.results?.[0]?.address_components ?? [];
        const cityComponent = components.find((component: { types: string[] }) =>
          component.types.includes("locality") ||
          component.types.includes("administrative_area_level_2") ||
          component.types.includes("administrative_area_level_1"),
        );
        const city = cityComponent?.long_name || fallbackCity;

        setDetectedCity(city);
        setLocationQuery(city || "Mi ubicación");
      } catch (error) {
        if (!controller.signal.aborted) {
          setDetectedCity(fallbackCity);
          setLocationQuery(fallbackCity || "Mi ubicación");
        }
      }
    };

    reverseGeocode();

    return () => controller.abort();
  }, [googleMapsApiKey, userLocation]);

  const filteredCenters = useMemo(() => {
    const typeFilteredCenters = HEALTH_CENTERS.filter((center) => {
    const typeText = normalizeQuery(center.type);
    const matchesType =
      activeFilter === "hospital"
        ? typeText.includes("hospital")
        : activeFilter === "centro"
          ? typeText.includes("centro") || typeText.includes("clinica") || typeText.includes("puesto")
          : true;

      return matchesType;
    });

    if (locationMode === "nearby" && userLocation) {
      const normalizedCity = normalizeQuery(detectedCity);

      const centersByDistance = typeFilteredCenters
        .filter((center) => center.latitude && center.longitude)
        .map((center) => ({
          ...center,
          distanceKm: getDistanceKm(userLocation, center),
        }))
        .filter((center) => center.distanceKm <= NEARBY_RADIUS_KM)
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

      const centersInDetectedCity = centersByDistance
        .filter((center) => {
          const centerCity = normalizeQuery(center.municipality ?? "");
          return (
            !normalizedCity ||
            centerCity.includes(normalizedCity) ||
            normalizedCity.includes(centerCity)
          );
        });

      return centersInDetectedCity.length > 0 ? centersInDetectedCity : centersByDistance;
    }

    const query = normalizeQuery(locationQuery.trim());
    if (!query) return typeFilteredCenters;

    return typeFilteredCenters.filter((center) => {
      const searchableText = normalizeQuery(
        [center.name, center.department, center.municipality, center.locality, center.silais]
          .filter(Boolean)
          .join(" "),
      );

      return searchableText.includes(query);
    });
  }, [activeFilter, detectedCity, locationMode, locationQuery, userLocation]);
  const visibleCenters = filteredCenters.slice(0, 60);

  useEffect(() => {
    if (!filteredCenters.length) {
      setSelectedCenter(null);
      return;
    }

    if (!selectedCenter || !filteredCenters.some((center) => center.id === selectedCenter.id)) {
      setSelectedCenter(filteredCenters[0]);
    }
  }, [filteredCenters, selectedCenter]);

  const filteredDepartments = useMemo(() => {
    const query = normalizeQuery(locationQuery.trim());
    return HEALTH_CENTER_DEPARTMENTS.filter((department) => normalizeQuery(department).includes(query)).slice(0, 5);
  }, [locationQuery]);

  const selectedLocationLabel = locationMode === "nearby"
    ? detectedCity || "Mi ubicación"
    : locationQuery.trim() || "Nicaragua";
  const selectedCenterSearch = selectedCenter
    ? [
        selectedCenter.name,
        selectedCenter.locality,
        selectedCenter.municipality,
        selectedCenter.department,
        "Nicaragua",
      ]
        .filter(Boolean)
        .join(", ")
    : `${selectedLocationLabel}, Nicaragua`;
  const selectedCenterMapQuery =
    selectedCenter?.latitude && selectedCenter?.longitude
      ? `${selectedCenter.latitude},${selectedCenter.longitude}`
      : userLocation
        ? `${userLocation.latitude},${userLocation.longitude}`
        : selectedCenterSearch;
  const googleMapsEmbedUrl = googleMapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(googleMapsApiKey)}&q=${encodeURIComponent(selectedCenterMapQuery)}&zoom=15`
    : "";
  const googleMapsSearchUrl =
    userLocation && selectedCenter?.latitude && selectedCenter?.longitude
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${selectedCenter.latitude},${selectedCenter.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCenterMapQuery)}`;

  return (
    <div className="flex flex-col min-h-screen pb-24 relative overflow-x-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex justify-between items-center px-6 z-30 relative bg-transparent" style={{ paddingTop: "max(env(safe-area-inset-top, 16px), 36px)", paddingBottom: "12px" }}>
          <div
            onClick={() => onNavigate && onNavigate("home")}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-70 transition-opacity"
          >
            <div className="w-[34px] h-[34px] relative shrink-0">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M26.6667 13.3333C26.6667 20.6971 20.6971 26.6667 13.3333 26.6667C5.96954 26.6667 0 20.6971 0 13.3333C0 5.96954 5.96954 0 13.3333 0C20.6971 0 26.6667 5.96954 26.6667 13.3333Z" fill="#3b82f6" fillOpacity="0.12" />
                <path d="M40 26.6667C40 34.0305 34.0305 40 26.6667 40C19.3029 40 13.3333 34.0305 13.3333 26.6667C13.3333 19.3029 19.3029 13.3333 26.6667 13.3333C34.0305 13.3333 40 19.3029 40 26.6667Z" fill="#3b82f6" fillOpacity="0.12" />
                <path d="M26.6667 26.6667C26.6667 22.9566 25.1481 19.5992 22.6866 17.1378C20.2251 14.6763 16.8677 13.1577 13.1577 13.1577C13.0458 13.1577 12.9344 13.1594 12.8236 13.1627C14.0734 7.57508 19.0432 3.33333 25 3.33333C31.4427 3.33333 36.6667 8.55734 36.6667 15C36.6667 20.9568 32.4249 25.9266 26.8373 27.1764C26.8406 27.0656 26.8423 26.9542 26.8423 26.8423L26.6667 26.6667Z" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.3333 13.3333C13.3333 17.0434 14.8519 20.4008 17.3134 22.8622C19.7749 25.3237 23.1323 26.8423 26.8423 26.8423C26.9542 26.8423 27.0656 26.8406 27.1764 26.8373C25.9266 32.4249 20.9568 36.6667 15 36.6667C8.55734 36.6667 3.33333 31.4427 3.33333 25C3.33333 19.0432 7.57508 14.0734 13.1627 12.8236C13.2735 12.8269 13.3853 12.83 13.4981 12.8344L13.3333 13.3333Z" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-[19px] tracking-[-0.02em] text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
              Salud-Conecta <span className="text-blue-500">IA</span>
            </span>
          </div>

          {/* Emergency button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onTriggerEmergency}
            className="relative flex flex-col items-center justify-center w-[50px] h-[50px] rounded-full overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              boxShadow: "0 6px 20px rgba(239,68,68,0.3)",
            }}
          >
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 mb-[1px]">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v10H2" />
              <circle cx="16.5" cy="17.5" r="2.5" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <path d="M10 10v4" />
              <path d="M8 12h4" />
            </svg>
            <span className="text-white text-[9px] font-bold relative z-10 leading-none">128</span>
          </motion.button>
        </header>
      </div>

      {/* ═══════════════ TITLE & LOCATION SELECTOR ═══════════════ */}
      <div className="px-6 pt-2 pb-3 z-10 relative w-full max-w-6xl mx-auto">
        <h1 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-[-0.03em] leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
          {t('centros')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-1.5 leading-relaxed max-w-[280px]">
          {locationMode === "nearby"
            ? `Mostrando centros cercanos en ${selectedLocationLabel}.`
            : `${HEALTH_CENTER_TOTAL} registros oficiales cargados desde archivos JSON locales.`}
        </p>

        {/* Location search pill */}
        <div className="mt-4 flex flex-col gap-2 max-w-sm">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-slate-500">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
            <input
              value={locationQuery}
              onChange={(event) => {
                setLocationMode("manual");
                setLocationQuery(event.target.value);
              }}
              placeholder="Buscar departamento, municipio o centro"
              className="w-full bg-transparent text-[13px] font-medium text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (userLocation) {
                  setLocationMode("nearby");
                  setLocationQuery(detectedCity || "Mi ubicación");
                  return;
                }
                requestCurrentLocation();
              }}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                locationMode === "nearby"
                  ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.22)]"
                  : "bg-white text-blue-700 border border-blue-100 dark:bg-slate-900 dark:text-blue-300 dark:border-blue-900/40"
              } active:scale-95`}
            >
              {geoStatus === "loading" ? "Detectando ubicación..." : "Usar mi ubicación"}
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              {locationMode === "nearby"
                ? `${NEARBY_RADIUS_KM} km · ${COORDINATED_CENTER_COUNT} con coordenadas`
                : "Búsqueda manual"}
            </span>
          </div>
          {geoStatus === "error" && (
            <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {geoError} Puedes buscar por ciudad manualmente.
            </p>
          )}
          {locationMode === "manual" && filteredDepartments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {filteredDepartments.map((department) => (
                <button
                  key={department}
                  onClick={() => setLocationQuery(department)}
                  className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300"
                >
                  {department}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:gap-8 max-w-6xl mx-auto w-full px-0 md:px-6 relative z-10 mt-2">
        {/* ═══════════════ MAP AREA ═══════════════ */}
        <div className="w-full md:w-1/2">
          <div
            className="relative overflow-hidden mx-3 md:mx-0 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800"
            style={{
              height: "340px",
              background: "linear-gradient(135deg, #e8f0fe 0%, #dce8f5 30%, #d4e3f2 60%, #cddcee 100%)",
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
            }}
          >
            {googleMapsEmbedUrl ? (
              <iframe
                title={`Mapa de ${selectedCenter?.name ?? selectedLocationLabel}`}
                src={googleMapsEmbedUrl}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 px-6 text-center dark:bg-slate-900">
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Google Maps no está configurado</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Agrega VITE_GOOGLE_MAPS_API_KEY en tu archivo .env.</p>
                </div>
              </div>
            )}

            {selectedCenter && (
              <motion.div
                key={selectedCenter.id}
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute left-3 right-3 top-3 z-30 md:left-auto md:max-w-[260px]"
              >
                <div className="rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                  <h4 className="text-[13px] font-bold leading-tight text-slate-900 dark:text-white">{selectedCenter.name}</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{selectedCenter.type}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-[#10b981]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                      {selectedCenter.municipality}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{selectedCenter.department}</span>
                  </div>
                  <a
                    href={googleMapsSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    Abrir en Google Maps
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ═══════════════ LIST SECTION ═══════════════ */}
        <div className="w-full md:w-1/2 px-6 md:px-0 pt-6 md:pt-0 z-10 relative flex-1 flex flex-col">
          {/* Section header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              {locationMode === "nearby" ? "Cerca de mí" : t('nearYou')}
            </h3>
            <span className="text-[13px] font-semibold text-blue-600 dark:text-blue-400">{filteredCenters.length} encontrados</span>
          </div>

          {/* Center list */}
          <div className="space-y-3">
            {visibleCenters.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No hay centros cercanos con coordenadas disponibles.</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Prueba buscar manualmente por departamento o ciudad mientras completamos coordenadas en la base local.
                </p>
                <button
                  onClick={() => setLocationMode("manual")}
                  className="mt-3 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white active:scale-95"
                >
                  Buscar manualmente
                </button>
              </div>
            ) : visibleCenters.slice(0, 12).map((hc) => {
              const isHospital = hc.type.toLowerCase().includes("hospital");
              const isSelected = selectedCenter?.id === hc.id;

              return (
                <motion.button
                  key={hc.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCenter(hc)}
                  className={`w-full text-left flex items-center justify-between rounded-[20px] px-4 py-3.5 transition-all bg-white dark:bg-slate-900 ${
                    isSelected ? "border-1.5 border-blue-600/20" : "border-1.5 border-slate-100 dark:border-slate-800"
                  }`}
                  style={{
                    boxShadow: isSelected ? "0 4px 16px rgba(37,99,235,0.06)" : "0 1px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Icon marker circle */}
                    <div
                      className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center shrink-0"
                      style={{
                        background: isHospital ? "#eff6ff" : "#f0fdf4",
                        border: isHospital ? "1.5px solid #dbeafe" : "1.5px solid #dcfce7",
                      }}
                    >
                      {isHospital ? (
                        <span className="text-[16px] font-bold text-[#2563eb]">H</span>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </div>

                    {/* Text content */}
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white leading-tight truncate">{hc.name}</h4>
                      <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5">{hc.type}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`w-[5px] h-[5px] rounded-full ${hc.hasCoordinates ? "bg-[#10b981]" : "bg-amber-400"} inline-block`} />
                        <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">{hc.locality}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - distance & time */}
                  <div className="shrink-0 text-right ml-3 flex flex-col items-end gap-0.5">
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                      {hc.distanceKm !== undefined ? `${hc.distanceKm.toFixed(1)} km` : hc.municipality}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {hc.municipality} · {hc.department}
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════ BOTTOM ACTION BAR ═══════════════ */}
      <div className="px-5 py-4 mt-4 z-10 relative w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Emergency call button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTriggerEmergency}
            className="flex items-center gap-2.5 bg-white dark:bg-slate-900 rounded-full px-4 py-3 border border-red-200 dark:border-red-900/30 shadow-[0_2px_8px_rgba(239,68,68,0.06)]"
          >
            <div className="w-8 h-8 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-[12px] font-bold text-red-500 block leading-tight">{t('emergencies247')}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('call128')}</span>
            </div>
          </motion.button>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter(activeFilter === "hospital" ? "todos" : "hospital")}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-semibold transition-all ${activeFilter === "hospital"
                ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
            >
              <span className={`text-[10px] font-bold ${activeFilter === "hospital" ? "text-white" : "text-blue-600"}`}>H</span>
              {t('hospitals')}
            </button>
            <button
              onClick={() => setActiveFilter(activeFilter === "centro" ? "todos" : "centro")}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-[11px] font-semibold transition-all ${activeFilter === "centro"
                ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.25)]"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('centers')}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ EMERGENCY CONFIRMATION MODAL ═══════════════ */}
      <AnimatePresence>
        {isEmergencyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 font-sans"
            >
              <div className="p-7 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-red-100 shadow-inner">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">¿Es una emergencia?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  Llama de inmediato al 128 si presentas:
                </p>

                <ul className="mt-4 space-y-2.5 text-left bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                  {[
                    "Dolor o presión en el pecho",
                    "Dificultad severa para respirar",
                    "Confusión o pérdida del conocimiento",
                    "Convulsiones o parálisis súbita"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 gap-3 mt-7">
                  <button
                    onClick={() => setIsEmergencyModalOpen(false)}
                    className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs transition-colors active:scale-95"
                  >
                    Cancelar
                  </button>
                  <a
                    href="tel:128"
                    onClick={() => setTimeout(() => setIsEmergencyModalOpen(false), 500)}
                    className="py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95"
                  >
                    <Phone className="w-4 h-4 fill-current" />
                    Llamar al 128
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
