import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HealthCenter } from "../types";
import { HEALTH_CENTERS, HEALTH_CENTER_DEPARTMENTS, HEALTH_CENTER_TOTAL } from "../data/healthUnits";
import { useLanguage } from "../contexts/LanguageContext";
import { AlertTriangle, Phone, Siren, Building2, Hospital, Pill, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import MedicalCategoryCarousel, { type MedicalCategory } from "./MedicalCategoryCarousel";

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

function getCenterOperatingStatus(type: string): { isOpen: boolean; text: string; is24h: boolean } {
  const lowerType = type.toLowerCase();

  if (lowerType.includes("hospital") || lowerType.includes("materna") || lowerType.includes("emergencia")) {
    return { isOpen: true, text: "Abierto 24h", is24h: true };
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
  const [activeFilter, setActiveFilter] = useState<"todos" | "hospital" | "centro" | "farmacia" | "medico">("todos");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [mergedCenters, setMergedCenters] = useState<HealthCenter[]>(HEALTH_CENTERS);
  const [selectedCarouselCategory, setSelectedCarouselCategory] = useState("centros");
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

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



        let shouldUpdate = true;
        if (userLocation) {
          const distanceMeters = getDistanceKm(userLoc, userLocation as unknown as HealthCenter) * 1000;


          if (distanceMeters < 10) {
            shouldUpdate = false;
          }
        }

        if (shouldUpdate) {
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
  }, [mergedCenters, activeFilter, selectedCenter]);

  useEffect(() => {
    if (!userLocation) return;

    const nearestCenter = mergedCenters
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
        if (data.status === "OK" && data.results?.[0]) {
          const components = data.results[0].address_components ?? [];
          const cityComponent = components.find((component: { types: string[] }) =>
            component.types.includes("locality") ||
            component.types.includes("administrative_area_level_2") ||
            component.types.includes("administrative_area_level_1"),
          );
          const city = cityComponent?.long_name || fallbackCity;
          setDetectedCity(city);
          setLocationQuery(city || "Mi ubicación");
        } else {
          throw new Error(data.status || "Google Maps API returned non-OK status");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          try {

            const osmResponse = await fetch(
              `/api/geocode?lat=${userLocation.latitude}&lng=${userLocation.longitude}`,
              { signal: controller.signal }
            );
            const osmData = await osmResponse.json();
            const address = osmData.address || {};
            const city = address.city || address.town || address.village || address.municipality || address.county || fallbackCity;
            setDetectedCity(city);
            setLocationQuery(city || "Mi ubicación");
          } catch (osmError) {
            setDetectedCity(fallbackCity);
            setLocationQuery(fallbackCity || "Mi ubicación");
          }
        }
      }
    };

    reverseGeocode();

    return () => controller.abort();
  }, [googleMapsApiKey, userLocation, mergedCenters]);

  const filteredCenters = useMemo(() => {
    const typeFilteredCenters = mergedCenters.filter((center) => {
      const typeText = normalizeQuery(center.type);
      const matchesType =
        activeFilter === "hospital"
          ? typeText.includes("hospital")
          : activeFilter === "centro"
            ? typeText.includes("centro") || typeText.includes("clinica") || typeText.includes("puesto")
            : activeFilter === "farmacia"
              ? typeText.includes("farmacia") || typeText.includes("botica")
              : activeFilter === "medico"
                ? typeText.includes("medico") || typeText.includes("doctor")
                : true;

      return matchesType;
    });


    const centersWithStatus = typeFilteredCenters.map(center => {
      const status = getCenterOperatingStatus(center.type);
      return {
        ...center,
        distanceKm: userLocation ? getDistanceKm(userLocation, center) : undefined,
        isOpenNow: status.isOpen
      };
    });

    let finalCenters = centersWithStatus;

    if (locationMode === "nearby" && userLocation) {
      const normalizedCity = normalizeQuery(detectedCity);


      const centersByDistance = centersWithStatus
        .filter((center) => center.latitude && center.longitude && center.distanceKm! <= NEARBY_RADIUS_KM)
        .sort((a, b) => {
          if (a.isOpenNow && !b.isOpenNow) return -1;
          if (!a.isOpenNow && b.isOpenNow) return 1;
          return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
        });

      const centersInDetectedCity = centersByDistance
        .filter((center) => {
          const centerCity = normalizeQuery(center.municipality ?? "");
          return (
            !normalizedCity ||
            centerCity.includes(normalizedCity) ||
            normalizedCity.includes(centerCity)
          );
        });

      finalCenters = centersInDetectedCity.length > 0 ? centersInDetectedCity : centersByDistance;
    } else {
      const query = normalizeQuery(locationQuery.trim());
      if (query) {
        finalCenters = centersWithStatus.filter((center) => {
          const searchableText = normalizeQuery(
            [center.name, center.department, center.municipality, center.locality, center.silais]
              .filter(Boolean)
              .join(" "),
          );
          return searchableText.includes(query);
        });
      }
    }

    return finalCenters;
  }, [activeFilter, detectedCity, locationMode, locationQuery, userLocation, mergedCenters]);
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
    return HEALTH_CENTER_DEPARTMENTS.filter((department) => normalizeQuery(department).includes(query));
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
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const getMapCategory = (type: string): "hospital" | "centro_salud" | "farmacia" | "medico" | null => {
    const t = type.toLowerCase();
    if (t.includes("hospital")) return "hospital";
    if (t.includes("centro de salud") || t.includes("puesto de salud") || t.includes("salud")) return "centro_salud";
    if (t.includes("farmacia")) return "farmacia";
    if (t.includes("medico") || t.includes("médico") || t.includes("doctor") || t.includes("consultorio") || t.includes("clinica") || t.includes("clínica")) return "medico";
    return null;
  };

  const mapCentersData = (centers: typeof filteredCenters) => {
    return centers
      .filter((c) => c.latitude && c.longitude)
      .map((c) => {
        const category = getMapCategory(c.type);
        if (!category) return null;
        return {
          id: c.id,
          name: c.name,
          type: c.type,
          lat: c.latitude,
          lng: c.longitude,
          category,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  };

  const handleRecenter = () => {
    if (userLocation) {
      iframeRef.current?.contentWindow?.postMessage({
        type: "UPDATE_DATA",
        centers: mapCentersData(filteredCenters),
        selectedId: selectedCenter?.id || null,
        userLocation: userLocation,
        forceCenterOnUser: true,
      }, "*");
    } else {
      requestCurrentLocation();
    }
  };


  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SELECT_CENTER") {
        const center = mergedCenters.find((c) => c.id === event.data.centerId);
        if (center) {
          setSelectedCenter(center);
        }
      }
    };
    window.addEventListener("message", handleMapMessage);
    return () => window.removeEventListener("message", handleMapMessage);
  }, [mergedCenters]);


  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const message = {
      type: "UPDATE_DATA",
      centers: mapCentersData(filteredCenters),
      selectedId: selectedCenter?.id || null,
      userLocation: userLocation,
      centerOnId: selectedCenter?.id || null,
      zoomLevel: selectedCenter?.latitude && selectedCenter?.longitude ? 15 : undefined,
      isDark: isDarkMode,
    };

    const sendUpdate = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, "*");
      }
    };

    sendUpdate();

    iframe.addEventListener("load", sendUpdate);
    return () => {
      iframe.removeEventListener("load", sendUpdate);
    };
  }, [filteredCenters, selectedCenter, userLocation, isDarkMode]);

  const mapHtml = useMemo(() => {
    if (googleMapsApiKey) {
      const darkStyle = [
        { "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1e293b" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
        { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
        { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
        { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
        { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
        { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
        { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
        { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f1f5f9" }] },
        { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
        { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] }
      ];

      const lightStyle = [
        { "elementType": "geometry", "stylers": [{ "color": "#f8fafc" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }, { "weight": 2 }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
        { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
        { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#f1f5f9" }] },
        { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
        { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#f1f5f9" }] },
        { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
        { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f1f5f9" }] },
        { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#e2e8f0" }] },
        { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e2e8f0" }] },
        { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] }
      ];

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const darkStyle = ${JSON.stringify(darkStyle)};
            const lightStyle = ${JSON.stringify(lightStyle)};
            
            let map;
            let markersMap = new Map();
            let userLocationMarker = null;
            let currentSelectedId = null;
            let pendingMessage = null;

            function initMap() {
              map = new google.maps.Map(document.getElementById("map"), {
                center: { lat: 12.1364, lng: -86.2514 },
                zoom: 9,
                disableDefaultUI: true,
                zoomControl: true
              });

              if (pendingMessage) {
                handleUpdate(pendingMessage);
                pendingMessage = null;
              }
            }

            function handleUpdate(msg) {
              if (!map) {
                pendingMessage = msg;
                return;
              }

              // Apply theme style dynamically
              map.setOptions({
                styles: msg.isDark ? darkStyle : lightStyle
              });

              // Update user location marker
              if (userLocationMarker) {
                userLocationMarker.setMap(null);
                userLocationMarker = null;
              }
              if (msg.userLocation && msg.userLocation.latitude && msg.userLocation.longitude) {
                const userIcon = {
                  url: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="6" fill="%233b82f6" stroke="white" stroke-width="2"/><circle cx="15" cy="15" r="12" fill="none" stroke="%233b82f6" stroke-width="1.5" opacity="0.4"/></svg>',
                  size: new google.maps.Size(30, 30),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(15, 15)
                };
                userLocationMarker = new google.maps.Marker({
                  position: { lat: msg.userLocation.latitude, lng: msg.userLocation.longitude },
                  map: map,
                  icon: userIcon,
                  title: "Tu ubicación"
                });
              }

              // Update markers
              const newIds = new Set(msg.centers.map(c => c.id));
              for (let [id, markerObj] of markersMap.entries()) {
                if (!newIds.has(id)) {
                  markerObj.marker.setMap(null);
                  markersMap.delete(id);
                }
              }

              msg.centers.forEach(c => {
                if (!c.lat || !c.lng) return;
                
                const isSelected = c.id === msg.selectedId;
                const size = isSelected ? 38 : 28;
                const anchor = size / 2;
                const strokeColor = isSelected ? '%233b82f6' : 'white';
                const strokeWidth = isSelected ? 3 : 2;
                
                let fillColor = '%23ef4444'; // Red (centro_salud)
                let label = '+';
                let yOffset = 27;
                let fontSize = 22;
                
                if (c.category === 'hospital') {
                  fillColor = '%2310b981'; // Green for hospitals
                  label = 'H';
                  yOffset = 25;
                  fontSize = 16;
                } else if (c.category === 'farmacia') {
                  fillColor = '%232563eb'; // Blue for pharmacies
                  label = 'F';
                  yOffset = 25;
                  fontSize = 16;
                } else if (c.category === 'medico') {
                  fillColor = '%238b5cf6'; // Purple for doctors
                  label = 'M';
                  yOffset = 25;
                  fontSize = 16;
                }
                
                const iconUrl = \`data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="\${size}" height="\${size}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="\${fillColor}" stroke="\${strokeColor}" stroke-width="\${strokeWidth}"/><text x="20" y="\${yOffset}" font-family="sans-serif" font-weight="bold" font-size="\${fontSize}" fill="white" text-anchor="middle">\${label}</text></svg>\`;

                const icon = {
                  url: iconUrl,
                  size: new google.maps.Size(size, size),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(anchor, anchor)
                };

                let markerObj = markersMap.get(c.id);
                if (markerObj) {
                  markerObj.marker.setIcon(icon);
                  markerObj.marker.setPosition({ lat: c.lat, lng: c.lng });
                } else {
                  const marker = new google.maps.Marker({
                    position: { lat: c.lat, lng: c.lng },
                    map: map,
                    icon: icon,
                    title: c.name
                  });

                  marker.addListener('click', () => {
                    window.parent.postMessage({ type: 'SELECT_CENTER', centerId: c.id }, '*');
                  });

                  markersMap.set(c.id, { marker, lat: c.lat, lng: c.lng });
                }
              });

              if (msg.forceCenterOnUser && msg.userLocation) {
                map.setCenter({ lat: msg.userLocation.latitude, lng: msg.userLocation.longitude });
                map.setZoom(15);
              } else if (msg.centerOnId && msg.centerOnId !== currentSelectedId) {
                currentSelectedId = msg.centerOnId;
                const match = markersMap.get(msg.centerOnId);
                if (match) {
                  map.setCenter({ lat: match.lat, lng: match.lng });
                  map.setZoom(msg.zoomLevel || 15);
                }
              } else if (!msg.centerOnId) {
                currentSelectedId = null;
              }
            }

            window.addEventListener('message', (event) => {
              const msg = event.data;
              if (msg.type === 'UPDATE_DATA') {
                handleUpdate(msg);
              }
            });
          </script>
          <script src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&callback=initMap" async defer></script>
        </body>
        </html>
      `;
    }


    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; background: #f1f5f9; }
          .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
          .leaflet-bar a { background-color: #ffffff !important; color: #1e293b !important; border-bottom: 1px solid #e2e8f0 !important; }
          .leaflet-bar a:hover { background-color: #f8fafc !important; }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          }).setView([12.1364, -86.2514], 9);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(map);

          let markersGroup = L.layerGroup().addTo(map);
          let userLocationMarker = null;
          let markersMap = new Map();

          function updateMarkers(centers, selectedId) {
            markersGroup.clearLayers();
            markersMap.clear();

            centers.forEach(c => {
              if (!c.lat || !c.lng) return;
              
              const isSelected = c.id === selectedId;
              const size = isSelected ? 38 : 28;
              const anchor = size / 2;
              const borderSize = isSelected ? '3px' : '2px';
              const borderColor = isSelected ? '#3b82f6' : '#ffffff';
              const shadow = isSelected ? '0 0 12px #3b82f6' : '0 2px 6px rgba(0,0,0,0.2)';
              
              let bgColor = '#ef4444'; // Red (centro_salud)
              let label = '+';
              let fontSize = isSelected ? 19 : 15;
              
              if (c.category === 'hospital') {
                bgColor = '#10b981'; // Green for hospitals
                label = 'H';
                fontSize = isSelected ? 15 : 12;
              } else if (c.category === 'farmacia') {
                bgColor = '#2563eb'; // Blue for pharmacies
                label = 'F';
                fontSize = isSelected ? 15 : 12;
              } else if (c.category === 'medico') {
                bgColor = '#8b5cf6'; // Purple for doctors
                label = 'M';
                fontSize = isSelected ? 15 : 12;
              }
              
              const htmlIcon = \`<div style="background-color: \${bgColor}; width: \${size}px; height: \${size}px; border-radius: 50%; border: \${borderSize} solid \${borderColor}; display: flex; align-items: center; justify-content: center; color: white; font-family: system-ui, -apple-system, sans-serif; font-weight: bold; font-size: \${fontSize}px; box-shadow: \${shadow}; transition: all 0.2s;">\${label}</div>\`;

              const icon = L.divIcon({
                html: htmlIcon,
                className: '',
                iconSize: [size, size],
                iconAnchor: [anchor, anchor]
              });

              const marker = L.marker([c.lat, c.lng], { icon: icon }).addTo(markersGroup);
              markersMap.set(c.id, { marker, lat: c.lat, lng: c.lng });

              marker.on('click', () => {
                window.parent.postMessage({ type: 'SELECT_CENTER', centerId: c.id }, '*');
              });
            });
          }

          function updateUserLocation(loc) {
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
              userLocationMarker = L.marker([loc.latitude, loc.longitude], { icon: userIcon }).addTo(map);
            }
          }

          function centerOnSelected(selectedId, zoomLevel) {
            const data = markersMap.get(selectedId);
            if (data) {
              map.setView([data.lat, data.lng], zoomLevel || 15);
            }
          }

          let currentSelectedId = null;

          window.addEventListener('message', (event) => {
            const msg = event.data;
            if (msg.type === 'UPDATE_DATA') {
              updateMarkers(msg.centers, msg.selectedId);
              updateUserLocation(msg.userLocation);
              
              if (msg.forceCenterOnUser && msg.userLocation) {
                map.setView([msg.userLocation.latitude, msg.userLocation.longitude], 15);
              } else if (msg.centerOnId && msg.centerOnId !== currentSelectedId) {
                currentSelectedId = msg.centerOnId;
                centerOnSelected(msg.centerOnId, msg.zoomLevel);
              } else if (!msg.centerOnId) {
                currentSelectedId = null;
              }
            }
          });
        </script>
      </body>
      </html>
    `;
  }, [googleMapsApiKey]);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden relative">

      { }
      <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 z-20 transition-all duration-300 ${mobileView === "list" ? "h-full flex" : "hidden md:flex md:h-full"}`}>

        { }
        <header className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <div
            onClick={() => onNavigate && onNavigate("home")}
            className="flex items-center gap-2.5 cursor-pointer active:opacity-70 transition-opacity"
          >
            <img
              src="/app-logo-v1.jpg"
              alt="Logo"
              className="w-7 h-7 rounded-lg shadow-sm object-cover border border-blue-100 dark:border-blue-900/30"
            />
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
                    layout
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
                                href={googleMapsSearchUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] py-2.5 px-3 shadow-[0_2px_8px_rgba(37,99,235,0.18)] active:scale-95 transition-all text-center"
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
          srcDoc={mapHtml}
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
                    href={googleMapsSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] py-2 px-3 shadow-[0_2px_8px_rgba(37,99,235,0.18)] active:scale-95 transition-all text-center"
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
