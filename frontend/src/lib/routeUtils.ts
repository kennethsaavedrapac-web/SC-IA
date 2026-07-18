export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Earth radius in meters
const EARTH_RADIUS_METERS = 6371000;

// Converts degrees to radians
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Calculates the exact distance in meters between two coordinates using the Haversine formula.
 */
export function getDistanceMeters(coord1: Coordinate, coord2: Coordinate): number {
  const phi1 = toRadians(coord1.latitude);
  const phi2 = toRadians(coord2.latitude);
  const deltaPhi = toRadians(coord2.latitude - coord1.latitude);
  const deltaLambda = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates the distance in kilometers.
 */
export function getDistanceKm(coord1: Coordinate, coord2: Coordinate): number {
  return getDistanceMeters(coord1, coord2) / 1000;
}

/**
 * Helper to calculate the cross-track distance (perpendicular distance) from a point P 
 * to a line segment defined by vertices A and B.
 * Returns the distance in meters.
 */
export function getDistanceToSegment(p: Coordinate, a: Coordinate, b: Coordinate): number {
  const distAB = getDistanceMeters(a, b);
  if (distAB === 0) return getDistanceMeters(p, a);

  // Consider the segment AB as a vector and project point P onto it.
  // We use simple flat-earth approximation for local segment projection (which is highly accurate for short segments).
  const latFactor = Math.cos(toRadians((a.latitude + b.latitude) / 2));
  
  const dx = (b.longitude - a.longitude) * latFactor;
  const dy = b.latitude - a.latitude;
  
  const px = (p.longitude - a.longitude) * latFactor;
  const py = p.latitude - a.latitude;

  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));

  const projection: Coordinate = {
    latitude: a.latitude + t * dy,
    longitude: a.longitude + (t * dx) / latFactor,
  };

  return getDistanceMeters(p, projection);
}

/**
 * Calculates the minimum distance in meters between the user's position and the entire route path (polyline).
 */
export function getDistanceToRoute(userLoc: Coordinate, routePath: Coordinate[]): number {
  if (routePath.length === 0) return Number.POSITIVE_INFINITY;
  if (routePath.length === 1) return getDistanceMeters(userLoc, routePath[0]);

  let minDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < routePath.length - 1; i++) {
    const distance = getDistanceToSegment(userLoc, routePath[i], routePath[i + 1]);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

/**
 * Checks if the user has drifted or deviated from the planned route by more than the threshold in meters.
 */
export function isRouteDeviated(userLoc: Coordinate, routePath: Coordinate[], thresholdMeters: number = 30): boolean {
  if (routePath.length < 2) return false;
  const currentDeviation = getDistanceToRoute(userLoc, routePath);
  return currentDeviation > thresholdMeters;
}
