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
  if (distanceKm < 50) return { label: 'Pinpoint Accuracy', tier: 'excellent' };
  if (distanceKm < 200) return { label: 'Very Close', tier: 'excellent' };
  if (distanceKm < 500) return { label: 'Close', tier: 'good' };
  if (distanceKm < 1000) return { label: 'Same Region', tier: 'good' };
  if (distanceKm < 2000) return { label: 'Same Continent', tier: 'fair' };
  if (distanceKm < 5000) return { label: 'Far', tier: 'far' };
  return { label: 'Very Far', tier: 'far' };
};
