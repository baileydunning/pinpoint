// Local storage stats management

export interface GameResult {
  puzzleId: string;
  date: string;
  distanceKm: number;
  zoomLevel: number;
  maxZoom: number;
  guessLat: number;
  guessLng: number;
  actualLat: number;
  actualLng: number;
  country?: string;
  city?: string;
  state?: string;
  landmark?: string;
}

export interface CountryStats {
  count: number;
  bestDistance: number;
  totalDistance: number;
  bestZoomLevel?: number;
}

export interface PlayerStats {
  totalRounds: number;
  medianDistance: number;
  averageZoomLevel: number;
  bestDistance: number;
  worstDistance: number;
  recentResults: GameResult[];
  countriesVisited: Record<string, CountryStats>;
  continentCounts: Record<string, number>;
}

const STATS_KEY = 'pinpoint_stats';
const RESULTS_KEY = 'pinpoint_results';

export const clearAllStats = (): void => {
  localStorage.removeItem(STATS_KEY);
  localStorage.removeItem(RESULTS_KEY);
};

const defaultStats: PlayerStats = {
  totalRounds: 0,
  medianDistance: 0,
  averageZoomLevel: 0,
  bestDistance: Infinity,
  worstDistance: 0,
  recentResults: [],
  countriesVisited: {},
  continentCounts: {},
};

// Map countries to continents
const countryToContinent: Record<string, string> = {
  'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
  'Guatemala': 'North America', 'Cuba': 'North America', 'Haiti': 'North America',
  'Dominican Republic': 'North America', 'Honduras': 'North America', 'Nicaragua': 'North America',
  'El Salvador': 'North America', 'Costa Rica': 'North America', 'Panama': 'North America',
  'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America',
  'Peru': 'South America', 'Venezuela': 'South America', 'Chile': 'South America',
  'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
  'Uruguay': 'South America',
  'United Kingdom': 'Europe', 'France': 'Europe', 'Germany': 'Europe', 'Italy': 'Europe',
  'Spain': 'Europe', 'Poland': 'Europe', 'Romania': 'Europe', 'Netherlands': 'Europe',
  'Belgium': 'Europe', 'Czech Republic': 'Europe', 'Greece': 'Europe', 'Portugal': 'Europe',
  'Sweden': 'Europe', 'Hungary': 'Europe', 'Austria': 'Europe', 'Switzerland': 'Europe',
  'Bulgaria': 'Europe', 'Denmark': 'Europe', 'Finland': 'Europe', 'Slovakia': 'Europe',
  'Norway': 'Europe', 'Ireland': 'Europe', 'Croatia': 'Europe', 'Slovenia': 'Europe',
  'Serbia': 'Europe', 'Ukraine': 'Europe', 'Russia': 'Europe',
  'China': 'Asia', 'India': 'Asia', 'Indonesia': 'Asia', 'Pakistan': 'Asia',
  'Bangladesh': 'Asia', 'Japan': 'Asia', 'Philippines': 'Asia', 'Vietnam': 'Asia',
  'Turkey': 'Asia', 'Iran': 'Asia', 'Thailand': 'Asia', 'Myanmar': 'Asia',
  'South Korea': 'Asia', 'Iraq': 'Asia', 'Afghanistan': 'Asia', 'Saudi Arabia': 'Asia',
  'Uzbekistan': 'Asia', 'Malaysia': 'Asia', 'Nepal': 'Asia', 'North Korea': 'Asia',
  'Taiwan': 'Asia', 'Syria': 'Asia', 'Cambodia': 'Asia', 'Jordan': 'Asia',
  'United Arab Emirates': 'Asia', 'Tajikistan': 'Asia', 'Israel': 'Asia', 'Laos': 'Asia',
  'Lebanon': 'Asia', 'Singapore': 'Asia', 'Kuwait': 'Asia', 'Mongolia': 'Asia',
  'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa', 'DR Congo': 'Africa',
  'Tanzania': 'Africa', 'South Africa': 'Africa', 'Kenya': 'Africa', 'Uganda': 'Africa',
  'Algeria': 'Africa', 'Sudan': 'Africa', 'Morocco': 'Africa', 'Angola': 'Africa',
  'Mozambique': 'Africa', 'Ghana': 'Africa', 'Madagascar': 'Africa', 'Cameroon': 'Africa',
  'Ivory Coast': 'Africa', 'Niger': 'Africa', 'Burkina Faso': 'Africa', 'Mali': 'Africa',
  'Senegal': 'Africa', 'Zimbabwe': 'Africa', 'Tunisia': 'Africa', 'Somalia': 'Africa',
  'Sierra Leone': 'Africa', 'Libya': 'Africa', 'Liberia': 'Africa', 'Namibia': 'Africa',
  'Zambia': 'Africa', 'Western Sahara': 'Africa',
  'Australia': 'Oceania', 'Papua New Guinea': 'Oceania', 'New Zealand': 'Oceania',
};

export const getStats = (): PlayerStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return { ...defaultStats, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
  return { ...defaultStats };
};

export const getResults = (): GameResult[] => {
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load results:', e);
  }
  return [];
};

const calculateMedian = (arr: number[]): number => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const saveResult = (result: GameResult): PlayerStats => {
  const results = getResults();
  results.push(result);
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results.slice(-100))); // Keep last 100

  const stats = getStats();
  
  // Update basic counts
  stats.totalRounds++;

  // Update distance stats
  const allDistances = results.map(r => r.distanceKm);
  stats.medianDistance = calculateMedian(allDistances);
  stats.bestDistance = Math.min(stats.bestDistance, result.distanceKm);
  stats.worstDistance = Math.max(stats.worstDistance, result.distanceKm);

  // Update zoom stats
  const allZooms = results.map(r => r.zoomLevel);
  stats.averageZoomLevel = allZooms.reduce((a, b) => a + b, 0) / allZooms.length;

  // Update recent results
  stats.recentResults = results.slice(-10);

  // Update country stats
  if (result.country) {
    if (!stats.countriesVisited[result.country]) {
      stats.countriesVisited[result.country] = { count: 0, bestDistance: Infinity, totalDistance: 0, bestZoomLevel: undefined };
    }
    const countryStats = stats.countriesVisited[result.country];
    countryStats.count++;
    if (result.distanceKm < countryStats.bestDistance) {
      countryStats.bestDistance = result.distanceKm;
      countryStats.bestZoomLevel = result.zoomLevel;
    }
    countryStats.totalDistance += result.distanceKm;

    // Update continent counts
    const continent = countryToContinent[result.country] || 'Unknown';
    stats.continentCounts[continent] = (stats.continentCounts[continent] || 0) + 1;
  }

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
};

// Helper to get top countries by best guess distance (ascending - closest first)
export const getTopCountriesByAccuracy = (stats: PlayerStats, limit = 5): Array<{ country: string; stats: CountryStats }> => {
  return Object.entries(stats.countriesVisited)
    .map(([country, countryStats]) => ({ country, stats: countryStats }))
    .filter(c => isFinite(c.stats.bestDistance) && c.stats.bestDistance < Infinity)
    .sort((a, b) => a.stats.bestDistance - b.stats.bestDistance)
    .slice(0, limit);
};

// Helper to get top countries by count
export const getTopCountries = (stats: PlayerStats, limit = 5): Array<{ country: string; stats: CountryStats }> => {
  return Object.entries(stats.countriesVisited)
    .map(([country, countryStats]) => ({ country, stats: countryStats }))
    .sort((a, b) => b.stats.count - a.stats.count)
    .slice(0, limit);
};

// Helper to get continent distribution
export const getContinentDistribution = (stats: PlayerStats): Array<{ continent: string; count: number; percentage: number }> => {
  const total = Object.values(stats.continentCounts).reduce((a, b) => a + b, 0);
  return Object.entries(stats.continentCounts)
    .map(([continent, count]) => ({
      continent,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

// Get unique cities from results
export const getUniqueCities = (results: GameResult[]): string[] => {
  const cities = results
    .map(r => r.city)
    .filter((city): city is string => !!city);
  return [...new Set(cities)];
};

// Get unique landmarks from results
export const getUniqueLandmarks = (results: GameResult[]): string[] => {
  const landmarks = results
    .map(r => r.landmark)
    .filter((landmark): landmark is string => !!landmark);
  return [...new Set(landmarks)];
};
