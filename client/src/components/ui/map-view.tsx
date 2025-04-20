import { useEffect, useState, useRef } from "react";
import { Loader2, Plus, Minus, Navigation2 } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Incident } from "@shared/schema";

interface MapViewProps {
  incidents: Incident[];
  onIncidentClick: (incident: Incident) => void;
  children?: React.ReactNode;
}

// Google Maps type definitions
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function MapView({ incidents, onIncidentClick, children }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<Map<number, google.maps.Marker>>(new Map());
  const { latitude, longitude, isLoading, error } = useGeolocation({ watchPosition: true });
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  
  // St. Lucia coordinates
  const stLuciaCoords = {
    lat: 13.9094,
    lng: -60.9789
  };
  
  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current) return;
      
      // Use user location if available, otherwise default to St. Lucia
      const center = latitude && longitude 
        ? { lat: latitude, lng: longitude }
        : stLuciaCoords;
      
      const mapOptions = {
        center: center,
        zoom: 13,
        disableDefaultUI: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      };
      
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      
      // Create user position marker if user location is available
      if (latitude && longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: newMap,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#2196f3",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        setUserMarker(marker);
      }
    };
    
    // Load Google Maps API
    if (!window.google) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      window.initMap = initializeMap;
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
        delete window.initMap;
      };
    } else {
      // Initialize map even without user location
      initializeMap();
    }
  }, [latitude, longitude]);
  
  // Update user position as location changes
  useEffect(() => {
    if (map && userMarker && latitude && longitude) {
      const newPosition = { lat: latitude, lng: longitude };
      userMarker.setPosition(newPosition);
      map.panTo(newPosition);
    }
  }, [latitude, longitude, map, userMarker]);
  
  // Update incident markers when incidents change
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    
    const newMarkers = new Map();
    
    // Add markers for each incident
    incidents.forEach((incident) => {
      const lat = parseFloat(incident.latitude);
      const lng = parseFloat(incident.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: incident.type === "roadblock" ? "#f44336" : "#ff9800",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: incident.type === "roadblock" ? "Roadblock" : "Accident",
      });
      
      marker.addListener("click", () => {
        onIncidentClick(incident);
      });
      
      newMarkers.set(incident.id, marker);
    });
    
    setMarkers(newMarkers);
    
    return () => {
      newMarkers.forEach((marker) => {
        marker.setMap(null);
      });
    };
  }, [incidents, map, onIncidentClick]);
  
  // Map controls
  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };
  
  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };
  
  const handleCenterMap = () => {
    if (map) {
      // Center to user location if available, otherwise to St. Lucia
      if (latitude && longitude) {
        map.panTo({ lat: latitude, lng: longitude });
      } else {
        map.panTo(stLuciaCoords);
      }
      map.setZoom(15);
    }
  };
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-error">Error loading map: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50 z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full"></div>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button
          onClick={handleZoomIn}
          className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
        >
          <Plus className="text-gray-700" size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
        >
          <Minus className="text-gray-700" size={20} />
        </button>
        <button
          onClick={handleCenterMap}
          className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
        >
          <Navigation2 className="text-gray-700" size={20} />
        </button>
      </div>
      
      {children}
    </div>
  );
}
