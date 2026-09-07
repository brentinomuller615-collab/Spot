export const ACTIVITY_RADIUS_METERS = 150;

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in meters
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a = 
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * 
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Generates a grid of geographic coordinates around a center point.
 * Useful for mapping zones or area-based scanning.
 * 
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusMeters The max distance from center
 * @param stepMeters The distance between grid points
 */
export function generateZoneGrid(
  centerLat: number,
  centerLon: number,
  radiusMeters: number,
  stepMeters: number
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  
  // 1 degree of latitude is approximately 111,320 meters
  const latStep = stepMeters / 111320;
  // 1 degree of longitude is approx 111,320 * cos(latitude)
  const lonStep = stepMeters / (111320 * Math.cos(centerLat * (Math.PI / 180)));

  // How many steps in each direction
  const steps = Math.ceil(radiusMeters / stepMeters);

  for (let latOffset = -steps; latOffset <= steps; latOffset++) {
    for (let lonOffset = -steps; lonOffset <= steps; lonOffset++) {
      const lat = centerLat + (latOffset * latStep);
      const lon = centerLon + (lonOffset * lonStep);
      
      const distance = calculateDistanceMeters(centerLat, centerLon, lat, lon);
      
      // Only include points within the overall radius
      if (distance <= radiusMeters) {
        points.push({ latitude: lat, longitude: lon });
      }
    }
  }

  return points;
}
