import { AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Incident } from "@shared/schema";
import { useGeolocation } from "@/hooks/use-geolocation";

interface ProximityAlertProps {
  incidents: Incident[];
  alertDistanceMeters?: number;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula to calculate distance between two points
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function ProximityAlert({ incidents, alertDistanceMeters = 500 }: ProximityAlertProps) {
  const [nearbyIncident, setNearbyIncident] = useState<Incident | null>(null);
  const [visible, setVisible] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const { latitude, longitude } = useGeolocation({ watchPosition: true });

  useEffect(() => {
    if (!latitude || !longitude || !incidents.length) return;

    // Find closest incident within alert distance
    let closestIncident: Incident | null = null;
    let closestDistance = Infinity;

    incidents.forEach((incident) => {
      const incidentLat = parseFloat(incident.latitude);
      const incidentLon = parseFloat(incident.longitude);
      
      if (!isNaN(incidentLat) && !isNaN(incidentLon)) {
        const dist = calculateDistance(
          latitude,
          longitude,
          incidentLat,
          incidentLon
        );
        
        if (dist < alertDistanceMeters && dist < closestDistance) {
          closestDistance = dist;
          closestIncident = incident;
        }
      }
    });

    if (closestIncident) {
      setNearbyIncident(closestIncident);
      setDistance(Math.round(closestDistance));
      setVisible(true);
      
      // Play alert sound
      const audio = new Audio('/alert.mp3');
      audio.play().catch(err => {
        console.log('Audio playback failed:', err);
      });
      
      // Hide alert after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [latitude, longitude, incidents, alertDistanceMeters]);

  if (!visible || !nearbyIncident || distance === null) return null;

  return (
    <div className="fixed top-16 inset-x-0 mx-auto w-11/12 max-w-md z-20 animate-pulse">
      <div className={`rounded-lg shadow-lg flex items-center p-4 ${
        nearbyIncident.type === 'roadblock' ? 'bg-primary' : 'bg-orange-500'
      } text-white`}>
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold">
            {nearbyIncident.type === 'roadblock' ? 'Roadblock' : 'Accident'} Ahead!
          </h3>
          <p className="text-sm">
            {distance} meters ahead on {nearbyIncident.locationName || 'current road'}
          </p>
        </div>
        <button 
          className="p-1"
          onClick={() => setVisible(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
