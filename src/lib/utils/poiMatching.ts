import { Business } from '../types';
import { calculateDistanceMeters } from './geo';

/**
 * Normalizes a business name for comparison by:
 * - converting to lowercase
 * - removing punctuation
 * - normalizing whitespace
 * - removing common business suffixes
 */
export function normalizeBusinessName(name: string): string {
  if (!name) return '';
  let normalized = name.toLowerCase();
  
  // Remove punctuation
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
  
  // Remove common suffixes
  const suffixes = ['cafe', 'restaurant', 'bakery', 'shop', 'ltd', 'cc', 'pty'];
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  
  const filteredWords = words.filter(word => !suffixes.includes(word));
  
  // If we stripped everything (e.g. name was literally "Cafe"), fallback to original words
  if (filteredWords.length === 0) {
    return words.join(' ');
  }
  
  return filteredWords.join(' ');
}

/**
 * Determines if a MapTiler POI corresponds to a known Spot Business.
 * Strategy:
 * 1. Geographic proximity (within ~50m)
 * 2. Normalized name similarity
 */
export function matchPoiToSpotBusiness(
  poiName: string, 
  poiLat: number, 
  poiLng: number, 
  spotBusinesses: Business[]
): Business | null {
  if (!poiName || !spotBusinesses || spotBusinesses.length === 0) return null;
  
  const MAX_DISTANCE_METERS = 50;
  const normalizedPoiName = normalizeBusinessName(poiName);
  
  // Candidates within distance
  const candidates = spotBusinesses.filter(b => {
    const dist = calculateDistanceMeters(poiLat, poiLng, b.latitude, b.longitude);
    return dist <= MAX_DISTANCE_METERS;
  });
  
  for (const candidate of candidates) {
    const normalizedCandidateName = normalizeBusinessName(candidate.name);
    
    // Check if one contains the other
    if (normalizedPoiName.includes(normalizedCandidateName) || 
        normalizedCandidateName.includes(normalizedPoiName)) {
      return candidate;
    }
  }
  
  return null;
}
