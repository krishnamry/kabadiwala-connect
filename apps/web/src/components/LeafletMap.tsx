import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Pickup } from '../types';

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  pickups?: Pickup[];
  selectedPickupId?: string | null;
  onSelectPickup?: (pickup: Pickup) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectableLocation?: boolean;
  pinLocation?: [number, number] | null;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [28.5685, 77.2412], // Delhi Lajpat Nagar region default
  zoom = 13,
  pickups = [],
  selectedPickupId,
  onSelectPickup,
  onLocationSelect,
  selectableLocation = false,
  pinLocation,
  height = '420px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const pickMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      if (selectableLocation && onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Don't necessarily destroy on every small re-render
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

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
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectPickup) onSelectPickup(p);
      });

      markersRef.current[p.id] = marker;
    });
  }, [pickups, selectedPickupId]);

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
        newMarker.on('dragend', () => {
          const latlng = newMarker.getLatLng();
          if (onLocationSelect) onLocationSelect(latlng.lat, latlng.lng);
        });
        pickMarkerRef.current = newMarker;
      }
    } else if (pickMarkerRef.current) {
      pickMarkerRef.current.remove();
      pickMarkerRef.current = null;
    }
  }, [pinLocation]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
      className="border border-slate-200 shadow-inner z-0"
    />
  );
};
