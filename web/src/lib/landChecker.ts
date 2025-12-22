// Utility to check if coordinates are on land and get country info
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry, Feature } from 'geojson';

interface CountryFeature extends Feature<Geometry> {
  properties: {
    name: string;
  };
}

let landFeatures: FeatureCollection<Geometry> | null = null;
let loadingPromise: Promise<FeatureCollection<Geometry>> | null = null;

const GEOGRAPHY_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Country name mapping for the Natural Earth dataset
const countryNames: Record<string, string> = {
  '4': 'Afghanistan', '8': 'Albania', '12': 'Algeria', '24': 'Angola', '32': 'Argentina',
  '36': 'Australia', '40': 'Austria', '50': 'Bangladesh', '56': 'Belgium', '68': 'Bolivia',
  '76': 'Brazil', '100': 'Bulgaria', '104': 'Myanmar', '116': 'Cambodia', '120': 'Cameroon',
  '124': 'Canada', '152': 'Chile', '156': 'China', '170': 'Colombia', '180': 'DR Congo',
  '188': 'Costa Rica', '191': 'Croatia', '192': 'Cuba', '203': 'Czech Republic', '208': 'Denmark',
  '214': 'Dominican Republic', '218': 'Ecuador', '818': 'Egypt', '222': 'El Salvador',
  '231': 'Ethiopia', '246': 'Finland', '250': 'France', '276': 'Germany', '288': 'Ghana',
  '300': 'Greece', '320': 'Guatemala', '332': 'Haiti', '340': 'Honduras', '348': 'Hungary',
  '356': 'India', '360': 'Indonesia', '364': 'Iran', '368': 'Iraq', '372': 'Ireland',
  '376': 'Israel', '380': 'Italy', '384': 'Ivory Coast', '392': 'Japan', '400': 'Jordan',
  '404': 'Kenya', '408': 'North Korea', '410': 'South Korea', '414': 'Kuwait', '418': 'Laos',
  '422': 'Lebanon', '430': 'Liberia', '434': 'Libya', '458': 'Malaysia', '466': 'Mali',
  '484': 'Mexico', '496': 'Mongolia', '504': 'Morocco', '508': 'Mozambique', '516': 'Namibia',
  '524': 'Nepal', '528': 'Netherlands', '554': 'New Zealand', '558': 'Nicaragua', '562': 'Niger',
  '566': 'Nigeria', '578': 'Norway', '586': 'Pakistan', '591': 'Panama', '598': 'Papua New Guinea',
  '600': 'Paraguay', '604': 'Peru', '608': 'Philippines', '616': 'Poland', '620': 'Portugal',
  '642': 'Romania', '643': 'Russia', '682': 'Saudi Arabia', '686': 'Senegal', '688': 'Serbia',
  '694': 'Sierra Leone', '702': 'Singapore', '703': 'Slovakia', '704': 'Vietnam', '705': 'Slovenia',
  '706': 'Somalia', '710': 'South Africa', '716': 'Zimbabwe', '724': 'Spain', '729': 'Sudan',
  '732': 'Western Sahara', '752': 'Sweden', '756': 'Switzerland', '760': 'Syria', '762': 'Tajikistan',
  '764': 'Thailand', '788': 'Tunisia', '792': 'Turkey', '800': 'Uganda', '804': 'Ukraine',
  '784': 'United Arab Emirates', '826': 'United Kingdom', '834': 'Tanzania', '840': 'United States',
  '854': 'Burkina Faso', '858': 'Uruguay', '860': 'Uzbekistan', '862': 'Venezuela', '887': 'Yemen',
  '894': 'Zambia',
};

export async function loadLandData(): Promise<FeatureCollection<Geometry>> {
  if (landFeatures) return landFeatures;
  
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = fetch(GEOGRAPHY_URL)
    .then(res => res.json())
    .then((topology: Topology<{ countries: GeometryCollection }>) => {
      landFeatures = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
      return landFeatures;
    });
  
  return loadingPromise;
}

export function isOnLand(lat: number, lng: number, features: FeatureCollection<Geometry>): boolean {
  const point: [number, number] = [lng, lat];
  
  for (const feature of features.features) {
    if (geoContains(feature, point)) {
      return true;
    }
  }
  return false;
}

export function getCountryAtPoint(lat: number, lng: number, features: FeatureCollection<Geometry>): string | null {
  const point: [number, number] = [lng, lat];
  
  for (const feat of features.features) {
    if (geoContains(feat, point)) {
      const id = (feat as any).id?.toString();
      if (id && countryNames[id]) {
        return countryNames[id];
      }
      // Fallback to properties.name if available
      const name = (feat.properties as any)?.name;
      if (name) return name;
    }
  }
  return null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const features = await loadLandData();
    const country = getCountryAtPoint(lat, lng, features);
    return country || 'Unknown Location';
  } catch {
    return 'Unknown Location';
  }
}

export interface DetailedLocation {
  city?: string;
  state?: string;
  country: string;
  displayName: string;
  landmark?: string;
  neighbourhood?: string;
}

// Rate limiting for Nominatim (1 request per second)
let lastNominatimRequest = 0;

async function throttledFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastNominatimRequest;
  
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }
  
  lastNominatimRequest = Date.now();
  return fetch(url, {
    headers: { 'User-Agent': 'PinpointGame/1.0' }
  });
}

export async function reverseGeocodeDetailed(lat: number, lng: number): Promise<DetailedLocation> {
  try {
    const response = await throttledFetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );
    
    if (!response.ok) throw new Error('Nominatim request failed');
    
    const data = await response.json();
    const address = data.address || {};
    
    const city = address.city || address.town || address.village || address.hamlet || address.municipality;
    const state = address.state || address.region || address.province || address.county;
    const country = address.country || 'Unknown';
    
    // Get landmark/POI info
    const landmark = address.tourism || address.historic || address.amenity || 
                     address.leisure || address.natural || address.man_made ||
                     address.building || address.aeroway || address.military;
    const neighbourhood = address.neighbourhood || address.suburb || address.district;
    
    // Build display name: prefer landmark or city + state/country format
    let displayName = country;
    if (landmark) {
      displayName = landmark;
    } else if (city && state) {
      displayName = `${city}, ${state}`;
    } else if (city) {
      displayName = `${city}, ${country}`;
    } else if (neighbourhood && state) {
      displayName = `${neighbourhood}, ${state}`;
    } else if (state) {
      displayName = `${state}, ${country}`;
    }
    
    return { city, state, country, displayName, landmark, neighbourhood };
  } catch {
    // Fallback to local country-only lookup
    const country = await reverseGeocode(lat, lng);
    return { country, displayName: country };
  }
}

export async function generateRandomLandPoint(): Promise<{ lat: number; lng: number }> {
  const features = await loadLandData();
  
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    // Generate random lat/lng
    // Bias towards populated latitudes (-60 to 70) to avoid Antarctica/Arctic
    const lat = Math.random() * 130 - 60; // -60 to 70
    const lng = Math.random() * 360 - 180; // -180 to 180
    
    if (isOnLand(lat, lng, features)) {
      return { lat, lng };
    }
    
    attempts++;
  }
  
  // Fallback to a known land point if we somehow fail
  return { lat: 48.8566, lng: 2.3522 }; // Paris
}
