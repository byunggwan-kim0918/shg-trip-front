'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { WizardPlace } from '@/lib/types/itinerary';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createNumberedIcon(index: number) {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;background:#3b82f6;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${index + 1}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

interface PlaceMapProps {
  places: WizardPlace[];
}

const SEOUL_CENTER: [number, number] = [37.5665, 126.9780];

export default function PlaceMap({ places }: PlaceMapProps) {
  const center: [number, number] = places.length > 0
    ? [places[0].latitude, places[0].longitude]
    : SEOUL_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={places.length > 0 ? 13 : 11}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      {places.map((place, i) => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          icon={createNumberedIcon(i)}
        >
          <Popup>
            <p className="text-sm font-semibold">{place.name}</p>
            <p className="text-xs text-gray-500">{place.address}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
