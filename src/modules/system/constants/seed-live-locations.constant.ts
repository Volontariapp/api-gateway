import { ILE_DE_FRANCE_LOCATIONS, type SeedLocation } from './seed-locations.constant.js';

/** Ville unique des evenements en cours, pour que le direct tienne dans un petit rayon. */
export const LIVE_EVENT_CITY = 'Paris';

/** Lieu servant de centre au rayon des evenements en cours. */
export const LIVE_EVENT_ANCHOR_NAME = 'Place de la République';

/** Rayon maximal, en kilometres, autour du centre. */
export const LIVE_EVENT_RADIUS_KM = 2;

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Distance orthodromique entre deux lieux, en kilometres. */
export const distanceKm = (a: SeedLocation, b: SeedLocation): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

/**
 * Lieux de la liste Ile-de-France situes dans LIVE_EVENT_CITY et a moins de
 * LIVE_EVENT_RADIUS_KM du centre. Retombe sur tous les lieux de la ville si le centre est absent.
 */
export const selectLiveLocations = (
  locations: readonly SeedLocation[] = ILE_DE_FRANCE_LOCATIONS,
): SeedLocation[] => {
  const inCity = locations.filter((location) => location.city === LIVE_EVENT_CITY);
  const anchor = inCity.find((location) => location.name === LIVE_EVENT_ANCHOR_NAME);
  if (!anchor) {
    return inCity;
  }
  return inCity.filter((location) => distanceKm(anchor, location) <= LIVE_EVENT_RADIUS_KM);
};
