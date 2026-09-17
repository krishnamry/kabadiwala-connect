/**
 * Location Services & Free Geocoding APIs for Kabadiwala Connect
 * - W3C Geolocation API (device GPS)
 * - Free IP Geolocation fallback (ipwho.is - no key needed, CORS enabled)
 * - Free OpenStreetMap Nominatim Reverse Geocoding (real Indian street address)
 * - Free OpenStreetMap Nominatim Search (forward geocoding)
 * - Haversine Distance Calculation (km)
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: 'gps' | 'ip' | 'fallback';
}

export interface GeocodedAddress {
  address: string;
  shortAddress: string;
  city: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  country?: string;
  displayName: string;
}

// In-memory caches to prevent duplicate requests and adhere to usage guidelines
const reverseGeoCache = new Map<string, GeocodedAddress>();
const searchGeoCache = new Map<string, Array<{ lat: number; lng: number; displayName: string; shortName: string }>>();

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : '/api';

/**
 * Calculates great-circle distance between two points using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

/**
 * Generates turn-by-turn navigation URL for Google Maps
 */
export function getDirectionsUrl(destLat: number, destLng: number, originLat?: number, originLng?: number): string {
  if (originLat !== undefined && originLng !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
}

/**
 * Gets user's live position using browser GPS with graceful IP geolocation fallback
 */
export async function getCurrentPosition(): Promise<GeoCoordinates> {
  // 1. Try standard browser Geolocation
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 30000
        });
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy),
        source: 'gps'
      };
    } catch (gpsError) {
      console.warn('Browser GPS unavailable or denied, attempting IP geolocation fallback...', gpsError);
    }
  }

  // 2. Fallback to free IP geolocation API (ipwho.is)
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'ip'
        };
      }
    }
  } catch (ipErr) {
    console.warn('IP geolocation failed, falling back to default coordinates', ipErr);
  }

  // 3. Fallback coordinates (National Central Hub)
  return {
    latitude: 28.6139,
    longitude: 77.2090,
    source: 'fallback'
  };
}

/**
 * Reverse geocodes coordinates to a human-readable Indian street address.
 * Multi-tier pipeline:
 *  1. Local In-Memory Cache (0ms)
 *  2. Backend /api/geo/reverse proxy (OSM compliant with custom User-Agent and server-side cache)
 *  3. Free client-side reverse geocoder (BigDataCloud client API - CORS enabled, no rate-limit blocks)
 *  4. Direct OSM Nominatim fallback
 *  5. Graceful coordinate fallback
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseGeoCache.has(cacheKey)) {
    return reverseGeoCache.get(cacheKey)!;
  }

  // 1. Try Backend Proxy (/api/geo/reverse)
  try {
    const res = await fetch(`${API_BASE}/geo/reverse?lat=${lat}&lng=${lng}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        reverseGeoCache.set(cacheKey, data.data);
        return data.data;
      }
    }
  } catch (err) {
    // Backend unavailable or offline, continue to client fallbacks
  }

  // 2. Try Client-side BigDataCloud Reverse Geocoding API (Fast, Free, Client-friendly, No Block)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(bdcUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const bdc = await res.json();
      const locality = bdc.locality || bdc.city || '';
      const district = bdc.principalSubdivision || '';
      const country = bdc.countryName || 'India';
      const short = locality ? `${locality}, ${district}` : `${district}, ${country}`;
      const full = [bdc.locality, bdc.city, bdc.principalSubdivision, bdc.countryName].filter(Boolean).join(', ');

      const result: GeocodedAddress = {
        address: full || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        shortAddress: short || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
        city: bdc.city || locality || 'India',
        suburb: bdc.locality,
        postcode: bdc.postcode,
        state: bdc.principalSubdivision || '',
        country: country,
        displayName: full || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      };

      reverseGeoCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    // Continue to next fallback
  }

  // 3. Try Direct OSM Nominatim fallback
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const parts: string[] = [];
      if (addr.house_number || addr.building) parts.push(addr.house_number || addr.building);
      if (addr.road || addr.pedestrian || addr.street) parts.push(addr.road || addr.pedestrian || addr.street);
      if (addr.residential || addr.neighbourhood || addr.suburb || addr.quarter) {
        const n = addr.residential || addr.neighbourhood || addr.suburb || addr.quarter;
        if (!parts.includes(n)) parts.push(n);
      }
      const cityOrDistrict = addr.city || addr.town || addr.municipality || addr.village || addr.county?.replace(/ (Tahsil|Tehsil)$/i, '') || addr.state_district || addr.district || '';
      if (cityOrDistrict && !parts.includes(cityOrDistrict)) parts.push(cityOrDistrict);
      if (addr.state && !parts.includes(addr.state)) parts.push(addr.state);
      if (addr.postcode) parts.push(addr.postcode);

      const formatted = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      const locality = addr.road || addr.residential || addr.neighbourhood || addr.suburb || addr.quarter || '';
      const stateName = addr.state || '';

      let short = '';
      if (locality && cityOrDistrict && locality !== cityOrDistrict) {
        short = `${locality}, ${cityOrDistrict}${stateName && stateName !== cityOrDistrict ? `, ${stateName}` : ''}`;
      } else if (cityOrDistrict) {
        short = `${cityOrDistrict}${stateName && stateName !== cityOrDistrict ? `, ${stateName}` : ''}`;
      } else if (locality) {
        short = `${locality}${stateName ? `, ${stateName}` : ''}`;
      } else if (stateName) {
        short = stateName;
      } else {
        short = data.display_name?.split(',').slice(0, 3).join(',') || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
      }

      const result: GeocodedAddress = {
        address: formatted,
        shortAddress: short || formatted,
        city: cityOrDistrict || locality || 'India',
        suburb: addr.suburb || addr.neighbourhood,
        postcode: addr.postcode,
        state: stateName || '',
        country: addr.country || 'India',
        displayName: data.display_name || formatted
      };

      reverseGeoCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('Direct reverse geocoding fallback failed:', err);
  }

  // 4. Fallback if network offline or rate-limited
  const fallback: GeocodedAddress = {
    address: `Pin near ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    shortAddress: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    city: 'India',
    displayName: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
  };
  return fallback;
}

/**
 * Searches locations using forward geocoding.
 * Multi-tier pipeline:
 *  1. Local Cache (0ms)
 *  2. Backend /api/geo/search proxy (compliant, cached)
 *  3. Free Komoot Photon Geocoder (OSM-based, designed for search-as-you-type, no IP blocking)
 *  4. Direct Nominatim fallback
 */
export async function searchAddress(query: string): Promise<Array<{ lat: number; lng: number; displayName: string; shortName: string }>> {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim().toLowerCase();
  if (searchGeoCache.has(q)) {
    return searchGeoCache.get(q)!;
  }

  // 1. Try Backend Proxy (/api/geo/search)
  try {
    const res = await fetch(`${API_BASE}/geo/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        searchGeoCache.set(q, data.data);
        return data.data;
      }
    }
  } catch (err) {
    // Backend offline or unreachable, continue to next fallback
  }

  // 2. Try Komoot Photon API (OSM data, built for autocomplete, CORS friendly)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lat=28.6139&lon=77.2090`;
    const res = await fetch(photonUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const results = data.features.map((feat: any) => {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates || [77.2090, 28.6139];
          const parts = [props.name, props.street, props.district, props.city, props.state, props.country].filter(Boolean);
          const uniqueParts = Array.from(new Set(parts));

          return {
            lat: coords[1],
            lng: coords[0],
            displayName: uniqueParts.join(', ') || props.name || query,
            shortName: props.name || props.street || props.city || query
          };
        });

        searchGeoCache.set(q, results);
        return results;
      }
    }
  } catch (err) {
    // Continue to next fallback
  }

  // 3. Fallback to direct OSM Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const results = data.map((item: any) => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name,
          shortName: item.name || item.display_name.split(',')[0]
        }));
        searchGeoCache.set(q, results);
        return results;
      }
    }
  } catch (err) {
    console.warn('Address search fallback failed:', err);
  }

  return [];
}
