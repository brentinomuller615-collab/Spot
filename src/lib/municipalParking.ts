/**
 * Municipal parking infrastructure types.
 *
 * Source: Stellenbosch Municipality GIS
 * Service: https://citymaps.stellenbosch.gov.za/server/rest/services/Basemap/BasemapData/MapServer
 * Layer: 14 ("Parking"), esriGeometryPoint, CAT_ID field drives category
 *
 * IMPORTANT: This data represents INFRASTRUCTURE only.
 * It does NOT represent live availability, capacity, occupancy, or pricing.
 */

/** Parking category codes as found in the CAT_ID field of layer 14. */
export type MunicipalParkingCatId = '7520' | '7521' | '7522' | '9720';

/** Human-readable label for each CAT_ID value, matching the renderer legend. */
export const MUNICIPAL_PARKING_CATEGORY_LABELS: Record<MunicipalParkingCatId, string> = {
  '7520': 'Parking Lot',
  '7521': 'Parking Garage/House',
  '7522': 'Park and Ride',
  '9720': 'Truck Parking',
};

/**
 * A single municipal parking location.
 * Only fields that actually exist in the ArcGIS layer are included.
 * Fields that do not exist (capacity, availability, pricing, spaces) are intentionally absent.
 */
export interface MunicipalParkingLocation {
  /** ArcGIS OBJECTID — stable integer identifier for the feature. */
  id: number;

  /** Latitude in WGS84 (decimal degrees). */
  latitude: number;

  /** Longitude in WGS84 (decimal degrees). */
  longitude: number;

  /**
   * Parking category code from the CAT_ID field.
   * Use MUNICIPAL_PARKING_CATEGORY_LABELS to get a human-readable label.
   */
  categoryId: MunicipalParkingCatId;

  /** Human-readable category label derived from categoryId. */
  categoryLabel: string;

  /**
   * The name of the parking location from POI_NAME.
   * May be a generic name like "Parking Place" for unnamed lots.
   */
  name: string;

  /**
   * Built-up area name (suburb/town) from BuiltUp_Name.
   * e.g. "Stellenbosch"
   */
  builtUpName: string | null;

  /**
   * Municipality name from Municipality field.
   * e.g. "Cape Winelands"
   */
  municipality: string | null;

  /**
   * Street name from ACTUAL_STREET_NAME, if present.
   * Many records have an empty string — stored as null in that case.
   */
  streetName: string | null;
}

/** The response shape returned by our /api/municipal-parking route. */
export interface MunicipalParkingApiResponse {
  locations: MunicipalParkingLocation[];
  /** ISO timestamp of when the cache was last populated. */
  cachedAt: string;
  /** Total number of records in the response. */
  count: number;
}
