// Saved maps collection management

export interface SavedMap {
  id: string;
  savedAt: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  state?: string;
  landmark?: string;
  displayName: string;
  distanceKm?: number;
}

const SAVED_MAPS_KEY = 'pinpoint_saved_maps';

export const getSavedMaps = (): SavedMap[] => {
  try {
    const stored = localStorage.getItem(SAVED_MAPS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load saved maps:', e);
  }
  return [];
};

export const saveMap = (map: Omit<SavedMap, 'id' | 'savedAt'>): SavedMap => {
  const savedMaps = getSavedMaps();
  
  const newMap: SavedMap = {
    ...map,
    id: `map-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  
  savedMaps.push(newMap);
  localStorage.setItem(SAVED_MAPS_KEY, JSON.stringify(savedMaps));
  
  return newMap;
};

export const deleteMap = (id: string): void => {
  const savedMaps = getSavedMaps().filter(map => map.id !== id);
  localStorage.setItem(SAVED_MAPS_KEY, JSON.stringify(savedMaps));
};

export const clearAllMaps = (): void => {
  localStorage.removeItem(SAVED_MAPS_KEY);
};

export const isMapSaved = (lat: number, lng: number): boolean => {
  const savedMaps = getSavedMaps();
  // Check if a map with similar coordinates exists (within ~1km)
  return savedMaps.some(map => 
    Math.abs(map.lat - lat) < 0.01 && Math.abs(map.lng - lng) < 0.01
  );
};