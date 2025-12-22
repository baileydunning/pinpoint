// Pinpoint game data utilities
import { generateRandomLandPoint, reverseGeocodeDetailed, DetailedLocation } from './landChecker';

export interface PuzzleLocation {
  id: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  state?: string;
  landmark?: string;
}

export interface Puzzle {
  id: string;
  location: PuzzleLocation;
}

export const generatePuzzle = async (): Promise<Puzzle> => {
  const { lat, lng } = await generateRandomLandPoint();
  const details = await reverseGeocodeDetailed(lat, lng);
  
  return {
    id: `puzzle-${Date.now()}`,
    location: {
      id: `loc-${Date.now()}`,
      lat,
      lng,
      country: details.country,
      city: details.city,
      state: details.state,
      landmark: details.landmark,
    },
  };
};

// Calculate distance between two coordinates in kilometers using Haversine formula
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get distance band description
export const getDistanceBand = (distanceKm: number): { label: string; tier: 'excellent' | 'good' | 'fair' | 'far' } => {
  if (distanceKm < 25) return { label: 'Pinpoint Accuracy', tier: 'excellent' };
  if (distanceKm < 75) return { label: 'Incredible!', tier: 'excellent' };
  if (distanceKm < 200) return { label: 'Very Close', tier: 'excellent' };
  if (distanceKm < 400) return { label: 'Close', tier: 'good' };
  if (distanceKm < 700) return { label: 'Nearby', tier: 'good' };
  if (distanceKm < 1200) return { label: 'Regional', tier: 'good' };
  if (distanceKm < 2000) return { label: 'Distant', tier: 'fair' };
  if (distanceKm < 3000) return { label: 'Farther Away', tier: 'fair' };
  if (distanceKm < 4500) return { label: 'Very Distant', tier: 'fair' };
  if (distanceKm < 6000) return { label: 'Long Haul', tier: 'far' };
  if (distanceKm < 8000) return { label: 'Far Away', tier: 'far' };
  if (distanceKm < 10000) return { label: 'Very Far', tier: 'far' };
  if (distanceKm < 14000) return { label: 'Other Side of the World', tier: 'far' };
  return { label: 'Furthest Possible', tier: 'far' };
};
