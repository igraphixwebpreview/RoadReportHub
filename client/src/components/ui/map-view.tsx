/// <reference types="google.maps" />

import { useEffect, useState, useRef } from "react";
import { Loader2, Plus, Minus, Navigation2, MapPin } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Incident } from "@/shared/schema";
import { playIncidentNotificationSound } from "@/lib/sound";

interface MapViewProps {
  incidents: Incident[];
  onIncidentClick: (incident: Incident) => void;
  onMapClick?: (lat: number, lng: number) => void;
  children?: React.ReactNode;
}

// Google Maps type definitions
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

export function MapView({ incidents, onIncidentClick, onMapClick, children }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [markers, setMarkers] = useState<Map<string, google.maps.Marker>>(new Map());
  const [infoWindows, setInfoWindows] = useState<Map<string, google.maps.InfoWindow>>(new Map());
  const [lastIncidentIds, setLastIncidentIds] = useState<Set<string>>(new Set());
  const { latitude, longitude, isLoading, error } = useGeolocation({ watchPosition: true });
  
  // St. Lucia coordinates
  const stLuciaCoords = {
    lat: 13.9094,
    lng: -60.9789
  };
  
  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current) return;
      
      const initialPosition = latitude && longitude 
        ? { lat: latitude, lng: longitude }
        : stLuciaCoords;
      
      const mapOptions: google.maps.MapOptions = {
        center: initialPosition,
        zoom: 13,
        disableDefaultUI: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        }
      };
      
      const newMap = new google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      
      // Create user position marker if user location is available
      if (latitude && longitude) {
        const marker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: newMap,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#2196f3",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        setUserMarker(marker);
      }
      
      // Add click listener for dropping pins
      if (onMapClick) {
        newMap.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onMapClick(e.latLng.lat(), e.latLng.lng());
          }
        });
      }
    };
    
    // Load Google Maps API
    if (!window.google) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&callback=initMap&libraries=places`;
      script.async = true;
      script.defer = true;
      window.initMap = initializeMap;
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
        window.initMap = () => {};
      };
    } else {
      // Initialize map even without user location
      initializeMap();
    }
  }, [latitude, longitude, onMapClick]);
  
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
    
    const currentIncidentIds = new Set(incidents.map(incident => incident.id));
    const newIncidents = incidents.filter(incident => !lastIncidentIds.has(incident.id));
    
    // Remove old markers
    markers.forEach((marker, id) => {
      if (!currentIncidentIds.has(id)) {
        marker.setMap(null);
      }
    });
    
    const newMarkers = new Map(markers);
    const newInfoWindows = new Map(infoWindows);
    
    // Play notification sounds for new incidents
    newIncidents.forEach(incident => {
      playIncidentNotificationSound(incident.type as 'roadblock' | 'accident');
      
      // Pan to the new incident
      if (newIncidents.length === 1) {
        const lat = parseFloat(incident.latitude);
        const lng = parseFloat(incident.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.panTo({ lat, lng });
          map.setZoom(16);
        }
      }
    });
    
    // Add markers for each incident
    incidents.forEach((incident) => {
      const lat = parseFloat(incident.latitude);
      const lng = parseFloat(incident.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        animation: newIncidents.includes(incident) ? google.maps.Animation.DROP : null,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: incident.type === "roadblock" ? "#f44336" : "#ff9800",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: incident.type === "roadblock" ? "Roadblock" : "Accident",
      });
      
      // Create info window for each incident
      const infoWindowContent = `
        <div style="padding: 8px; font-weight: bold; text-align: center;">
          ${incident.type === "roadblock" ? "🚧 Roadblock" : "🚨 Accident"}
        </div>
      `;
      
      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
        pixelOffset: new google.maps.Size(0, -10)
      });
      
      // Display info window for new incidents
      if (newIncidents.includes(incident)) {
        infoWindow.open(map, marker);
        
        // Auto-close the info window after 10 seconds
        setTimeout(() => {
          infoWindow.close();
        }, 10000);
      }
      
      // Add click event to show info
      marker.addListener("click", () => {
        // Show the info window if it's closed
        if (!infoWindow.get('map')) {
          infoWindow.open(map, marker);
        }
        onIncidentClick(incident);
      });
      
      newMarkers.set(incident.id, marker);
      newInfoWindows.set(incident.id, infoWindow);
    });
    
    setMarkers(newMarkers);
    setInfoWindows(newInfoWindows);
    setLastIncidentIds(currentIncidentIds);
    
    return () => {
      newMarkers.forEach((marker) => {
        marker.setMap(null);
      });
      newInfoWindows.forEach((infoWindow) => {
        infoWindow.close();
      });
    };
  }, [incidents, map, onIncidentClick, lastIncidentIds]);
  
  // Map controls
  const handleZoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom() ?? 13;
      map.setZoom(currentZoom + 1);
    }
  };
  
  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() ?? 13;
      map.setZoom(currentZoom - 1);
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
          className="bg-white/80 backdrop-blur-md rounded-full p-2.5 shadow-lg hover:bg-white/90 transition-all duration-200 border border-white/20"
        >
          <Plus className="text-gray-700" size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white/80 backdrop-blur-md rounded-full p-2.5 shadow-lg hover:bg-white/90 transition-all duration-200 border border-white/20"
        >
          <Minus className="text-gray-700" size={20} />
        </button>
        <button
          onClick={handleCenterMap}
          className="bg-white/80 backdrop-blur-md rounded-full p-2.5 shadow-lg hover:bg-white/90 transition-all duration-200 border border-white/20"
        >
          <Navigation2 className="text-gray-700" size={20} />
        </button>
      </div>
      
      {children}
    </div>
  );
}
