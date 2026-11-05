/**
 * geocodingService.ts
 *
 * Thin wrapper around the MapTiler Geocoding API for forward geocoding
 * (address → coordinates) used by business onboarding and settings.
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  /** Human-readable display address returned by MapTiler */
  displayAddress: string;
}

/**
 * Geocodes a free-text address string using MapTiler's geocoding API.
 * Returns the best match or throws if nothing useful is found.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!apiKey) {
    throw new Error('MapTiler API key is not configured.');
  }

  const encoded = encodeURIComponent(address.trim());
  const url = `https://api.maptiler.com/geocoding/${encoded}.json?key=${apiKey}&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocoding request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!data?.features?.length) {
    throw new Error('No results found for this address. Please try a more specific address.');
  }

  const feature = data.features[0];
  const [longitude, latitude] = feature.center as [number, number];
  const displayAddress: string = feature.place_name || address;

  return { latitude, longitude, displayAddress };
}

