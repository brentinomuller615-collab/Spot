/**
 * GET /api/municipal-parking
 *
 * Server-side proxy + cache for the Stellenbosch Municipality ArcGIS parking layer.
 *
 * Source service:
 *   https://citymaps.stellenbosch.gov.za/server/rest/services/Basemap/BasemapData/MapServer
 * Layer: 14 ("Parking")
 *   - Geometry: esriGeometryPoint (WGS84 native, source WKID 4326)
 *   - Category field: CAT_ID
 *   - Categories: 7520 = Parking Lot, 7521 = Parking Garage/House,
 *                 7522 = Park and Ride, 9720 = Truck Parking
 *
 * Caching strategy:
 *   The municipal dataset is static infrastructure data that changes infrequently.
 *   We cache the full result in process-level memory for CACHE_TTL_MS milliseconds.
 *   On first request the municipality is fetched; subsequent requests within the TTL
 *   are served from cache without hitting the external service.
 *
 *   In production (serverless/edge) memory cache resets per cold start. For this MVP
 *   that is acceptable — the dataset is small (~dozens of records) and the municipality
 *   service is fast. A more durable cache (Redis, Vercel KV, file) can replace this later.
 */

import { NextResponse } from 'next/server';
import type {
  MunicipalParkingLocation,
  MunicipalParkingApiResponse,
  MunicipalParkingCatId,
} from '../../../lib/municipalParking';
import { MUNICIPAL_PARKING_CATEGORY_LABELS } from '../../../lib/municipalParking';

const ARCGIS_BASE =
  'https://citymaps.stellenbosch.gov.za/server/rest/services/Basemap/BasemapData/MapServer';
const PARKING_LAYER_ID = 14;

/** Only the CAT_ID values we care about (all four parking categories). */
const PARKING_CAT_IDS: MunicipalParkingCatId[] = ['7520', '7521', '7522', '9720'];

/** Fields to retrieve — only what we actually use. */
const OUT_FIELDS = [
  'OBJECTID',
  'CAT_ID',
  'POI_NAME',
  'ACTUAL_STREET_NAME',
  'BuiltUp_Name',
  'Municipality',
].join(',');

/** Cache TTL: 1 hour in milliseconds. Municipal infrastructure data is stable. */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** In-process memory cache (survives between requests in the same Node.js process). */
let cache: {
  data: MunicipalParkingLocation[];
  cachedAt: number;
} | null = null;

/** Build the ArcGIS query URL for the parking layer. */
function buildQueryUrl(): string {
  const whereClause = `CAT_ID IN (${PARKING_CAT_IDS.map((id) => `'${id}'`).join(',')})`;
  const params = new URLSearchParams({
    where: whereClause,
    outFields: OUT_FIELDS,
    outSR: '4326', // Request WGS84 — same as GeoJSON standard
    f: 'geojson',
    resultRecordCount: '10000', // Generous cap; dataset is small (~dozens of records)
  });
  return `${ARCGIS_BASE}/${PARKING_LAYER_ID}/query?${params.toString()}`;
}

/** Parse a single GeoJSON feature into a MunicipalParkingLocation. */
function parseFeature(feature: any): MunicipalParkingLocation | null {
  try {
    const { geometry, properties, id } = feature;

    if (!geometry || geometry.type !== 'Point') return null;

    // GeoJSON coordinates are always [longitude, latitude]
    const [longitude, latitude] = geometry.coordinates as [number, number];

    if (typeof longitude !== 'number' || typeof latitude !== 'number') return null;

    const catId = (properties.CAT_ID ?? '').trim() as MunicipalParkingCatId;
    if (!MUNICIPAL_PARKING_CATEGORY_LABELS[catId]) return null;

    const rawName = (properties.POI_NAME ?? '').trim();
    const rawStreet = (properties.ACTUAL_STREET_NAME ?? '').trim();
    const rawBuiltUp = (properties.BuiltUp_Name ?? '').trim();
    const rawMunicipality = (properties.Municipality ?? '').trim();

    return {
      id: typeof id === 'number' ? id : Number(properties.OBJECTID),
      latitude,
      longitude,
      categoryId: catId,
      categoryLabel: MUNICIPAL_PARKING_CATEGORY_LABELS[catId],
      name: rawName || MUNICIPAL_PARKING_CATEGORY_LABELS[catId],
      builtUpName: rawBuiltUp || null,
      municipality: rawMunicipality || null,
      streetName: rawStreet || null,
    };
  } catch {
    return null;
  }
}

/** Fetch fresh data from the municipality and populate the cache. */
async function fetchFromMunicipality(): Promise<MunicipalParkingLocation[]> {
  const url = buildQueryUrl();

  const response = await fetch(url, {
    // next.js fetch cache: revalidate every hour server-side (belt + suspenders)
    next: { revalidate: 3600 },
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000), // 15 s timeout
  });

  if (!response.ok) {
    throw new Error(
      `Municipal GIS responded with HTTP ${response.status}: ${response.statusText}`
    );
  }

  const geojson = await response.json();

  if (!geojson?.features || !Array.isArray(geojson.features)) {
    throw new Error('Unexpected GeoJSON response structure from municipal service');
  }

  const locations: MunicipalParkingLocation[] = [];
  for (const feature of geojson.features) {
    const parsed = parseFeature(feature);
    if (parsed) locations.push(parsed);
  }

  return locations;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Serve from in-process cache if still fresh
    const now = Date.now();
    if (cache && now - cache.cachedAt < CACHE_TTL_MS) {
      const body: MunicipalParkingApiResponse = {
        locations: cache.data,
        cachedAt: new Date(cache.cachedAt).toISOString(),
        count: cache.data.length,
      };
      return NextResponse.json(body, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      });
    }

    // Cache miss — fetch from municipality
    const locations = await fetchFromMunicipality();

    cache = { data: locations, cachedAt: Date.now() };

    const body: MunicipalParkingApiResponse = {
      locations,
      cachedAt: new Date(cache.cachedAt).toISOString(),
      count: locations.length,
    };

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (err: any) {
    console.error('[/api/municipal-parking] Error fetching municipal data:', err?.message ?? err);

    // Return a graceful empty response — the app must not break if this service is down
    const emptyBody: MunicipalParkingApiResponse = {
      locations: [],
      cachedAt: new Date().toISOString(),
      count: 0,
    };

    return NextResponse.json(emptyBody, {
      status: 200, // Return 200 with empty list rather than 5xx so client doesn't hard-fail
      headers: {
        'Cache-Control': 'no-store',
        'X-Municipal-Error': 'true',
      },
    });
  }
}
