import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// In-memory cache to prevent duplicate requests and stay well within OSM limits
const reverseCache = new Map<string, any>();
const searchCache = new Map<string, any>();

const OSM_HEADERS = {
  'User-Agent': 'KabadiwalaConnect-Dhatu/1.0 (contact: support@kabadiwalaconnect.org; open-source-recycling-logistics)',
  'Accept': 'application/json',
  'Referer': 'https://kabadiwalaconnect.org'
};

/**
 * GET /api/geo/reverse
 * Compliant reverse geocoding proxy with caching and fallback
 */
router.get('/reverse', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'lat and lng parameters are required' });
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ success: false, error: 'Invalid coordinates' });
  }

  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (reverseCache.has(cacheKey)) {
    return res.json({ success: true, data: reverseCache.get(cacheKey), cached: true });
  }

  // 1. Try OSM Nominatim with full compliance headers
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await axios.get(nominatimUrl, {
      headers: OSM_HEADERS,
      timeout: 4000
    });

    if (response.data) {
      const data = response.data;
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

      const formatted = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

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
        short = data.display_name?.split(',').slice(0, 3).join(',') || `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;
      }

      const result = {
        address: formatted,
        shortAddress: short || formatted,
        city: cityOrDistrict || locality || 'India',
        suburb: addr.suburb || addr.neighbourhood,
        postcode: addr.postcode,
        state: stateName || '',
        country: addr.country || 'India',
        displayName: data.display_name || formatted
      };

      reverseCache.set(cacheKey, result);
      return res.json({ success: true, data: result });
    }
  } catch (err: any) {
    console.warn('Backend Nominatim reverse geocode failed, attempting BigDataCloud fallback...', err?.message || err);
  }

  // 2. Fallback to BigDataCloud reverse geocode API
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const bdcRes = await axios.get(bdcUrl, { timeout: 3500 });
    if (bdcRes.data) {
      const bdc = bdcRes.data;
      const locality = bdc.locality || bdc.city || '';
      const district = bdc.principalSubdivision || '';
      const country = bdc.countryName || 'India';
      const short = locality ? `${locality}, ${district}` : `${district}, ${country}`;
      const full = [bdc.locality, bdc.city, bdc.principalSubdivision, bdc.countryName].filter(Boolean).join(', ');

      const result = {
        address: full || `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        shortAddress: short || `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
        city: bdc.city || locality || 'India',
        suburb: bdc.locality,
        postcode: bdc.postcode,
        state: bdc.principalSubdivision || '',
        country: country,
        displayName: full || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      };

      reverseCache.set(cacheKey, result);
      return res.json({ success: true, data: result });
    }
  } catch (err: any) {
    console.warn('BigDataCloud fallback failed:', err?.message || err);
  }

  // 3. Fallback coordinates object
  const fallback = {
    address: `Pin near ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
    shortAddress: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
    city: 'India',
    displayName: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  };
  return res.json({ success: true, data: fallback });
});

/**
 * GET /api/geo/search
 * Forward geocoding search proxy using Photon (OSM-based) and Nominatim
 */
router.get('/search', async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.json({ success: true, data: [] });
  }

  const query = q.trim().toLowerCase();
  if (searchCache.has(query)) {
    return res.json({ success: true, data: searchCache.get(query), cached: true });
  }

  // 1. Try Photon (Komoot OSM-based search engine designed for auto-complete without rate limits)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lat=28.6139&lon=77.2090`;
    const response = await axios.get(photonUrl, { timeout: 4000 });

    if (response.data && response.data.features && response.data.features.length > 0) {
      const results = response.data.features.map((feat: any) => {
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

      searchCache.set(query, results);
      return res.json({ success: true, data: results });
    }
  } catch (err: any) {
    console.warn('Photon geocoding failed, trying Nominatim fallback...', err?.message || err);
  }

  // 2. Fallback to Nominatim with proper headers
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`;
    const response = await axios.get(nominatimUrl, {
      headers: OSM_HEADERS,
      timeout: 4000
    });

    if (response.data && Array.isArray(response.data)) {
      const results = response.data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        shortName: item.name || item.display_name.split(',')[0]
      }));

      searchCache.set(query, results);
      return res.json({ success: true, data: results });
    }
  } catch (err: any) {
    console.warn('Nominatim search fallback failed:', err?.message || err);
  }

  return res.json({ success: true, data: [] });
});

export default router;
