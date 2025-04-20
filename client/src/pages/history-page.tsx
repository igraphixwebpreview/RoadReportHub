import { useEffect } from "react";
import { useIncidents } from "@/hooks/use-incidents";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { AppBar } from "@/components/ui/app-bar";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  IncidentDetailModal
} from "@/components/incident-detail-modal";
import { Construction, Car, Loader2 } from "lucide-react";
import { Incident } from "@shared/schema";
import { useState } from "react";

export default function HistoryPage() {
  const { user } = useAuth();
  const { getUserIncidents } = useIncidents();
  const { data: userIncidents, isLoading } = getUserIncidents();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailModalOpen(true);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen">
      <AppBar 
        onNotificationsClick={() => {}}
        onProfileClick={() => {}}
      />

      <main className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Your Reports</h1>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userIncidents && userIncidents.length > 0 ? (
            <div className="space-y-4">
              {userIncidents.map((incident) => (
                <Card 
                  key={incident.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleIncidentClick(incident)}
                >
                  <div className="relative h-32">
                    <img 
                      src={incident.imageUrl} 
                      alt={incident.type} 
                      className="w-full h-full object-cover"
                    />
                    <div 
                      className={`absolute top-2 right-2 ${
                        incident.type === 'roadblock' ? 'bg-primary' : 'bg-orange-500'
                      } text-white py-1 px-2 rounded-full text-xs flex items-center`}
                    >
                      {incident.type === 'roadblock' ? (
                        <Construction className="h-3 w-3 mr-1" />
                      ) : (
                        <Car className="h-3 w-3 mr-1" />
                      )}
                      {incident.type === 'roadblock' ? 'Roadblock' : 'Accident'}
                    </div>
                    
                    <div className={`absolute bottom-0 inset-x-0 py-1 px-2 ${
                      incident.active 
                        ? 'bg-green-500 bg-opacity-80' 
                        : 'bg-gray-500 bg-opacity-80'
                    } text-white text-xs`}>
                      {incident.active ? 'Active' : 'Cleared'}
                    </div>
                  </div>
                  
                  <CardContent className="py-3">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 text-sm">
                        {formatDistanceToNow(new Date(incident.reportedAt), { addSuffix: true })}
                      </p>
                      <div className="flex items-center text-sm">
                        <div className="flex items-center mr-2 text-green-600">
                          <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 11L12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {incident.verifiedCount}
                        </div>
                        <div className="flex items-center text-red-600">
                          <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 16L12 11L17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {incident.dismissedCount}
                        </div>
                      </div>
                    </div>
                    
                    <p className="mt-1 text-sm">
                      {incident.locationName || `${incident.latitude}, ${incident.longitude}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <svg className="h-12 w-12 mx-auto text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" strokeWidth="2" />
                <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No reports yet</h3>
              <p className="text-gray-500 mt-2">
                When you report a roadblock or accident, it will appear here.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
      
      <IncidentDetailModal
        isOpen={detailModalOpen}
        incident={selectedIncident}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  );
}
