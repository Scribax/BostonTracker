// ==========================================
// GEOGRAPHIC UTILITIES
// Haversine formula, distance calculations
// ==========================================

import type { GeoPoint, DistanceResult, Location } from '../types/index';

/**
 * Earth's radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Earth's radius in meters
 */
const EARTH_RADIUS_M = 6371000;

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate Haversine distance between two points
 */
export const calculateHaversineDistance = (
  point1: GeoPoint,
  point2: GeoPoint,
  unit: 'km' | 'm' = 'km'
): number => {
  const R = unit === 'km' ? EARTH_RADIUS_KM : EARTH_RADIUS_M;

  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate distance with detailed result
 */
export const calculateDistance = (point1: GeoPoint, point2: GeoPoint): DistanceResult => {
  const distance = calculateHaversineDistance(point1, point2, 'km');

  return {
    distance: Math.round(distance * 1000) / 1000, // Round to 3 decimals
    unit: 'km',
  };
};

/**
 * Calculate total distance from array of locations
 */
export const calculateTotalDistance = (locations: Location[]): number => {
  if (!locations || locations.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];

    const point1: GeoPoint = { lat: prev.latitude, lng: prev.longitude };
    const point2: GeoPoint = { lat: curr.latitude, lng: curr.longitude };

    const segmentDistance = calculateHaversineDistance(point1, point2, 'km');

    // Filter unrealistic jumps (> 1km) and negligible movements (< 1m)
    if (segmentDistance < 1.0 && segmentDistance > 0.001) {
      totalDistance += segmentDistance;
    }
  }

  return totalDistance;
};

/**
 * Filter GPS noise from location array
 * Removes points with unrealistic speed or minimal movement
 */
export const filterGPSNoise = (
  locations: Location[],
  minDistanceMeters = 15,
  maxSpeedKmh = 60
): Location[] => {
  if (!locations || locations.length < 2) return locations;

  const filtered: Location[] = [locations[0]]; // Always include first

  for (let i = 1; i < locations.length; i++) {
    const lastFiltered = filtered[filtered.length - 1];
    const current = locations[i];

    const point1: GeoPoint = { lat: lastFiltered.latitude, lng: lastFiltered.longitude };
    const point2: GeoPoint = { lat: current.latitude, lng: current.longitude };

    const distance = calculateHaversineDistance(point1, point2, 'km');
    const minDistanceKm = minDistanceMeters / 1000;

    // Only include if moved more than minimum distance
    if (distance > minDistanceKm) {
      const lastTime = new Date(lastFiltered.timestamp).getTime();
      const currentTime = new Date(current.timestamp).getTime();
      const timeDiffSeconds = (currentTime - lastTime) / 1000;

      if (timeDiffSeconds > 0) {
        const speedKmh = (distance / timeDiffSeconds) * 3600;

        // Filter unrealistic speeds
        if (speedKmh <= maxSpeedKmh) {
          filtered.push(current);
        }
      } else {
        filtered.push(current);
      }
    }
  }

  return filtered;
};

/**
 * Calculate average speed from locations and duration
 */
export const calculateAverageSpeed = (
  locations: Location[],
  durationMinutes: number,
  maxSpeedKmh = 45
): number => {
  if (!locations || locations.length < 2 || durationMinutes <= 0) return 0;

  const totalDistance = calculateTotalDistance(locations);

  // Only calculate if significant distance (> 50 meters)
  if (totalDistance < 0.05) return 0;

  const durationHours = durationMinutes / 60;
  const speedKmh = totalDistance / durationHours;

  // Cap at max reasonable speed
  return Math.min(Math.round(speedKmh * 100) / 100, maxSpeedKmh);
};

/**
 * Check if coordinates are valid
 */
export const isValidCoordinate = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Format distance for display
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(2)}km`;
};

/**
 * Format duration for display
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
};
