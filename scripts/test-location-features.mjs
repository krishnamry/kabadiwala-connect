import assert from 'assert';

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
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
  return Math.round(d * 10) / 10;
}

function getDirectionsUrl(destLat, destLng, originLat, originLng) {
  if (originLat !== undefined && originLng !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
}

console.log('====================================================');
console.log('🧪 VERIFYING LOCATION UTILITIES & GEOLOCATION RULES');
console.log('====================================================\n');

// 1. Test Haversine distance calculation
// Lajpat Nagar (28.5685, 77.2412) to Okhla (28.5355, 77.2732) is ~4.8 km
const dist1 = calculateDistanceKm(28.5685, 77.2412, 28.5355, 77.2732);
console.log(`✅ 1. Distance Lajpat Nagar -> Okhla: ${dist1} km`);
assert(dist1 > 4.0 && dist1 < 6.0, 'Distance must be approximately 4.8 km');

// Same location distance must be 0
const distZero = calculateDistanceKm(28.5685, 77.2412, 28.5685, 77.2412);
assert.strictEqual(distZero, 0, 'Distance between identical points must be 0');
console.log('✅ 2. Identical coordinates return 0.0 km.');

// 2. Test directions URL generation
const dirUrl1 = getDirectionsUrl(28.5355, 77.2732);
assert(dirUrl1.includes('destination=28.5355,77.2732'), 'Directions URL must include destination');
console.log('✅ 3. Destination navigation URL generated correctly.');

const dirUrlWithOrigin = getDirectionsUrl(28.5355, 77.2732, 28.5685, 77.2412);
assert(dirUrlWithOrigin.includes('origin=28.5685,77.2412') && dirUrlWithOrigin.includes('destination=28.5355,77.2732'), 'Directions URL must include origin and destination');
console.log('✅ 4. Turn-by-turn route navigation URL generated correctly.');

// 3. Test Pan-India Indian address parsing (e.g. Punjab, Phagwara, rural/semi-urban locations)
function formatAddress(addr) {
  const parts = [];
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
  }
  return { parts: parts.join(', '), short };
}

const mockPunjabAddr = {
  road: 'Chiheru Khusropur Link Road',
  residential: 'Law gate',
  county: 'Phagwara Tahsil',
  state_district: 'Kapurthala',
  state: 'Punjab',
  postcode: '144411',
  country: 'India'
};

const punjabFormatted = formatAddress(mockPunjabAddr);
console.log(`✅ 5. Punjab address short formatted: "${punjabFormatted.short}"`);
assert(!punjabFormatted.short.includes('Delhi'), 'Must NOT contain Delhi for a Punjab location');
assert(punjabFormatted.short.includes('Phagwara') && punjabFormatted.short.includes('Punjab'), 'Must contain Phagwara and Punjab');

console.log('\n====================================================');
console.log('🎉 ALL LOCATION UTILITY TESTS PASSED (100%)');
console.log('====================================================\n');
