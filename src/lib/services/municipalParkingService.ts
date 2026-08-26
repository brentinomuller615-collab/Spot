/**
 * Client-side service for fetching municipal parking infrastructure.
 *
 * This module talks to our own Next.js API route (/api/municipal-parking),
 * which in turn proxies and caches the Stellenbosch Municipality GIS data.
 *
 * Clients should NOT call the municipality's ArcGIS service directly.
 */

import type {
  MunicipalParkingLocation,
  MunicipalParkingApiResponse,
} from '../municipalParking';

/** Re-export for convenience. */
export type { MunicipalParkingLocation };

/**
 * Fetch all municipal parking locations from the Spot API layer.
 *
 * Returns an empty array if the service is unavailable —
 * callers must handle this gracefully (map still works, GPS still works, etc.).
 */
export async function fetchMunicipalParking(): Promise<MunicipalParkingLocation[]> {
  try {
    const response = await fetch('/api/municipal-parking', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.warn(
        `[municipalParkingService] API returned HTTP ${response.status}. Map markers will be absent.`
      );
      return [];
    }

    const body: MunicipalParkingApiResponse = await response.json();
    return body.locations ?? [];
  } catch (err) {
    console.warn('[municipalParkingService] Failed to fetch municipal parking data:', err);
    return [];
  }
}
