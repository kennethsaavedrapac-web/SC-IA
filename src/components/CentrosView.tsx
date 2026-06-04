import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HealthCenter } from "../types";
import { HEALTH_CENTERS, HEALTH_CENTER_DEPARTMENTS, HEALTH_CENTER_TOTAL } from "../data/healthUnits";
import { useLanguage } from "../contexts/LanguageContext";
import { AlertTriangle, Phone, Siren, Navigation, X, Loader2 } from "lucide-react";
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

function getCenterOperatingStatus(type: string): { isOpen: boolean; text: string; is24h: boolean } {
  const lowerType = type.toLowerCase();
  // Los hospitales y centros maternos atienden emergencias 24/7
  if (lowerType.includes("hospital") || lowerType.includes("materna") || lowerType.includes("emergencia")) {
    return { isOpen: true, text: "Abierto 24h", is24h: true };
  }

  // Horario típico de Puestos y Centros de Salud MINSA: Lunes a Viernes 8:00 AM - 4:00 PM
  const now = new Date();
  const day = now.getDay(); // 0: Dom, 1: Lun...
  const hour = now.getHours();

  const isWeekday = day >= 1 && day <= 5;
  const isWorkingHour = hour >= 8 && hour < 16;

  if (isWeekday && isWorkingHour) {
    return { isOpen: true, text: "Abierto hoy hasta 4:00 PM", is24h: false };
  }

  return { isOpen: false, text: "Cerrado (Abre Lun-Vie 8am)", is24h: false };
}

function getNearestHospital(
  from: UserLocation | { latitude: number; longitude: number }
): { hospital: HealthCenter; distanceKm: number } | null {
  const hospitals = HEALTH_CENTERS.filter((c) => {
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
  const [activeFilter, setActiveFilter] = useState<"todos" | "hospital" | "centro" | "farmacia">("todos");
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [activeRouteCenter, setActiveRouteCenter] = useState<HealthCenter | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distanceKm: string; timeMinutes: number } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

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
            // Fallback to our serverless geocode proxy to avoid CORS and User-Agent blocks
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

    // 1. Añadir estatus de operación y distancia a todos los centros filtrados por tipo
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

      // 2. Filtrar por radio y ORDENAR PRIORIZANDO LOS ABIERTOS
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
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleRecenter = () => {
    if (userLocation) {
      iframeRef.current?.contentWindow?.postMessage({
        type: "UPDATE_DATA",
        centers: filteredCenters
          .filter((c) => c.latitude && c.longitude)
          .map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            lat: c.latitude,
            lng: c.longitude,
            isHospital: c.type.toLowerCase().includes("hospital"),
          })),
        selectedId: selectedCenter?.id || null,
        userLocation: userLocation,
        forceCenterOnUser: true,
      }, "*");
    } else {
      requestCurrentLocation();
    }
  };

  const handleClearRoute = useCallback(() => {
    setActiveRouteCenter(null);
    setRouteSummary(null);
    setRouteError(null);
    setIsCalculatingRoute(false);
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "CLEAR_ROUTE",
      },
      "*"
    );
  }, []);

  const handleGetDirections = useCallback((center: HealthCenter) => {
    if (!center.latitude || !center.longitude) {
      setRouteError(`El centro "${center.name}" no dispone de coordenadas GPS exactas.`);
      return;
    }

    setRouteError(null);
    setIsCalculatingRoute(true);
    setActiveRouteCenter(center);

    // En móvil, conmutar directamente al mapa para visualizar la ruta
    if (mobileView === "list") {
      setMobileView("map");
    }

    const sendRouteToIframe = (coords: { latitude: number; longitude: number }) => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "DRAW_ROUTE",
          origin: {
            lat: coords.latitude,
            lng: coords.longitude,
          },
          destination: {
            lat: center.latitude,
            lng: center.longitude,
            name: center.name,
          },
        },
        "*"
      );
    };

    if (!("geolocation" in navigator)) {
      if (userLocation) {
        sendRouteToIframe(userLocation);
      } else {
        setIsCalculatingRoute(false);
        setRouteError("Tu navegador no soporta geolocalización para trazar la ruta.");
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(userCoords);
        sendRouteToIframe(userCoords);
      },
      (error) => {
        // Fallback a ubicación previa si existe
        if (userLocation) {
          sendRouteToIframe(userLocation);
          return;
        }

        setIsCalculatingRoute(false);
        let errMsg = "No se pudo obtener tu ubicación actual.";
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = "Permiso de ubicación denegado. Activa el GPS para trazar la ruta.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errMsg = "Señal GPS no disponible. Verifica tus servicios de ubicación.";
        } else if (error.code === error.TIMEOUT) {
          errMsg = "Tiempo de espera agotado al consultar la señal GPS.";
        }
        setRouteError(errMsg);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 10000,
      }
    );
  }, [mobileView, userLocation]);

  // Message listener for Leaflet marker clicks & route events
  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === "SELECT_CENTER") {
        const center = HEALTH_CENTERS.find((c) => c.id === event.data.centerId);
        if (center) {
          setSelectedCenter(center);
        }
      } else if (event.data.type === "REQUEST_ROUTE") {
        const center = HEALTH_CENTERS.find((c) => c.id === event.data.centerId);
        if (center) {
          setSelectedCenter(center);
          handleGetDirections(center);
        }
      } else if (event.data.type === "ROUTE_FOUND") {
        setIsCalculatingRoute(false);
        setRouteError(null);
        setRouteSummary({
          distanceKm: event.data.distance,
          timeMinutes: event.data.time,
        });
      } else if (event.data.type === "ROUTE_ERROR") {
        setIsCalculatingRoute(false);
        setRouteError(event.data.message || "No se pudo calcular la ruta vial.");
      } else if (event.data.type === "ROUTE_CLEARED") {
        setActiveRouteCenter(null);
        setRouteSummary(null);
        setIsCalculatingRoute(false);
      }
    };
    window.addEventListener("message", handleMapMessage);
    return () => window.removeEventListener("message", handleMapMessage);
  }, [handleGetDirections]);

  // Post updates to the Leaflet map iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const centersData = filteredCenters
      .filter((c) => c.latitude && c.longitude)
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        lat: c.latitude,
        lng: c.longitude,
        isHospital: c.type.toLowerCase().includes("hospital"),
      }));

    const message = {
      type: "UPDATE_DATA",
      centers: centersData,
      selectedId: selectedCenter?.id || null,
      userLocation: userLocation,
      centerOnId: selectedCenter?.id || null,
      zoomLevel: selectedCenter?.latitude && selectedCenter?.longitude ? 15 : undefined,
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
  }, [filteredCenters, selectedCenter, userLocation]);

  const leafletHtml = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; background: #f1f5f9; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; border-radius: 12px !important; overflow: hidden; }
          .leaflet-bar a { background-color: #ffffff !important; color: #1e293b !important; border-bottom: 1px solid #e2e8f0 !important; }
          .leaflet-bar a:hover { background-color: #f8fafc !important; }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
          }

          /* Panel de Rutas Moderno */
          .leaflet-routing-container {
            background: rgba(255, 255, 255, 0.96) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            border-radius: 16px !important;
            box-shadow: 0 12px 30px -4px rgba(15, 23, 42, 0.18), 0 4px 10px rgba(15, 23, 42, 0.08) !important;
            border: 1px solid rgba(226, 232, 240, 0.9) !important;
            padding: 12px 14px !important;
            font-family: inherit !important;
            font-size: 11.5px !important;
            color: #1e293b !important;
            max-width: 320px !important;
            max-height: 260px !important;
            overflow-y: auto !important;
            box-sizing: border-box !important;
          }

          @media (max-width: 768px) {
            .leaflet-routing-container {
              max-width: calc(100vw - 32px) !important;
              max-height: 190px !important;
              font-size: 11px !important;
              margin: 8px !important;
            }
          }

          .leaflet-routing-container h2 {
            font-size: 12.5px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
            margin: 0 0 6px 0 !important;
          }

          .leaflet-routing-container h3 {
            font-size: 11px !important;
            font-weight: 600 !important;
            color: #2563eb !important;
            margin: 4px 0 !important;
          }

          .leaflet-routing-alt {
            max-height: 170px !important;
            overflow-y: auto !important;
            padding: 2px 0 !important;
          }

          .leaflet-routing-alt table {
            width: 100% !important;
          }

          .leaflet-routing-alt tr:hover {
            background-color: #f1f5f9 !important;
          }

          .leaflet-routing-container::-webkit-scrollbar,
          .leaflet-routing-alt::-webkit-scrollbar {
            width: 4px;
          }
          .leaflet-routing-container::-webkit-scrollbar-thumb,
          .leaflet-routing-alt::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }

          /* Popups de Centros en Mapa */
          .custom-route-popup .leaflet-popup-content-wrapper {
            border-radius: 16px !important;
            box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.15) !important;
            border: 1px solid #e2e8f0 !important;
            padding: 4px !important;
          }
          .custom-route-popup .leaflet-popup-content {
            margin: 8px 10px !important;
            font-family: inherit !important;
          }
          .custom-route-popup .leaflet-popup-tip {
            background: white !important;
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
          let routingControl = null;

          function clearRoute() {
            if (routingControl) {
              try {
                map.removeControl(routingControl);
              } catch (e) {
                console.warn("Could not remove routing control", e);
              }
              routingControl = null;
            }
          }

          function calculateRoute(origin, destination) {
            clearRoute();

            try {
              routingControl = L.Routing.control({
                waypoints: [
                  L.latLng(origin.lat, origin.lng),
                  L.latLng(destination.lat, destination.lng)
                ],
                router: L.Routing.osrmv1({
                  serviceUrl: 'https://router.project-osrm.org/route/v1',
                  language: 'es',
                  profile: 'car'
                }),
                language: 'es',
                collapsible: true,
                show: true,
                autoRoute: true,
                routeWhileDragging: false,
                addWaypoints: false,
                fitSelectedRoutes: true,
                lineOptions: {
                  styles: [
                    { color: '#1d4ed8', opacity: 0.25, weight: 10 },
                    { color: '#2563eb', opacity: 0.95, weight: 5 }
                  ]
                },
                createMarker: function(i, wp) {
                  if (i === 0) {
                    return L.marker(wp.latLng, {
                      icon: L.divIcon({
                        html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(59,130,246,0.8); position: relative;"><div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #3b82f6; animation: pulse 2s infinite;"></div></div>',
                        className: '',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                      })
                    }).bindPopup('<b>Tu ubicación de salida</b>');
                  } else {
                    return L.marker(wp.latLng, {
                      icon: L.divIcon({
                        html: '<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">📍</div>',
                        className: '',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                      })
                    }).bindPopup('<b>' + (destination.name || 'Destino') + '</b>');
                  }
                }
              }).addTo(map);

              routingControl.on('routesfound', function(e) {
                const routes = e.routes;
                if (routes && routes.length > 0) {
                  const summary = routes[0].summary;
                  window.parent.postMessage({
                    type: 'ROUTE_FOUND',
                    distance: (summary.totalDistance / 1000).toFixed(1),
                    time: Math.round(summary.totalTime / 60)
                  }, '*');
                }
              });

              routingControl.on('routingerror', function(e) {
                console.warn("Routing error", e);
                window.parent.postMessage({
                  type: 'ROUTE_ERROR',
                  message: 'No se pudo trazar una ruta vial directa hacia este centro.'
                }, '*');
              });
            } catch (err) {
              console.error("Error creating routing control:", err);
              window.parent.postMessage({
                type: 'ROUTE_ERROR',
                message: 'Error al inicializar el servicio de navegación.'
              }, '*');
            }
          }

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
              
              const htmlIcon = c.isHospital
                ? \`<div style="background-color: #2563eb; width: \${size}px; height: \${size}px; border-radius: 50%; border: \${borderSize} solid \${borderColor}; display: flex; align-items: center; justify-content: center; color: white; font-family: system-ui, -apple-system, sans-serif; font-weight: bold; font-size: \${isSelected ? 15 : 12}px; box-shadow: \${shadow}; transition: all 0.2s;">H</div>\`
                : \`<div style="background-color: #10b981; width: \${size}px; height: \${size}px; border-radius: 50%; border: \${borderSize} solid \${borderColor}; display: flex; align-items: center; justify-content: center; color: white; font-family: system-ui, -apple-system, sans-serif; font-weight: bold; font-size: \${isSelected ? 19 : 15}px; box-shadow: \${shadow}; transition: all 0.2s;">+</div>\`;

              const icon = L.divIcon({
                html: htmlIcon,
                className: '',
                iconSize: [size, size],
                iconAnchor: [anchor, anchor]
              });

              const marker = L.marker([c.lat, c.lng], { icon: icon }).addTo(markersGroup);
              markersMap.set(c.id, { marker, lat: c.lat, lng: c.lng });

              // Popup enriquecido con acción interna de ruta
              const popupHtml = \`
                <div style="min-width: 170px; max-width: 220px; font-family: system-ui, sans-serif; text-align: left;">
                  <div style="font-weight: 700; font-size: 12.5px; color: #0f172a; line-height: 1.25; margin-bottom: 2px;">\${c.name}</div>
                  <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">\${c.type}</div>
                  <button onclick="window.parent.postMessage({ type: 'REQUEST_ROUTE', centerId: '\${c.id}' }, '*')" style="display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; background: #2563eb; color: white; border: none; border-radius: 10px; padding: 7px 10px; font-size: 11px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(37,99,235,0.25);">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    <span>Cómo llegar</span>
                  </button>
                </div>
              \`;

              marker.bindPopup(popupHtml, {
                className: 'custom-route-popup',
                offset: [0, -size / 2]
              });

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
            if (!msg) return;

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
            } else if (msg.type === 'DRAW_ROUTE') {
              if (msg.origin && msg.destination) {
                calculateRoute(msg.origin, msg.destination);
              }
            } else if (msg.type === 'CLEAR_ROUTE') {
              clearRoute();
            }
          });
        </script>
      </body>
      </html>
    `;
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden relative">

      {/* ═══════════════ SIDEBAR PANEL (Left side on desktop) ═══════════════ */}
      <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 z-20 transition-all duration-300 ${mobileView === "list" ? "h-full flex" : "hidden md:flex md:h-full"}`}>
        
        {/* Header inside Sidebar */}
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

        {/* Title, Search Pill and Filters */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-[-0.03em] leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('centros')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              {locationMode === "nearby"
                ? `Cercanos en ${selectedLocationLabel}.`
                : `${HEALTH_CENTER_TOTAL} registros cargados.`}
            </p>
          </div>

          {/* Location search pill */}
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
                placeholder="Buscar ciudad o centro..."
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
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                  locationMode === "nearby"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-700 border border-blue-100 dark:bg-slate-950 dark:text-blue-300 dark:border-blue-900/40"
                }`}
              >
                {geoStatus === "loading" ? "Ubicando..." : "Mi ubicación"}
              </button>
              
              {/* Type Filter Chips */}
              <button
                onClick={() => setActiveFilter(activeFilter === "hospital" ? "todos" : "hospital")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                  activeFilter === "hospital"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
              >
                Hosp.
              </button>
              <button
                onClick={() => setActiveFilter(activeFilter === "centro" ? "todos" : "centro")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                  activeFilter === "centro"
                    ? "bg-emerald-600 text-white"
                    : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
              >
                Centros
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

        {/* Scrollable Centers List */}
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
                    className={`rounded-2xl p-3.5 transition-all bg-white dark:bg-slate-950 border ${
                      isSelected 
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
                        {/* Icon circle */}
                        <div
                          className="w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: isHospital ? "#eff6ff" : "#f0fdf4",
                            border: isHospital ? "1px solid #dbeafe" : "1px solid #dcfce7",
                          }}
                        >
                          {isHospital ? (
                            <span className="text-xs font-bold text-[#2563eb]">H</span>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px]">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          )}
                        </div>

                        {/* Title & Type */}
                        <div className="min-w-0 text-left">
                          <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight truncate">{hc.name}</h4>
                          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{hc.type}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${hc.hasCoordinates ? "bg-[#10b981]" : "bg-amber-400"} inline-block shrink-0`} />
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{hc.locality}</span>
                          </div>
                        </div>
                      </div>

                      {/* Distance */}
                      <div className="shrink-0 text-right ml-2 flex flex-col items-end">
                        <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">
                          {hc.distanceKm !== undefined ? `${hc.distanceKm.toFixed(1)} km` : hc.municipality}
                        </span>
                        <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium">
                          {hc.municipality}
                        </span>
                      </div>
                    </div>

                    {/* EXPANDED SECTION FOR ACTIONS (Same concept as Burger King Locator) */}
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
                            {/* Schedule Badge */}
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                operatingStatus.isOpen
                                  ? (operatingStatus.is24h ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")
                                  : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${operatingStatus.isOpen ? (operatingStatus.is24h ? "bg-blue-500" : "bg-emerald-500") : "bg-red-500"}`} />
                                {operatingStatus.text}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {hc.sourceNumber}</span>
                            </div>

                            {/* Closed hospital warning recommendation */}
                            {!operatingStatus.isOpen && (() => {
                              const referenceLoc = (hc.latitude && hc.longitude)
                                ? { latitude: hc.latitude, longitude: hc.longitude }
                                : userLocation;
                              const nearestHospitalInfo = referenceLoc ? getNearestHospital(referenceLoc) : null;
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

                            {/* Location description */}
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800/40">
                              <span className="font-bold block text-slate-700 dark:text-slate-300 mb-0.5">Dirección:</span>
                              {hc.locality}
                            </p>

                            {/* CTA Action buttons inside the card */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
                              <button
                                onClick={() => handleGetDirections(hc)}
                                disabled={isCalculatingRoute && activeRouteCenter?.id === hc.id}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] py-2.5 px-3 shadow-[0_2px_8px_rgba(37,99,235,0.18)] active:scale-95 hover:bg-blue-700 transition-all text-center disabled:opacity-75 cursor-pointer"
                              >
                                {isCalculatingRoute && activeRouteCenter?.id === hc.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Calculando...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                    </svg>
                                    <span>{activeRouteCenter?.id === hc.id ? "Ruta activa" : "Cómo llegar"}</span>
                                  </>
                                )}
                              </button>

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

      {/* ═══════════════ MAP PANEL (Right side on desktop) ═══════════════ */}
      <div className={`flex-1 relative z-10 shrink-0 ${mobileView === "map" ? "h-full flex flex-col" : "hidden md:flex md:flex-col md:h-full"}`}>
        <iframe
          ref={iframeRef}
          title={`Mapa de Centros Médicos`}
          srcDoc={leafletHtml}
          className="w-full h-full border-0"
          loading="lazy"
        />

        {/* Floating Active Route Information Banner */}
        <AnimatePresence>
          {activeRouteCenter && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-16 md:left-6 md:right-auto md:max-w-sm z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Ruta activa
                    </span>
                    {routeSummary && (
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold px-1.5 py-0.5 rounded-full">
                        {routeSummary.distanceKm} km • {routeSummary.timeMinutes} min
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate">
                    {activeRouteCenter.name}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearRoute}
                className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Cerrar ruta"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Route Indicator */}
        {isCalculatingRoute && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Calculando ruta vial...</span>
          </div>
        )}

        {/* Route Error Notification */}
        <AnimatePresence>
          {routeError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-16 md:left-auto md:right-16 md:max-w-sm z-30 bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-900 rounded-2xl p-3 shadow-lg flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-rose-800 dark:text-rose-200">
                <p className="font-bold">Aviso de navegación</p>
                <p className="mt-0.5 leading-snug">{routeError}</p>
              </div>
              <button
                onClick={() => setRouteError(null)}
                className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button on Mobile Map View */}
        {mobileView === "map" && (
          <button
            onClick={() => setMobileView("list")}
            className="absolute top-4 right-4 z-30 md:hidden flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800/80 hover:scale-105 active:scale-95 transition-all"
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

        {/* Floating Recenter Button */}
        <button
          onClick={handleRecenter}
          className={`absolute ${mobileView === "map" ? "top-20" : "top-4"} right-4 z-30 flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800/80 hover:scale-105 active:scale-95 transition-all`}
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

        {/* Floating selected center card on mobile when map is active */}
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
                  className="w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: selectedCenter.type.toLowerCase().includes("hospital") ? "#eff6ff" : "#f0fdf4",
                    border: selectedCenter.type.toLowerCase().includes("hospital") ? "1px solid #dbeafe" : "1px solid #dcfce7",
                  }}
                >
                  {selectedCenter.type.toLowerCase().includes("hospital") ? (
                    <span className="text-xs font-bold text-[#2563eb]">H</span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px]">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
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
                  <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                    getCenterOperatingStatus(selectedCenter.type).isOpen
                      ? (getCenterOperatingStatus(selectedCenter.type).is24h ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")
                      : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getCenterOperatingStatus(selectedCenter.type).isOpen ? (getCenterOperatingStatus(selectedCenter.type).is24h ? "bg-blue-500" : "bg-emerald-500") : "bg-red-500"}`} />
                    {getCenterOperatingStatus(selectedCenter.type).text}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {selectedCenter.sourceNumber}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleGetDirections(selectedCenter)}
                    disabled={isCalculatingRoute && activeRouteCenter?.id === selectedCenter.id}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] py-2 px-3 shadow-[0_2px_8px_rgba(37,99,235,0.18)] active:scale-95 hover:bg-blue-700 transition-all text-center disabled:opacity-75 cursor-pointer"
                  >
                    {isCalculatingRoute && activeRouteCenter?.id === selectedCenter.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Calculando...</span>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <polygon points="3 11 22 2 13 21 11 13 3 11" />
                        </svg>
                        <span>{activeRouteCenter?.id === selectedCenter.id ? "Ruta activa" : "Cómo llegar"}</span>
                      </>
                    )}
                  </button>

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
