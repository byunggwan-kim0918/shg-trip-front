'use client';

import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';
import type { WizardPlace } from '@/lib/types/itinerary';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface PlaceMapProps {
  places: WizardPlace[];
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };

export default function PlaceMap({ places }: PlaceMapProps) {
  const center = places.length > 0
    ? { lat: places[0].latitude, lng: places[0].longitude }
    : SEOUL_CENTER;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        defaultCenter={center}
        defaultZoom={places.length > 0 ? 13 : 11}
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
      >
        {places.map((place, i) => (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.latitude, lng: place.longitude }}
          >
            <div
              className="flex items-center justify-center rounded-full text-white text-xs font-bold shadow-md border-2 border-white"
              style={{
                width: 28,
                height: 28,
                backgroundColor: '#3b82f6',
              }}
            >
              {i + 1}
            </div>
          </AdvancedMarker>
        ))}
      </GoogleMap>
    </APIProvider>
  );
}
