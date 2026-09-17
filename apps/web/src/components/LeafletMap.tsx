import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Pickup } from '../types';
import { getCurrentPosition, reverseGeocode, searchAddress, GeoCoordinates } from '../lib/location';
import { Navigation, Loader2, Search, MapPin, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export interface MapCustomMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  iconEmoji?: string;
  badge?: string;
  color?: string;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  pickups?: Pickup[];
  markers?: MapCustomMarker[];
  selectedPickupId?: string | null;
  onSelectPickup?: (pickup: Pickup) => void;
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  selectableLocation?: boolean;
  pinLocation?: [number, number] | null;
  height?: string;
  showLocateButton?: boolean;
  showSearch?: boolean;
  showDropPinButton?: boolean;
  userPosition?: [number, number] | null;
}

const POPULAR_LOCATIONS = [
  { shortName: 'Okhla Phase II', displayName: 'Okhla Industrial Area Phase II, New Delhi', lat: 28.5355, lng: 77.2732 },
  { shortName: 'Connaught Place', displayName: 'Connaught Place, New Delhi, Delhi 110001', lat: 28.6315, lng: 77.2167 },
  { shortName: 'Dharavi Hub', displayName: 'Dharavi E-Waste Recycling Hub, Mumbai, Maharashtra', lat: 19.0434, lng: 72.8567 },
  { shortName: 'Bandra West', displayName: 'Bandra West, Mumbai, Maharashtra 400050', lat: 19.0596, lng: 72.8295 },
  { shortName: 'Whitefield', displayName: 'Whitefield Tech Corridor, Bengaluru, Karnataka', lat: 12.9698, lng: 77.7499 },
  { shortName: 'Koramangala', displayName: 'Koramangala, Bengaluru, Karnataka 560034', lat: 12.9352, lng: 77.6245 },
  { shortName: 'Sector 62 Noida', displayName: 'Sector 62, Noida, Uttar Pradesh 201309', lat: 28.6280, lng: 77.3649 },
  { shortName: 'Cyber City Gurugram', displayName: 'DLF Cyber City, Gurugram, Haryana 122002', lat: 28.4952, lng: 77.0895 },
];

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [28.6139, 77.2090], // Default map center
  zoom = 13,
  pickups = [],
  markers = [],
  selectedPickupId,
  onSelectPickup,
  onLocationSelect,
  selectableLocation = true,
  pinLocation,
  height = '420px',
  showLocateButton = true,
  showSearch = true,
  showDropPinButton = true,
  userPosition
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const customMarkersRef = useRef<{ [id: string]: L.Marker }>({});
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const userBeaconRef = useRef<L.Marker | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ lat: number; lng: number; displayName: string; shortName: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView(center, zoom);

      // CartoDB Voyager: High-performance OSM-based tile layer on global CDN, fully compliant with OSM guidelines
      const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>'
      });
      tileLayer.addTo(map);

      // Tap / Click anywhere on map to drop or reposition pin
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        triggerHaptic(15);
        try {
          const geo = await reverseGeocode(lat, lng);
          setGeoNotice(`📍 Pinned: ${geo.shortAddress}`);
          if (onLocationSelect) onLocationSelect(lat, lng, geo.address);
        } catch {
          if (onLocationSelect) onLocationSelect(lat, lng);
        }
      });

      mapInstanceRef.current = map;

      // Invalidate size after layout calculations (essential for mobile portrait)
      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 250);
      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 600);
    }
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for locations & OSM Geocoding
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(POPULAR_LOCATIONS);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchedPopular = POPULAR_LOCATIONS.filter(
      loc => loc.shortName.toLowerCase().includes(q) || loc.displayName.toLowerCase().includes(q)
    );
    setSearchResults(matchedPopular);

    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const remoteResults = await searchAddress(searchQuery);
          const combined = [...matchedPopular];
          for (const item of remoteResults) {
            const exists = combined.some(
              c => Math.abs(c.lat - item.lat) < 0.005 && Math.abs(c.lng - item.lng) < 0.005
            );
            if (!exists) {
              combined.push(item);
            }
          }
          setSearchResults(combined);
        } catch (err) {
          console.warn('Address search failed:', err);
        } finally {
          setIsSearching(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle selecting a search result
  const handleSelectLocation = (loc: { lat: number; lng: number; displayName: string; shortName?: string }) => {
    triggerHaptic(20);
    setSearchOpen(false);
    setSearchQuery(loc.shortName || loc.displayName.split(',')[0]);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([loc.lat, loc.lng], 16, { duration: 1.0 });
    }
    setGeoNotice(`📍 Selected: ${loc.shortName || loc.displayName.split(',')[0]}`);
    if (onLocationSelect) {
      onLocationSelect(loc.lat, loc.lng, loc.displayName);
    }
    setTimeout(() => setGeoNotice(null), 3500);
  };

  // Handle dropping pin at current map center
  const handleDropPinAtCenter = async () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    triggerHaptic(25);
    const centerLatLng = map.getCenter();
    const lat = centerLatLng.lat;
    const lng = centerLatLng.lng;

    try {
      const geo = await reverseGeocode(lat, lng);
      setGeoNotice(`📍 Pin Dropped: ${geo.shortAddress}`);
      if (onLocationSelect) onLocationSelect(lat, lng, geo.address);
    } catch {
      setGeoNotice(`📍 Pin Dropped: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
      if (onLocationSelect) onLocationSelect(lat, lng);
    }
    setTimeout(() => setGeoNotice(null), 3500);
  };

  // Update center
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Handle User Location Beacon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeUserPos = userPosition;
    if (activeUserPos) {
      if (userBeaconRef.current) {
        userBeaconRef.current.setLatLng(activeUserPos);
      } else {
        const beaconHtml = `
          <div style="position: relative; width: 22px; height: 22px;">
            <div style="position: absolute; inset: -8px; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #2563eb; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
              •
            </div>
          </div>
        `;
        const beaconIcon = L.divIcon({
          className: 'user-live-beacon',
          html: beaconHtml,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const beacon = L.marker(activeUserPos, { icon: beaconIcon }).addTo(map);
        beacon.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; font-weight: bold; color: #1e3a8a;">
            📍 Your Current Location
          </div>
        `);
        userBeaconRef.current = beacon;
      }
    }
  }, [userPosition]);

  // Handle "Locate Me" button click
  const handleLocateMe = async () => {
    setIsLocating(true);
    setGeoNotice(null);
    try {
      const pos: GeoCoordinates = await getCurrentPosition();
      const map = mapInstanceRef.current;
      if (map) {
        map.flyTo([pos.latitude, pos.longitude], 15, { duration: 1.2 });

        // Update or create user live beacon
        if (userBeaconRef.current) {
          userBeaconRef.current.setLatLng([pos.latitude, pos.longitude]);
        } else {
          const beaconHtml = `
            <div style="position: relative; width: 22px; height: 22px;">
              <div style="position: absolute; inset: -8px; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 22px; height: 22px; border-radius: 50%; background: #2563eb; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
            </div>
          `;
          const beaconIcon = L.divIcon({
            className: 'user-live-beacon',
            html: beaconHtml,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          const beacon = L.marker([pos.latitude, pos.longitude], { icon: beaconIcon }).addTo(map);
          beacon.bindPopup(`<div style="font-family: sans-serif; font-size: 12px; font-weight: bold; color: #1e3a8a;">📍 You Are Here (${pos.source.toUpperCase()})</div>`);
          userBeaconRef.current = beacon;
        }

        // If in selectable mode, also update the selected pin & reverse geocode
        if (selectableLocation && onLocationSelect) {
          const geo = await reverseGeocode(pos.latitude, pos.longitude);
          onLocationSelect(pos.latitude, pos.longitude, geo.address);
          setGeoNotice(`📍 Located: ${geo.shortAddress}`);
        } else {
          const geo = await reverseGeocode(pos.latitude, pos.longitude);
          setGeoNotice(`📍 ${geo.shortAddress}`);
        }
      }
    } catch (err) {
      console.warn('Locate me failed:', err);
      setGeoNotice('Could not retrieve live GPS position');
    } finally {
      setIsLocating(false);
      setTimeout(() => setGeoNotice(null), 4000);
    }
  };

  // Render pickup markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    pickups.forEach(p => {
      const isSelected = p.id === selectedPickupId;
      const statusColor =
        p.status === 'COMPLETED' ? '#10b981' :
        p.status === 'IN_PROGRESS' ? '#3b82f6' :
        p.status === 'ACCEPTED' ? '#f59e0b' : '#ef4444';

      const iconHtml = `
        <div style="
          background-color: ${statusColor};
          width: ${isSelected ? '32px' : '26px'};
          height: ${isSelected ? '32px' : '26px'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 11px;
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.2s;
        ">
          📦
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([p.latitude, p.longitude], { icon: customIcon }).addTo(map);

      const itemsSummary = p.items.map(i => `${i.category} (${i.estWeightKg}kg)`).join(', ');
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 180px;">
          <h4 style="margin: 0 0 4px; font-weight: 700; font-size: 14px; color: #0f172a;">${p.address}</h4>
          <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">${itemsSummary || 'Scrap items'}</div>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${statusColor}20; color: ${statusColor};">
            ${p.status}
          </span>
          ${p.distanceKm !== undefined ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">📍 ${p.distanceKm} km away</div>` : ''}
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}" target="_blank" rel="noopener noreferrer" style="color: #b45309; font-size: 11px; font-weight: bold; text-decoration: none; display: flex; items: center; gap: 4px;">
              Directions on Maps →
            </a>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectPickup) onSelectPickup(p);
      });

      markersRef.current[p.id] = marker;
    });
  }, [pickups, selectedPickupId]);

  // Render custom facility / recycler markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(customMarkersRef.current).forEach(m => m.remove());
    customMarkersRef.current = {};

    markers.forEach(cm => {
      const color = cm.color || '#B5573A';
      const iconHtml = `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: white;
        ">
          ${cm.iconEmoji || '📍'}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-facility-marker',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([cm.lat, cm.lng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 170px; padding: 2px;">
          <h4 style="margin: 0 0 4px; font-weight: 700; font-size: 13px; color: #1e293b;">${cm.title}</h4>
          ${cm.subtitle ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${cm.subtitle}</div>` : ''}
          ${cm.badge ? `<span style="display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: ${color}20; color: ${color};">${cm.badge}</span>` : ''}
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${cm.lat},${cm.lng}" target="_blank" rel="noopener noreferrer" style="color: #b45309; font-size: 11px; font-weight: bold; text-decoration: none;">
              Open Navigation →
            </a>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      customMarkersRef.current[cm.id] = marker;
    });
  }, [markers]);

  // Draggable / selected location pin for pickup creation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pinLocation) {
      if (pickMarkerRef.current) {
        pickMarkerRef.current.setLatLng(pinLocation);
      } else {
        const pinIcon = L.divIcon({
          className: 'pick-pin-marker',
          html: `<div style="background-color: #059669; color: white; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;"><span style="transform: rotate(45deg);">📍</span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34]
        });

        const newMarker = L.marker(pinLocation, { icon: pinIcon, draggable: true }).addTo(map);

        // Fetch reverse geocode address on drag end
        newMarker.on('dragend', async () => {
          const latlng = newMarker.getLatLng();
          try {
            const geo = await reverseGeocode(latlng.lat, latlng.lng);
            newMarker.bindPopup(`<div style="font-family: sans-serif; font-size: 11px; font-weight: bold;">📍 ${geo.address}</div>`).openPopup();
            if (onLocationSelect) onLocationSelect(latlng.lat, latlng.lng, geo.address);
          } catch {
            if (onLocationSelect) onLocationSelect(latlng.lat, latlng.lng);
          }
        });

        pickMarkerRef.current = newMarker;
      }
    } else if (pickMarkerRef.current) {
      pickMarkerRef.current.remove();
      pickMarkerRef.current = null;
    }
  }, [pinLocation]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-steel-300 dark:border-slate-700 shadow-inner z-0" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Search Bar (Top Left) */}
      {showSearch && (
        <div ref={searchContainerRef} className="absolute top-3 left-3 z-[400] max-w-[200px] sm:max-w-xs w-full">
          <div className="relative flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-steel-300 dark:border-slate-700 shadow-md px-2.5 py-1.5 transition-all focus-within:ring-2 focus-within:ring-copper-500">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-copper-600 dark:text-copper-400 animate-spin shrink-0 mr-1.5" />
            ) : (
              <Search className="w-3.5 h-3.5 text-steel-400 dark:text-slate-400 shrink-0 mr-1.5" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search location..."
              className="w-full bg-transparent text-xs font-mono font-medium text-steel-900 dark:text-slate-100 placeholder:text-steel-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(POPULAR_LOCATIONS);
                }}
                className="p-0.5 hover:bg-steel-100 dark:hover:bg-slate-800 rounded text-steel-400 dark:text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 w-64 sm:w-72 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-steel-300 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-steel-100 dark:divide-slate-800 z-[500]">
              <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-steel-400 dark:text-slate-500 bg-paper-50 dark:bg-slate-950">
                {searchQuery.trim() ? 'SEARCH RESULTS' : 'POPULAR RECYCLING HUBS'}
              </div>
              {searchResults.slice(0, 6).map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-3 py-2 hover:bg-steel-50 dark:hover:bg-slate-800/80 flex items-start gap-2 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-copper-600 dark:text-copper-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-steel-900 dark:text-slate-100 truncate">
                      {loc.shortName}
                    </div>
                    <div className="text-[10px] text-steel-500 dark:text-slate-400 truncate">
                      {loc.displayName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Controls (Top Right: Drop Pin + Locate Me) */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
        {showDropPinButton && (
          <button
            type="button"
            onClick={handleDropPinAtCenter}
            title="Drop Pin at Center of Map"
            className="bg-white/95 dark:bg-slate-900/95 hover:bg-paper-100 dark:hover:bg-slate-800 active:bg-paper-200 text-steel-800 dark:text-slate-100 px-2.5 py-1.5 rounded-lg border border-steel-300 dark:border-slate-700 shadow-tactile flex items-center gap-1 text-xs font-bold font-mono transition-transform active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Drop Pin</span>
            <span className="sm:hidden">Pin</span>
          </button>
        )}

        {showLocateButton && (
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Detect My Live Location (GPS / IP)"
            className="bg-white/95 dark:bg-slate-900/95 hover:bg-paper-100 dark:hover:bg-slate-800 active:bg-paper-200 text-steel-800 dark:text-slate-100 px-2.5 py-1.5 rounded-lg border border-steel-300 dark:border-slate-700 shadow-tactile flex items-center gap-1 text-xs font-bold font-mono transition-transform active:scale-95 disabled:opacity-60"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 text-copper-600 dark:text-copper-400 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-copper-600 dark:text-copper-400" />
            )}
            <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'Locate Me'}</span>
            <span className="sm:hidden">{isLocating ? '...' : 'GPS'}</span>
          </button>
        )}
      </div>

      {/* Geocoded Feedback Banner */}
      {geoNotice && (
        <div className="absolute top-12 sm:top-14 right-3 left-3 z-[400] bg-forest-800/95 dark:bg-forest-900/95 text-paper-50 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-tactile border border-forest-600 flex items-center justify-between animate-fade-in pointer-events-none backdrop-blur-sm">
          <span className="truncate">{geoNotice}</span>
        </div>
      )}
    </div>
  );
};
