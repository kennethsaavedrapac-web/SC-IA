import { useState, useEffect, useRef, useCallback } from "react";

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  speed: number | null; // meters per second
  heading: number | null; // degrees clockwise from North
  timestamp: number;
}

export type GeolocationStatus = "idle" | "loading" | "ready" | "weak-signal" | "error";

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilterMeters?: number; // minimum distance in meters to trigger an update
  accuracyThresholdMeters?: number; // accuracy above this triggers "weak-signal" status
}

const CACHE_KEY = "health_conecta_last_known_location";

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    distanceFilterMeters = 3,
    accuracyThresholdMeters = 80,
  } = options;

  const [location, setLocation] = useState<UserLocation | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [error, setError] = useState<string>("");
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<UserLocation | null>(null);
  const consecutiveJumpsRef = useRef<number>(0);

  // Helper to calculate distance in meters between two coordinates (Haversine formula)
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("La geolocalización no es compatible con este dispositivo o navegador.");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setStatus("loading");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = position.timestamp;

        const newLoc: UserLocation = {
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          timestamp,
        };

        const prevLoc = lastLocationRef.current;

        if (prevLoc) {
          const distanceMoved = calculateDistanceMeters(
            prevLoc.latitude,
            prevLoc.longitude,
            latitude,
            longitude
          );

          // 1. Transient Jump Filtering (Speed Check)
          // If the distance implies a physically impossible speed (> 150 km/h = 41.6 m/s)
          // unless it is sustained over multiple readings (to adapt to sudden GPS re-locks after tunnels, etc.)
          const timeDeltaSeconds = (timestamp - prevLoc.timestamp) / 1000;
          if (timeDeltaSeconds > 0) {
            const impliedSpeed = distanceMoved / timeDeltaSeconds;
            if (impliedSpeed > 41.6 && consecutiveJumpsRef.current < 3) {
              consecutiveJumpsRef.current += 1;
              console.warn("Ignored geolocation jump due to physical impossibility:", distanceMoved, "meters in", timeDeltaSeconds, "s");
              return; // Ignore this jump
            }
          }
          consecutiveJumpsRef.current = 0;

          // 2. Jitter and Small Changes Filtering
          // If the user has moved less than the filter threshold AND the new accuracy is not significantly better,
          // ignore the update to avoid map pin jitter.
          if (distanceMoved < distanceFilterMeters && accuracy >= prevLoc.accuracy) {
            return; // Ignore small movements that don't improve accuracy
          }
        }

        // 3. Cache and Update State
        lastLocationRef.current = newLoc;
        setLocation(newLoc);
        setError("");

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(newLoc));
        } catch (e) {
          console.error("Failed to cache location", e);
        }

        // 4. Update Status (Handle weak signal)
        if (accuracy > accuracyThresholdMeters) {
          setStatus("weak-signal");
        } else {
          setStatus("ready");
        }
      },
      (geoError) => {
        let errorMsg = "No se pudo obtener la ubicación en tiempo real.";
        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorMsg = "Permiso denegado. Activa el acceso al GPS para recibir indicaciones de ruta.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          errorMsg = "La señal del GPS no está disponible temporalmente.";
        } else if (geoError.code === geoError.TIMEOUT) {
          errorMsg = "Tiempo de espera agotado al conectar con el satélite GPS.";
        }

        setError(errorMsg);
        setStatus("error");
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, distanceFilterMeters, accuracyThresholdMeters]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    status,
    error,
    startTracking,
    stopTracking,
  };
}
