import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HealthCenter } from "../types";
import { HEALTH_CENTERS, HEALTH_CENTER_DEPARTMENTS } from "../data/healthUnits";
import { useLanguage } from "../contexts/LanguageContext";
import { AlertTriangle, Phone, Siren, Building2, Hospital, Pill, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import MedicalCategoryCarousel, { type MedicalCategory } from "./MedicalCategoryCarousel";
import { getGoogleMapsRouteUrl } from "../lib/routeUtils";

interface CentrosViewProps {
  onNavigate?: (tab: "home" | "consulta" | "buscar" | "premium" | "perfil") => void;
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

function getCenterOperatingStatus(type: string, schedule?: string): { isOpen: boolean; text: string; is24h: boolean } {
  const lowerType = (type || "").toLowerCase();
  const lowerSchedule = (schedule || "").toLowerCase();

  if (lowerType.includes("hospital") || lowerType.includes("materna") || lowerType.includes("emergencia") || lowerSchedule.includes("24") || lowerType.includes("24")) {
    return { isOpen: true, text: "Abierto 24h", is24h: true };
  }

  if (lowerSchedule && (lowerSchedule.includes("cerrado") || lowerSchedule.includes("abre"))) {
    return { isOpen: false, text: schedule || "Cerrado", is24h: false };
  }

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  const isWeekday = day >= 1 && day <= 5;
  const isWorkingHour = hour >= 8 && hour < 16;

  if (isWeekday && isWorkingHour) {
    return { isOpen: true, text: "Abierto hoy hasta 4:00 PM", is24h: false };
  }

  return { isOpen: false, text: "Cerrado (Abre Lun-Vie 8am)", is24h: false };
}

function getNearestHospital(
  from: UserLocation | { latitude: number; longitude: number },
  hospitalsList: HealthCenter[]
): { hospital: HealthCenter; distanceKm: number } | null {
  const hospitals = hospitalsList.filter((c) => {
    const typeLower = c.type.toLowerCase();
    return typeLower.includes("hospital");
  });

  if (hospitals.length === 0) return null;

  let nearest: HealthCenter | null = null;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const h of hospitals) {
    const dist = getDistanceKm(from as UserLocation, h);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = h;
    }
  }

  return nearest ? { hospital: nearest, distanceKm: minDistance } : null;
}

export default function CentrosView({ onNavigate, onTriggerEmergency }: CentrosViewProps) {
  const { t } = useLanguage();
  const [locationQuery, setLocationQuery] = useState("Granada");
  const [selectedCenter, setSelectedCenter] = useState<HealthCenter | null>(
    HEALTH_CENTERS.find((center) => center.department?.toLowerCase().includes("granada")) ?? HEALTH_CENTERS[0],
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [detectedCity, setDetectedCity] = useState("");
  const [locationMode, setLocationMode] = useState<"nearby" | "manual">("nearby");
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [geoError, setGeoError] = useState("");
  const [activeFilter, setActiveFilter] = useState<"todos" | "hospital" | "centro" | "farmacia" | "medico">("todos");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [mergedCenters, setMergedCenters] = useState<HealthCenter[]>(HEALTH_CENTERS);
  const [selectedCarouselCategory, setSelectedCarouselCategory] = useState("centros");
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  const userLocationRef = React.useRef<UserLocation | null>(null);
  const hasInitialLocatedRef = React.useRef(false);
  const lastGeocodedCoordsRef = React.useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);


  const MEDICAL_CATEGORIES: MedicalCategory[] = useMemo(() => [
    {
      id: "centros",
      label: t('centers'),
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      id: "hospitales",
      label: t('hospitals'),
      icon: <Hospital className="w-5 h-5" />,
    },
    {
      id: "farmacias",
      label: t('pharmacies'),
      icon: <Pill className="w-5 h-5" />,
    },
    {
      id: "medicos",
      label: t('doctors'),
      icon: <Stethoscope className="w-5 h-5" />,
    },
  ], [t]);


  const findNearestCenter = useCallback(() => {
    if (!userLocation) return null;

    return mergedCenters
      .filter((center) => center.latitude && center.longitude)
      .map((center) => ({ center, distanceKm: getDistanceKm(userLocation, center) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0]?.center ?? null;
  }, [mergedCenters, userLocation]);


  const handleCategorySelected = useCallback((category: string) => {
    setSelectedCarouselCategory(category);

    if (category === "centros" && userLocation) {

      const nearestCenter = findNearestCenter();
      if (nearestCenter) {
        setActiveFilter("centro");
        setSelectedCenter(nearestCenter);
        return;
      }
    }


    switch (category) {
      case "centros":
        setActiveFilter("centro");
        break;
      case "hospitales":
        setActiveFilter("hospital");
        break;
      case "farmacias":
        setActiveFilter("farmacia");
        break;
      case "medicos":
        setActiveFilter("medico");
        break;
      default:
        setActiveFilter("todos");
    }
  }, [findNearestCenter, userLocation]);


  useEffect(() => {
    const fetchOverrides = async () => {
      try {
        const { data, error } = await supabase.from('health_center_overrides').select('*');
        if (error || !data) return;

        const overrideMap = new Map(data.map(o => [o.center_id, o]));

        const updatedCenters = HEALTH_CENTERS.map(c => {
          const o = overrideMap.get(c.id);
          if (o) {
            return {
              ...c,
              name: o.nombre_nuevo || c.name,
              type: o.tipo || c.type,
              municipality: o.municipio || c.municipality,
              locality: o.localidad || c.locality,
              department: o.departamento || c.department,
              zone: o.zona || c.zone,
              phone: o.telefono || c.phone,
              latitude: o.latitud_ajustada !== null ? o.latitud_ajustada : c.latitude,
              longitude: o.longitud_ajustada !== null ? o.longitud_ajustada : c.longitude,
              hasCoordinates: !!((o.latitud_ajustada !== null ? o.latitud_ajustada : c.latitude) && (o.longitud_ajustada !== null ? o.longitud_ajustada : c.longitude)),
              _activo: o.activo !== false
            };
          }
          return { ...c, _activo: true };
        }).filter(c => c._activo !== false);

        const customCenters = data.filter(o => o.center_id.startsWith('custom-') && o.activo !== false).map(o => ({
          id: o.center_id, name: o.nombre_nuevo, type: o.tipo, department: o.departamento, municipality: o.municipio, locality: o.localidad, zone: o.zona, phone: o.telefono, silais: o.silais || "", latitude: o.latitud_ajustada, longitude: o.longitud_ajustada, sourceNumber: 0, hasCoordinates: !!(o.latitud_ajustada && o.longitud_ajustada)
        }));

        setMergedCenters([...updatedCenters, ...customCenters] as HealthCenter[]);
      } catch (err) {
        console.error("Error syncing centers from database:", err);
      }
    };
    fetchOverrides();
  }, []);

  const normalizeQuery = (value?: string) =>
    (value ?? "")
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
        const userLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        userLocationRef.current = userLoc;
        setUserLocation(userLoc);
        setGeoStatus("ready");
        setGeoError("");
        setLocationMode("nearby");

        const nearestCenter = mergedCenters
          .filter((center) => center.latitude && center.longitude)
          .map((center) => ({ center, distanceKm: getDistanceKm(userLoc, center) }))
          .sort((a, b) => a.distanceKm - b.distanceKm)[0]?.center;

        if (nearestCenter) {
          setActiveFilter("centro");
          setSelectedCenter(nearestCenter);
        }
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
  }, [mergedCenters]);

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
        const userLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        const prevLoc = userLocationRef.current;
        let shouldUpdate = true;
        if (prevLoc) {
          const distanceMeters = getDistanceKm(userLoc, prevLoc as unknown as HealthCenter) * 1000;
          if (distanceMeters < 15) {
            shouldUpdate = false;
          }
        }

        if (shouldUpdate) {
          userLocationRef.current = userLoc;
          setUserLocation(userLoc);
          setGeoStatus("ready");
          setGeoError("");

          // Solo auto-seleccionar el centro más cercano en la primera detección
          if (!hasInitialLocatedRef.current) {
            hasInitialLocatedRef.current = true;
            setLocationMode("nearby");

            const nearestCenter = mergedCenters
              .filter((center) => center.latitude && center.longitude)
              .map((center) => ({ center, distanceKm: getDistanceKm(userLoc, center) }))
              .sort((a, b) => a.distanceKm - b.distanceKm)[0]?.center;

            if (nearestCenter) {
              setActiveFilter("centro");
              setSelectedCenter(nearestCenter);
            }
          }
        }
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
  }, [mergedCenters]);

  useEffect(() => {
    if (!userLocation) return;

    // Throttle: no repetir reverse geocode si el usuario no se movió más de 1 km
    if (lastGeocodedCoordsRef.current) {
      const distKm = getDistanceKm(
        userLocation,
        { latitude: lastGeocodedCoordsRef.current.lat, longitude: lastGeocodedCoordsRef.current.lng } as HealthCenter
      );
      if (distKm < 1.0) {
        return;
      }
    }

    const nearestCenter = mergedCenters
      .filter((center) => center.latitude && center.longitude)
      .map((center) => ({ center, distanceKm: getDistanceKm(userLocation, center) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0]?.center;

    const fallbackCity = nearestCenter?.municipality ?? "";

    const controller = new AbortController();
    const reverseGeocode = async () => {
      try {
        const response = await fetch(
          `/api/geocode?lat=${userLocation.latitude}&lng=${userLocation.longitude}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.municipality || address.county || fallbackCity;
        lastGeocodedCoordsRef.current = { lat: userLocation.latitude, lng: userLocation.longitude };
        setDetectedCity(city);
        setLocationQuery(city || "Mi ubicación");
      } catch (error) {
        if (!controller.signal.aborted) {
          lastGeocodedCoordsRef.current = { lat: userLocation.latitude, lng: userLocation.longitude };
          setDetectedCity(fallbackCity);
          setLocationQuery(fallbackCity || "Mi ubicación");
        }
      }
    };

    reverseGeocode();

    return () => controller.abort();
  }, [userLocation, mergedCenters]);

  // Pre-normalizar atributos estáticos de búsqueda para evitar cálculos repetitivos en cada render
  const normalizedCenters = useMemo(() => {
    return mergedCenters.map((center) => {
      const typeText = normalizeQuery(center.type);
      const centerId = center.id || "";
      const isDoctorEntry =
        centerId.startsWith("doctor-") ||
        typeText.includes("medico de familia") ||
        typeText.includes("nefrologo") ||
        typeText.includes("clinica ambulatoria");
      const isHospital = typeText.includes("hospital") && !isDoctorEntry;
      const isFarmacia = typeText.includes("farmacia") || typeText.includes("botica");
      const isCentro =
        !isHospital && !isFarmacia && !isDoctorEntry && (typeText.includes("centro") || typeText.includes("puesto"));

      const searchableText = normalizeQuery(
        [center.name, center.department, center.municipality, center.locality, center.silais]
          .filter(Boolean)
          .join(" "),
      );

      const centerCity = normalizeQuery(center.municipality ?? "");

      return {
        center,
        isDoctorEntry,
        isHospital,
        isFarmacia,
        isCentro,
        searchableText,
        centerCity,
      };
    });
  }, [mergedCenters]);

  // FIX 1 ─ Separar filtrado estable (sin userLocation) del cálculo de distancias.
  // La lista filtrada para el MAPA no debe re-crearse cuando el GPS cambia;
  // solo re-crea cuando cambia el filtro, la búsqueda o los centros base.
  const filteredCentersBase = useMemo(() => {
    const typeFiltered = normalizedCenters.filter((item) => {
      if (activeFilter === "hospital") return item.isHospital;
      if (activeFilter === "centro") return item.isCentro;
      if (activeFilter === "farmacia") return item.isFarmacia;
      if (activeFilter === "medico") return item.isDoctorEntry;
      return true;
    });

    let finalItems = typeFiltered;

    if (locationMode !== "nearby") {
      const query = normalizeQuery(locationQuery.trim());
      if (query) {
        finalItems = typeFiltered.filter((item) => item.searchableText.includes(query));
      }
    }

    return finalItems.map((item) => {
      const status = getCenterOperatingStatus(item.center.type, item.center.schedule);
      return {
        ...item.center,
        _searchableText: item.searchableText,
        _centerCity: item.centerCity,
        isOpenNow: status.isOpen,
      };
    });
  }, [activeFilter, locationMode, locationQuery, normalizedCenters]);

  // FIX 2 ─ Aplicar filtro de cercanos y distancias SOLO para la lista UI;
  // este memo cambia con GPS pero NO se conecta a centersData del mapa.
  const filteredCenters = useMemo(() => {
    if (locationMode === "nearby" && userLocation) {
      const normalizedCity = normalizeQuery(detectedCity);
      const withDistance = filteredCentersBase.map((c) => ({
        ...c,
        distanceKm: getDistanceKm(userLocation, c),
      }));
      const centersByDistance = withDistance
        .filter((c) => c.latitude && c.longitude && (c.distanceKm ?? Infinity) <= NEARBY_RADIUS_KM)
        .sort((a, b) => {
          if (a.isOpenNow && !b.isOpenNow) return -1;
          if (!a.isOpenNow && b.isOpenNow) return 1;
          return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
        });
      const centersInCity = centersByDistance.filter(
        (c) => !normalizedCity || c._centerCity.includes(normalizedCity) || normalizedCity.includes(c._centerCity)
      );
      return centersInCity.length > 0 ? centersInCity : centersByDistance;
    }
    return filteredCentersBase.map((c) => ({ ...c, distanceKm: undefined }));
  }, [filteredCentersBase, locationMode, userLocation, detectedCity]);

  const visibleCenters = useMemo(() => filteredCenters.slice(0, 60), [filteredCenters]);

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
    return HEALTH_CENTER_DEPARTMENTS.filter((department) => normalizeQuery(department).includes(query));
  }, [locationQuery]);

  const selectedLocationLabel = locationMode === "nearby"
    ? detectedCity || "Mi ubicación"
    : locationQuery.trim() || "Nicaragua";
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const getMapCategory = (type: string, id?: string): "hospital" | "centro_salud" | "farmacia" | "medico" | null => {
    const t = normalizeQuery(type || "");
    const centerId = id || "";
    const isDoctor = centerId.startsWith("doctor-") ||
      t.includes("medico de familia") || t.includes("nefrologo") || t.includes("cardiologia") ||
      t.includes("dermatologia") || t.includes("pediatria") || t.includes("ginecologia") ||
      t.includes("traumatologia") || t.includes("medicina general") || t.includes("clinica ambulatoria");
    if (isDoctor) return "medico";
    if (t.includes("hospital")) return "hospital";
    if (centerId.startsWith("pharmacy-") || t.includes("farmacia") || t.includes("botica")) return "farmacia";
    return "centro_salud";
  };

  // FIX 3 ─ centersData solo depende de filteredCentersBase (estable), no de userLocation.
  // El mapa no necesita las distancias; solo lat/lng/category/id/name.
  const centersData = useMemo(() => {
    return filteredCentersBase
      .filter((c) => c.latitude && c.longitude)
      .map((c) => {
        const category = getMapCategory(c.type, c.id);
        if (!category) return null;
        return { id: c.id, name: c.name, type: c.type, lat: c.latitude!, lng: c.longitude!, category };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [filteredCentersBase]);

  const lastSentCentersRef = React.useRef<typeof centersData>([]);
  const lastSelectedIdRef = React.useRef<string | null>(null);
  // FIX 4 ─ Refs para acceder a valores actuales dentro de listeners estables
  const mergedCentersRef = React.useRef(mergedCenters);
  mergedCentersRef.current = mergedCenters;
  const centersDataRef = React.useRef(centersData);
  centersDataRef.current = centersData;
  const selectedCenterRef = React.useRef(selectedCenter);
  selectedCenterRef.current = selectedCenter;
  const userLocationRef2 = React.useRef(userLocation);
  userLocationRef2.current = userLocation;
  const isDarkModeRef = React.useRef(isDarkMode);
  isDarkModeRef.current = isDarkMode;

  // El GPS se resuelve de forma asíncrona respecto a la carga del iframe. Al
  // llegar, se reenvía al mapa para que pueda hacer su único encuadre inicial.
  useEffect(() => {
    if (!userLocation) return;
    iframeRef.current?.contentWindow?.postMessage({
      type: "UPDATE_USER_LOCATION",
      userLocation,
      initialCenter: true,
    }, "*");
  }, [userLocation]);

  const handleRecenter = () => {
    if (userLocation) {
      iframeRef.current?.contentWindow?.postMessage({
        type: "UPDATE_USER_LOCATION",
        userLocation: userLocation,
        forceCenter: true,
      }, "*");
    } else {
      requestCurrentLocation();
    }
  };

  // FIX 5 ─ Listener de mensajes del mapa con dependencia en ref, no en estado.
  // Esto evita que el listener se destruya y re-cree en cada update de mergedCenters.
  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SELECT_CENTER") {
        const center = mergedCentersRef.current.find((c) => c.id === event.data.centerId);
        if (center) {
          setSelectedCenter((prev) => (prev?.id === center.id ? prev : center));
        }
      }
    };
    window.addEventListener("message", handleMapMessage);
    return () => window.removeEventListener("message", handleMapMessage);
  }, []); // [] ─ se registra una sola vez para toda la vida del componente

  // FIX 6 ─ Enviar al mapa solo lo que cambió.
  // centersData ya no depende de userLocation, así que este efecto solo corre
  // cuando los centros o la selección cambian, NO en cada tick de GPS.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const centersChanged = lastSentCentersRef.current !== centersData;
    const selectionChanged = lastSelectedIdRef.current !== (selectedCenter?.id || null);

    if (centersChanged) {
      lastSentCentersRef.current = centersData;
      lastSelectedIdRef.current = selectedCenter?.id || null;
      iframe.contentWindow.postMessage({
        type: "UPDATE_DATA",
        centers: centersData,
        selectedId: selectedCenter?.id || null,
        userLocation: userLocationRef2.current,
        centerOnId: selectedCenter?.id || null,
        zoomLevel: selectedCenter?.latitude && selectedCenter?.longitude ? 15 : undefined,
        isDark: isDarkMode,
      }, "*");
    } else if (selectionChanged) {
      lastSelectedIdRef.current = selectedCenter?.id || null;
      iframe.contentWindow.postMessage({
        type: "UPDATE_SELECTION",
        selectedId: selectedCenter?.id || null,
        centerOnId: selectedCenter?.id || null,
        zoomLevel: selectedCenter?.latitude && selectedCenter?.longitude ? 15 : undefined,
      }, "*");
    }
  }, [centersData, selectedCenter, isDarkMode]); // userLocation eliminado intencionalmente

  // FIX 7 ─ Listener de carga del iframe estable (usa refs, no deps que cambian).
  // El listener anterior se re-adjuntaba en cada cambio de centersData/selectedCenter.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const sendFullUpdate = () => {
      const cd = centersDataRef.current;
      const sc = selectedCenterRef.current;
      const ul = userLocationRef2.current;
      const dm = isDarkModeRef.current;
      if (iframe.contentWindow) {
        lastSentCentersRef.current = cd;
        lastSelectedIdRef.current = sc?.id || null;
        iframe.contentWindow.postMessage({
          type: "UPDATE_DATA",
          centers: cd,
          selectedId: sc?.id || null,
          userLocation: ul,
          centerOnId: sc?.id || null,
          zoomLevel: sc?.latitude && sc?.longitude ? 15 : undefined,
          isDark: dm,
        }, "*");
      }
    };
    iframe.addEventListener("load", sendFullUpdate);
    return () => iframe.removeEventListener("load", sendFullUpdate);
  }, []); // [] ─ adjunta el listener una sola vez; siempre lee los refs actuales

  const mapBlobUrl = useMemo(() => {
    const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY || '';
    const cartoTileUrl = cartoApiKey
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #f1f5f9; }
    .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
    .leaflet-bar a { background-color: #ffffff !important; color: #1e293b !important; border-bottom: 1px solid #e2e8f0 !important; }
    .leaflet-bar a:hover { background-color: #f8fafc !important; }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    /* FIX 8 ─ Sin transition en marcadores: las CSS transitions obligan al navegador
       a crear capas de compositing separadas para cada marcador y recalcular
       sus geometrías en cada frame durante el pan. En móvil esto congela la UI.
       El estado selected/unselected se aplica directamente va JS sin animación. */
    .sc-marker-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 700;
      border-radius: 50%;
      user-select: none;
      cursor: pointer;
      pointer-events: auto;
      will-change: auto;
    }
    .sc-marker-badge:active { transform: scale(0.92); }
    .sc-cluster-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 700;
      border-radius: 50%;
      user-select: none;
      cursor: pointer;
      pointer-events: auto;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .sc-cluster-badge:active { transform: scale(0.95); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map = null;
    let markersGroup = null;
    let userLocationMarker = null;
    let allCenters = [];
    let currentSelectedId = null;
    let pendingMessage = null;
    let renderedMarkers = new Map();
    let renderDebounceTimer = null;
    let hasInitialUserLocation = false;

    function centerOnInitialUserLocation(loc) {
      if (hasInitialUserLocation || !loc || !loc.latitude || !loc.longitude || !map) return false;
      hasInitialUserLocation = true;
      // Zoom 19 cubre aproximadamente 100–200 m en el ancho de un móvil.
      // No se anima: evita que una selección inicial vuelva a alejar el mapa.
      map.setView([loc.latitude, loc.longitude], 19, { animate: false });
      scheduleRender(0);
      return true;
    }

    function initLeafletMap() {
      if (typeof L === 'undefined' || map) return;
      try {
        map = L.map('map', {
          zoomControl: true,
          attributionControl: false,
          preferCanvas: true,
          wheelDebounceTime: 60,
          // Raster tiles are already the dominant paint cost on modest Android
          // devices. Avoid adding a second animation/compositing pass to each
          // tile and marker while the user is navigating the map.
          fadeAnimation: false,
          markerZoomAnimation: false,
          zoomAnimation: false
        }).setView([12.1364, -86.2514], 19);

        L.tileLayer('${cartoTileUrl}', {
          maxZoom: 19,
          updateWhenIdle: true,
          updateWhenZooming: false,
          // Three retained tile rings can leave roughly 3x more decoded images
          // in memory than a phone viewport needs. One ring keeps panning
          // seamless while substantially reducing decode and GPU composition.
          keepBuffer: 1
        }).addTo(map);

        markersGroup = L.layerGroup().addTo(map);

        map.on('moveend', () => scheduleRender(40));
        map.on('zoomend', () => scheduleRender(40));

        if (pendingMessage) {
          processMessage(pendingMessage);
          pendingMessage = null;
        }
      } catch (err) {
        console.error('Error initializing map:', err);
      }
    }

    // FIX 9 ─ Caché de iconos por categoría+estado.
    // createCenterIcon es llamada frecuentemente (en cada renderVisible).
    // Al cachear los L.divIcon por clave, evitamos string-concat y creación
    // de nuevos objetos DOM en cada frame.
    const iconCache = new Map();
    function createCenterIcon(c, isSelected) {
      const key = c.category + (isSelected ? '_sel' : '_nor');
      if (iconCache.has(key)) return iconCache.get(key);

      const size = isSelected ? 38 : 28;
      const anchor = size / 2;
      const borderSize = isSelected ? '3px' : '2px';
      const borderColor = isSelected ? '#3b82f6' : '#ffffff';
      const shadow = isSelected ? '0 0 14px rgba(59,130,246,0.85)' : '0 2px 6px rgba(0,0,0,0.25)';

      const CAT = { hospital: ['#10b981','H'], farmacia: ['#2563eb','F'], medico: ['#8b5cf6','M'] };
      const [bgColor, label] = CAT[c.category] || ['#ef4444','+'];
      const fontSize = isSelected ? (c.category === 'centro_salud' ? 19 : 16) : (c.category === 'centro_salud' ? 15 : 12);
      const transformStyle = isSelected ? 'transform:scale(1.05);' : '';

      const html = '<div class="sc-marker-badge" style="background-color:' + bgColor
        + ';width:' + size + 'px;height:' + size + 'px;border:' + borderSize + ' solid '
        + borderColor + ';font-size:' + fontSize + 'px;box-shadow:' + shadow + ';' + transformStyle
        + '">' + label + '</div>';

      const icon = L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [anchor, anchor] });
      iconCache.set(key, icon);
      return icon;
    }

    // La caché de íconos de selección se invalida cuando cambia el ID seleccionado
    function invalidateSelectionCache() {
      iconCache.delete('hospital_sel'); iconCache.delete('hospital_nor');
      iconCache.delete('farmacia_sel'); iconCache.delete('farmacia_nor');
      iconCache.delete('medico_sel');   iconCache.delete('medico_nor');
      iconCache.delete('centro_salud_sel'); iconCache.delete('centro_salud_nor');
    }

    function createClusterIcon(count) {
      const key = 'cluster_' + (count >= 50 ? 'xl' : count >= 15 ? 'lg' : 'sm');
      if (iconCache.has(key)) return iconCache.get(key);

      let size = 32, fontSize = 12;
      let bgGradient = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      if (count >= 50) { size = 42; fontSize = 14; bgGradient = 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)'; }
      else if (count >= 15) { size = 36; fontSize = 13; bgGradient = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'; }

      const anchor = size / 2;
      const displayCount = count > 999 ? '999+' : count;
      const html = '<div class="sc-cluster-badge" style="background:' + bgGradient + ';width:' + size + 'px;height:' + size + 'px;font-size:' + fontSize + 'px;">' + displayCount + '</div>';
      const icon = L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [anchor, anchor] });
      iconCache.set(key, icon);
      return icon;
    }

    function scheduleRender(delay = 50) {
      if (renderDebounceTimer) clearTimeout(renderDebounceTimer);
      renderDebounceTimer = setTimeout(() => {
        renderVisible();
      }, delay);
    }

    function renderVisible() {
      if (!map || !markersGroup) return;

      const zoom = map.getZoom();
      const bounds = map.getBounds().pad(0.15);

      const visibleCenters = [];
      for (let i = 0; i < allCenters.length; i++) {
        const c = allCenters[i];
        if (c.lat && c.lng && bounds.contains([c.lat, c.lng])) {
          visibleCenters.push(c);
        }
      }

      const shouldCluster = zoom <= 12 && visibleCenters.length > 25;
      const newItems = new Map();

      if (!shouldCluster) {
        for (let i = 0; i < visibleCenters.length; i++) {
          const c = visibleCenters[i];
          const isSelected = c.id === currentSelectedId;
          newItems.set('c_' + c.id, {
            isCluster: false,
            lat: c.lat,
            lng: c.lng,
            center: c,
            isSelected: isSelected
          });
        }
      } else {
        const gridSize = 55;
        const grid = new Map();

        for (let i = 0; i < visibleCenters.length; i++) {
          const c = visibleCenters[i];
          if (c.id === currentSelectedId) {
            newItems.set('c_' + c.id, {
              isCluster: false,
              lat: c.lat,
              lng: c.lng,
              center: c,
              isSelected: true
            });
            continue;
          }

          const pt = map.project([c.lat, c.lng], zoom);
          const cellKey = Math.floor(pt.x / gridSize) + '_' + Math.floor(pt.y / gridSize);

          let cell = grid.get(cellKey);
          if (!cell) {
            cell = [];
            grid.set(cellKey, cell);
          }
          cell.push(c);
        }

        grid.forEach((items, cellKey) => {
          if (items.length === 1) {
            const c = items[0];
            newItems.set('c_' + c.id, {
              isCluster: false,
              lat: c.lat,
              lng: c.lng,
              center: c,
              isSelected: false
            });
          } else {
            let sumLat = 0;
            let sumLng = 0;
            for (let j = 0; j < items.length; j++) {
              sumLat += items[j].lat;
              sumLng += items[j].lng;
            }
            newItems.set('cl_' + cellKey, {
              isCluster: true,
              lat: sumLat / items.length,
              lng: sumLng / items.length,
              count: items.length
            });
          }
        });
      }

      // 1. Remove markers no longer visible
      renderedMarkers.forEach((entry, key) => {
        if (!newItems.has(key)) {
          markersGroup.removeLayer(entry.marker);
          renderedMarkers.delete(key);
        }
      });

      // 2. Add or update visible markers
      newItems.forEach((config, key) => {
        const existing = renderedMarkers.get(key);
        if (existing) {
          if (!config.isCluster && existing.isSelected !== config.isSelected) {
            existing.isSelected = config.isSelected;
            existing.marker.setIcon(createCenterIcon(config.center, config.isSelected));
            existing.marker.setZIndexOffset(config.isSelected ? 1000 : 0);
          }
        } else {
          let marker;
          if (config.isCluster) {
            const icon = createClusterIcon(config.count);
            marker = L.marker([config.lat, config.lng], { icon: icon, zIndexOffset: 50 });
            marker.on('click', () => {
              const targetZoom = Math.min(map.getZoom() + 2, 16);
              map.setView([config.lat, config.lng], targetZoom, { animate: true });
            });
          } else {
            const icon = createCenterIcon(config.center, config.isSelected);
            marker = L.marker([config.lat, config.lng], {
              icon: icon,
              zIndexOffset: config.isSelected ? 1000 : 0
            });
            marker.on('click', () => {
              window.parent.postMessage({ type: 'SELECT_CENTER', centerId: config.center.id }, '*');
            });
          }
          marker.addTo(markersGroup);
          renderedMarkers.set(key, {
            marker: marker,
            isCluster: config.isCluster,
            isSelected: config.isSelected || false,
            center: config.center,
            lat: config.lat,
            lng: config.lng
          });
        }
      });
    }

    function selectCenter(selectedId, centerOnId, zoomLevel) {
      if (currentSelectedId === selectedId && !centerOnId) return; // sin cambio
      currentSelectedId = selectedId;
      invalidateSelectionCache(); // limpiar caché para forzar re-render de íconos

      renderedMarkers.forEach((entry, key) => {
        if (!entry.isCluster) {
          const centerId = key.substring(2);
          const shouldBeSelected = centerId === selectedId;
          if (entry.isSelected !== shouldBeSelected) {
            entry.isSelected = shouldBeSelected;
            if (entry.center) {
              entry.marker.setIcon(createCenterIcon(entry.center, shouldBeSelected));
              entry.marker.setZIndexOffset(shouldBeSelected ? 1000 : 0);
            }
          }
        }
      });

      // FIX 10 ─ Solo hacer setView si el centro no está ya en la vista actual.
      // Llamar setView({animate:true}) interrumpe el gesto de pan en móvil.
      if (centerOnId) {
        const center = allCenters.find(c => c.id === centerOnId);
        if (center && map) {
          const targetLatLng = L.latLng(center.lat, center.lng);
          const bounds = map.getBounds();
          // Si el punto ya es visible con margen, no mover el mapa
          if (!bounds.pad(-0.1).contains(targetLatLng)) {
            const isMobile = window.innerWidth < 768;
            map.setView(targetLatLng, zoomLevel || 15, { animate: !isMobile, duration: 0.4 });
          }
        }
      }
    }

    function updateUserLocation(loc) {
      if (!map) return;
      if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
        userLocationMarker = null;
      }
      if (loc && loc.latitude && loc.longitude) {
        const userIcon = L.divIcon({
          html: '<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(59,130,246,0.6); position: relative;"><div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #3b82f6; animation: pulse 2s infinite;"></div></div>',
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        userLocationMarker = L.marker([loc.latitude, loc.longitude], { icon: userIcon, zIndexOffset: 900 }).addTo(map);
      }
    }

    function processMessage(msg) {
      if (!map) {
        pendingMessage = msg;
        return;
      }
      if (msg.type === 'UPDATE_DATA') {
        allCenters = msg.centers || [];
        currentSelectedId = msg.selectedId || null;
        updateUserLocation(msg.userLocation);
        const didCenterOnInitialUserLocation = centerOnInitialUserLocation(msg.userLocation);

        if (msg.forceCenterOnUser && msg.userLocation) {
          const isMobile = window.innerWidth < 768;
          map.setView([msg.userLocation.latitude, msg.userLocation.longitude], 15, { animate: !isMobile, duration: 0.4 });
        } else if (!didCenterOnInitialUserLocation && msg.centerOnId) {
          selectCenter(msg.selectedId, msg.centerOnId, msg.zoomLevel);
        } else if (!didCenterOnInitialUserLocation) {
          scheduleRender(50); // FIX 11 ─ debounce mínimo en UPDATE_DATA (era scheduleRender(0))
        }
      } else if (msg.type === 'UPDATE_CENTERS') {
        allCenters = msg.centers || [];
        scheduleRender(50);
      } else if (msg.type === 'UPDATE_SELECTION') {
        selectCenter(msg.selectedId, msg.centerOnId, msg.zoomLevel);
      } else if (msg.type === 'UPDATE_USER_LOCATION') {
        updateUserLocation(msg.userLocation);
        if (msg.initialCenter) {
          centerOnInitialUserLocation(msg.userLocation);
        } else if (msg.forceCenter && msg.userLocation) {
          const isMobile = window.innerWidth < 768;
          map.setView([msg.userLocation.latitude, msg.userLocation.longitude], 15, { animate: !isMobile, duration: 0.4 });
        }
      }
    }

    window.addEventListener('message', (event) => {
      processMessage(event.data);
    });

    window.addEventListener('unload', () => {
      if (renderDebounceTimer) clearTimeout(renderDebounceTimer);
      if (map) {
        map.off();
        map.remove();
        map = null;
      }
      markersGroup = null;
      renderedMarkers.clear();
      allCenters = [];
    });

    if (typeof L !== 'undefined') {
      initLeafletMap();
    } else {
      window.addEventListener('DOMContentLoaded', initLeafletMap);
      window.addEventListener('load', initLeafletMap);
      const checkTimer = setInterval(() => {
        if (typeof L !== 'undefined') {
          clearInterval(checkTimer);
          initLeafletMap();
        }
      }, 50);
    }
  <\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, []);

  useEffect(() => {
    return () => {
      if (mapBlobUrl) {
        URL.revokeObjectURL(mapBlobUrl);
      }
    };
  }, [mapBlobUrl]);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full transition-colors duration-300 overflow-hidden relative">

      { }
      <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 z-20 transition-all duration-300 ${mobileView === "list" ? "h-full flex" : "hidden md:flex md:h-full"}`}>

        { }
        <header className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <div
            onClick={() => onNavigate && onNavigate("home")}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-70 transition-opacity"
          >
            <span className="font-bold text-[17px] tracking-[-0.02em] text-slate-900 dark:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
              Salud-Conecta <span className="text-blue-500">IA</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onTriggerEmergency}
              className="flex items-center justify-center w-[36px] h-[36px] rounded-full text-white bg-rose-400 shadow-[0_4px_12px_rgba(251,113,133,0.15)]"
            >
              <Siren className="w-4 h-4" />
            </motion.button>

            <button
              onClick={() => setMobileView(mobileView === "map" ? "list" : "map")}
              className="md:hidden flex items-center justify-center w-[36px] h-[36px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {mobileView === "map" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  <line x1="9" y1="3" x2="9" y2="18" />
                  <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
              )}
            </button>
          </div>
        </header>

        { }
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-[-0.03em] leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('centros')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              {locationMode === "nearby"
                ? `Cercanos en ${selectedLocationLabel}.`
                : `${mergedCenters.length} registros cargados.`}
            </p>
          </div>

          { }
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full px-3.5 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.03)]">
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
                placeholder={t('locationPlaceholder') || "Buscar ciudad o centro..."}
                className="w-full bg-transparent text-[12.5px] font-medium text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  if (userLocation) {
                    setLocationMode("nearby");
                    setLocationQuery(detectedCity || "Mi ubicación");
                    return;
                  }
                  requestCurrentLocation();
                }}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${locationMode === "nearby"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-700 border border-blue-100 dark:bg-slate-950 dark:text-blue-300 dark:border-blue-900/40"
                  }`}
              >
                {geoStatus === "loading" ? "Ubicando..." : t('nearYou')}
              </button>

              { }
              <button
                onClick={() => setActiveFilter(activeFilter === "hospital" ? "todos" : "hospital")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${activeFilter === "hospital"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                  }`}
              >
                {t('hospitals')}
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === "centro" ? "todos" : "centro")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${activeFilter === "centro"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                  }`}
              >
                {t('centers')}
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === "farmacia" ? "todos" : "farmacia")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${activeFilter === "farmacia"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                  }`}
              >
                {t('pharmacies')}
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === "medico" ? "todos" : "medico")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${activeFilter === "medico"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                  }`}
              >
                {t('doctors')}
              </button>
            </div>

            {locationMode === "manual" && filteredDepartments.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto no-scrollbar pt-1">
                {filteredDepartments.map((department) => (
                  <button
                    key={department}
                    onClick={() => setLocationQuery(department ?? "")}
                    className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[9.5px] font-semibold text-blue-700 dark:text-blue-300"
                  >
                    {department}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        { }
        <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar pb-24 ${mobileView === "list" ? "block" : "hidden md:block"}`}>
          <div className="flex justify-between items-center mb-1.5">
            <h3 className="text-[12.5px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {locationMode === "nearby" ? "Cerca de mí" : t('nearYou')}
            </h3>
            <span className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400">{filteredCenters.length} encontrados</span>
          </div>

          <div className="space-y-2.5">
            {visibleCenters.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-center dark:border-slate-850 dark:bg-slate-900/50">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No hay centros en este radio.</p>
                <button
                  onClick={() => setLocationMode("manual")}
                  className="mt-2.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-[10px] font-bold text-white"
                >
                  Buscar manualmente
                </button>
              </div>
            ) : (
              visibleCenters.map((hc) => {
                const isHospital = hc.type.toLowerCase().includes("hospital");
                const isSelected = selectedCenter?.id === hc.id;
                const operatingStatus = getCenterOperatingStatus(hc.type);

                return (
                  <motion.div
                    key={hc.id}
                    // `layout` measured and animated every result card after a
                    // selection. On mobile that forced synchronous layout work
                    // for the whole list; only the selected detail needs motion.
                    className={`rounded-2xl p-3.5 transition-all bg-white dark:bg-slate-950 border ${isSelected
                      ? "border-blue-600 dark:border-blue-500 shadow-[0_4px_16px_rgba(37,99,235,0.08)]"
                      : "border-slate-100 dark:border-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                      }`}
                  >
                    <div
                      onClick={() => {
                        setSelectedCenter(hc);
                        if (window.innerWidth < 768) {
                          setMobileView("map");
                        }
                      }}
                      className="flex items-center justify-between cursor-pointer gap-3 min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        { }
                        <div
                          className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0 border ${isHospital
                            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-white"
                            : "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-white"
                            }`}
                        >
                          {isHospital ? (
                            <Hospital className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>

                        { }
                        <div className="min-w-0 text-left">
                          <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight truncate">{hc.name}</h4>
                          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{hc.type}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${hc.hasCoordinates ? "bg-[#10b981]" : "bg-amber-400"} inline-block shrink-0`} />
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{hc.locality}</span>
                          </div>
                        </div>
                      </div>

                      { }
                      <div className="shrink-0 text-right ml-2 flex flex-col items-end">
                        <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">
                          {hc.distanceKm !== undefined ? `${hc.distanceKm.toFixed(1)} km` : hc.municipality}
                        </span>
                        <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium">
                          {hc.municipality}
                        </span>
                      </div>
                    </div>

                    { }
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 overflow-hidden"
                        >
                          <div className="space-y-2">
                            { }
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${operatingStatus.isOpen
                                ? (operatingStatus.is24h ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")
                                : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${operatingStatus.isOpen ? (operatingStatus.is24h ? "bg-blue-500" : "bg-emerald-500") : "bg-red-500"}`} />
                                {operatingStatus.text}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {hc.sourceNumber}</span>
                            </div>

                            { }
                            {!operatingStatus.isOpen && (() => {
                              const referenceLoc = (hc.latitude && hc.longitude)
                                ? { latitude: hc.latitude, longitude: hc.longitude }
                                : userLocation;
                              const nearestHospitalInfo = referenceLoc ? getNearestHospital(referenceLoc, mergedCenters) : null;
                              return nearestHospitalInfo ? (
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl text-[10.5px] text-amber-800 dark:text-amber-300 leading-normal">
                                  <span className="font-bold flex items-center gap-1 mb-0.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    Centro Cerrado
                                  </span>
                                  Te sugerimos ir al hospital más cercano: <span className="font-bold">{nearestHospitalInfo.hospital.name}</span> ({nearestHospitalInfo.distanceKm.toFixed(1)} km).
                                </div>
                              ) : null;
                            })()}

                            { }
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/40">
                              <span className="font-bold block text-slate-700 dark:text-slate-300 mb-0.5">Dirección:</span>
                              {hc.locality}
                            </p>

                            { }
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
                              <a
                                href={getGoogleMapsRouteUrl(hc, userLocation)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Trazar ruta en Google Maps"
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-2.5 px-3 shadow-[0_2px_8px_rgba(37,99,235,0.18)] active:scale-95 transition-all text-center"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>Cómo llegar</span>
                              </a>

                              {hc.phone ? (
                                <a
                                  href={`tel:${hc.phone}`}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] py-2.5 px-3 active:scale-95 transition-all"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>Llamar</span>
                                </a>
                              ) : (
                                <button
                                  onClick={onTriggerEmergency}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-[11px] py-2.5 px-3 active:scale-95 transition-all"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Emergencia 128</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      { }
      <div className={`flex-1 relative z-10 shrink-0 ${mobileView === "map" ? "h-full flex flex-col" : "hidden md:flex md:flex-col md:h-full"}`}>
        <iframe
          ref={iframeRef}
          title={`Mapa de Centros Médicos`}
          src={mapBlobUrl}
          className="w-full h-full border-0"
          loading="lazy"
        />

        { }
        <div
          className="absolute top-0 left-0 right-0 z-20"
          style={{
            paddingTop: "14px",
            paddingBottom: "6px",
            background: "linear-gradient(to bottom, rgba(248,250,252,0.92) 0%, rgba(248,250,252,0.7) 60%, rgba(248,250,252,0) 100%)",
            pointerEvents: "none",
          }}
        >
          <div style={{ pointerEvents: "auto" }}>
            <MedicalCategoryCarousel
              categories={MEDICAL_CATEGORIES}
              selectedCategory={selectedCarouselCategory}
              onCategorySelected={handleCategorySelected}
            />
          </div>
        </div>

        { }
        {mobileView === "map" && (
          <button
            onClick={() => setMobileView("list")}
            className="absolute top-[80px] right-4 z-30 md:hidden flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800/80 hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        )}

        { }
        <button
          onClick={handleRecenter}
          className={`absolute ${mobileView === "map" ? "top-[136px]" : "top-[80px]"} right-4 z-30 flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800/80 hover:scale-105 active:scale-95 transition-all`}
          title="Centrar en mi ubicación"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="1" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="23" />
            <line x1="1" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="23" y2="12" />
          </svg>
        </button>

        { }
        {selectedCenter && mobileView === "map" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-24 left-4 right-4 z-30 md:hidden bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800/80"
          >
            <div className="flex items-start justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0 border ${selectedCenter.type.toLowerCase().includes("hospital")
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-white"
                    : "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-white"
                    }`}
                >
                  {selectedCenter.type.toLowerCase().includes("hospital") ? (
                    <Hospital className="w-4 h-4" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0 text-left">
                  <h4 className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight truncate">{selectedCenter.name}</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{selectedCenter.type}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCenter.hasCoordinates ? "bg-[#10b981]" : "bg-amber-400"} inline-block shrink-0`} />
                    <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 truncate">{selectedCenter.locality}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right ml-2 flex flex-col items-end">
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {selectedCenter.distanceKm !== undefined ? `${selectedCenter.distanceKm.toFixed(1)} km` : selectedCenter.municipality}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {selectedCenter.municipality}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded ${getCenterOperatingStatus(selectedCenter.type).isOpen
                    ? (getCenterOperatingStatus(selectedCenter.type).is24h ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")
                    : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getCenterOperatingStatus(selectedCenter.type).isOpen ? (getCenterOperatingStatus(selectedCenter.type).is24h ? "bg-blue-500" : "bg-emerald-500") : "bg-red-500"}`} />
                    {getCenterOperatingStatus(selectedCenter.type).text}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {selectedCenter.sourceNumber}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={selectedCenter ? getGoogleMapsRouteUrl(selectedCenter, userLocation) : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Trazar ruta en Google Maps"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-2 px-3 shadow-[0_2px_8px_rgba(37,99,235,0.18)] active:scale-95 transition-all text-center"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Cómo llegar</span>
                  </a>

                  {selectedCenter.phone ? (
                    <a
                      href={`tel:${selectedCenter.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] py-2 px-3 active:scale-95 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Llamar</span>
                    </a>
                  ) : (
                    <button
                      onClick={onTriggerEmergency}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-[11px] py-2 px-3 active:scale-95 transition-all"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Emergencia</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      { }
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
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-400/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-rose-100 dark:border-rose-900/20 shadow-inner">
                  <Siren className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">¿Es una emergencia?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  Llama de inmediato al 128 si presentas:
                </p>

                <ul className="mt-4 space-y-2.5 text-left bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {[
                    "Dolor o presión en el pecho",
                    "Dificultad severa para respirar",
                    "Confusión o pérdida del conocimiento",
                    "Convulsiones o parálisis súbita"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
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
                    className="py-3.5 px-4 rounded-2xl bg-rose-400 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-100/50 transition-all active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                    {t('call128')}
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
