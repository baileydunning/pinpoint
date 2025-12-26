// Daily puzzle system with seeded random generation
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import { reverseGeocodeDetailed } from './landChecker';
import { Puzzle, PuzzleLocation } from './gameData';

const DAILY_RESULT_KEY = 'pinpoint_daily_results';
const DAILY_PLAYED_KEY = 'pinpoint_daily_played';

export interface DailyResult {
  date: string;
  playerName: string;
  distanceKm: number;
  zoomLevel: number;
  guessLat: number;
  guessLng: number;
  actualLat: number;
  actualLng: number;
  country?: string;
  city?: string;
  // Enhanced location info
  actualDisplayName?: string;
  actualState?: string;
  // Guessed location info
  guessCountry?: string;
  guessCity?: string;
  guessDisplayName?: string;
}

// Simple seeded random number generator (mulberry32)
const seededRandom = (seed: number): (() => number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Convert date string to a consistent seed number
const dateToSeed = (dateStr: string): number => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Get today's date string in YYYY-MM-DD format
export const getTodayDateString = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Cache for land geometry
let landGeometry: FeatureCollection<Geometry> | null = null;

const getLandGeometry = async (): Promise<FeatureCollection<Geometry>> => {
  if (landGeometry) return landGeometry;
  
  const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json');
  const topology = (await response.json()) as Topology<{ land: GeometryCollection }>;
  landGeometry = feature(topology, topology.objects.land) as FeatureCollection<Geometry>;
  return landGeometry;
};

const isPointOnLand = (lat: number, lng: number, land: FeatureCollection<Geometry>): boolean => {
  return land.features.some(f => geoContains(f, [lng, lat]));
};

// Generate a seeded random point on land for a given date
const generateSeededLandPoint = async (dateStr: string): Promise<{ lat: number; lng: number }> => {
  const seed = dateToSeed(dateStr);
  const random = seededRandom(seed);
  const land = await getLandGeometry();
  
  // Try up to 1000 times to find a land point
  for (let i = 0; i < 1000; i++) {
    // Use seeded random with iteration offset for variety
    const iterSeed = seededRandom(seed + i * 12345);
    const lat = iterSeed() * 140 - 70; // Avoid extreme poles
    const lng = iterSeed() * 360 - 180;
    
    if (isPointOnLand(lat, lng, land)) {
      return { lat, lng };
    }
  }
  
  // Fallback - should rarely happen
  return { lat: 51.5074, lng: -0.1278 }; // London
};

// Generate today's puzzle
export const getDailyPuzzle = async (): Promise<Puzzle> => {
  const dateStr = getTodayDateString();
  const { lat, lng } = await generateSeededLandPoint(dateStr);
  const details = await reverseGeocodeDetailed(lat, lng);
  
  return {
    id: `daily-${dateStr}`,
    location: {
      id: `daily-loc-${dateStr}`,
      lat,
      lng,
      country: details.country,
      city: details.city,
      state: details.state,
      landmark: details.landmark,
    },
  };
};

// Check if today's puzzle has been played
export const hasDailyBeenPlayed = (): boolean => {
  try {
    const today = getTodayDateString();
    const played = localStorage.getItem(DAILY_PLAYED_KEY);
    return played === today;
  } catch {
    return false;
  }
};

// Mark today's puzzle as played
export const markDailyAsPlayed = (): void => {
  localStorage.setItem(DAILY_PLAYED_KEY, getTodayDateString());
};

// Get all daily results
export const getDailyResults = (): DailyResult[] => {
  try {
    const stored = localStorage.getItem(DAILY_RESULT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save a daily result
export const saveDailyResult = (result: DailyResult): void => {
  const results = getDailyResults();
  // Remove any existing result for today (shouldn't happen, but just in case)
  const filtered = results.filter(r => r.date !== result.date);
  filtered.push(result);
  // Keep last 30 days
  const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  localStorage.setItem(DAILY_RESULT_KEY, JSON.stringify(sorted));
  markDailyAsPlayed();
};

// Get today's result if it exists
export const getTodaysResult = (): DailyResult | null => {
  const today = getTodayDateString();
  const results = getDailyResults();
  return results.find(r => r.date === today) || null;
};

// Get time until next daily puzzle (midnight local time)
export const getTimeUntilNextPuzzle = (): { hours: number; minutes: number; seconds: number } => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
};

// Calculate streak
export const getDailyStreak = (): { current: number; best: number } => {
  const results = getDailyResults();
  if (results.length === 0) return { current: 0, best: 0 };
  
  // Sort by date descending
  const sorted = [...results].sort((a, b) => b.date.localeCompare(a.date));
  
  // Calculate current streak
  let currentStreak = 0;
  const today = getTodayDateString();
  let checkDate = new Date(today);
  
  // Check if played today or yesterday to start streak
  const playedToday = sorted.some(r => r.date === today);
  if (!playedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  for (const result of sorted) {
    const expectedDate = checkDate.toISOString().split('T')[0];
    if (result.date === expectedDate) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (result.date < expectedDate) {
      break;
    }
  }
  
  // Calculate best streak
  let bestStreak = currentStreak;
  let tempStreak = 1;
  
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].date);
    const currDate = new Date(sorted[i].date);
    prevDate.setDate(prevDate.getDate() - 1);
    
    if (prevDate.toISOString().split('T')[0] === sorted[i].date) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  
  return { current: currentStreak, best: bestStreak };
};
