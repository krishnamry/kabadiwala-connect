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

// In-memory cache for reverse geocoding to prevent duplicate OSM Nominatim calls
const reverseGeoCache = new Map<string, GeocodedAddress>();

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
 * Reverse geocodes coordinates to a human-readable Indian street address via OSM Nominatim API
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseGeoCache.has(cacheKey)) {
    return reverseGeoCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KabadiwalaConnect-Dhatu/1.0'
      },
      signal: AbortSignal.timeout(5000)
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
    console.warn('Reverse geocoding request failed:', err);
  }

  // Fallback if network offline or rate-limited
  const fallback: GeocodedAddress = {
    address: `Pin near ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    shortAddress: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    city: 'India',
    displayName: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
  };
  return fallback;
}

/**
 * Searches locations using OpenStreetMap Nominatim forward search
 */
export async function searchAddress(query: string): Promise<Array<{ lat: number; lng: number; displayName: string; shortName: string }>> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KabadiwalaConnect-Dhatu/1.0'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        shortName: item.name || item.display_name.split(',')[0]
      }));
    }
  } catch (err) {
    console.warn('Address search failed:', err);
  }

  return [];
}
