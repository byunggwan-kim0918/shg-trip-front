'use client';

import ItineraryListLoader from '@/components/dashboard/ItineraryListLoader';
import TripChat from '@/components/trip-chat/TripChat';

export default function TripsPage() {
  return <ItineraryListLoader empty={<TripChat focusSlot={null} />} />;
}
