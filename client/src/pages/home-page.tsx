import { useState } from "react";
import { HardHat, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/ui/map-view";
import { AppBar } from "@/components/ui/app-bar";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { ReportIncidentModal } from "@/components/report-incident-modal";
import { IncidentDetailModal } from "@/components/incident-detail-modal";
import { NotificationsModal } from "@/components/notifications-modal";
import { ProximityAlert } from "@/components/proximity-alert";
import { useIncidents } from "@/hooks/use-incidents";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Incident, IncidentType } from "@shared/schema";

export default function HomePage() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<IncidentType | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { incidents, isLoading } = useIncidents();
  const { latitude, longitude } = useGeolocation({ watchPosition: true });

  const handleReportClick = (type: IncidentType) => {
    setReportType(type);
    setReportModalOpen(true);
  };

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <AppBar
        onNotificationsClick={() => setNotificationsOpen(true)}
        onProfileClick={() => {}}
      />

      <main className="flex-1 relative overflow-hidden">
        <MapView
          incidents={incidents || []}
          onIncidentClick={handleIncidentClick}
        >
          <ProximityAlert
            incidents={incidents || []}
            alertDistanceMeters={500}
          />
        </MapView>

        {/* Action Buttons */}
        <div className="absolute bottom-24 right-4 flex flex-col space-y-4">
          <Button
            onClick={() => handleReportClick("accident")}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center"
          >
            <Car className="h-5 w-5 mr-2" />
            Report Accident
          </Button>
          <Button
            onClick={() => handleReportClick("roadblock")}
            className="bg-primary hover:bg-primary/90 text-white rounded-full flex items-center"
          >
            <HardHat className="h-5 w-5 mr-2" />
            Report Roadblock
          </Button>
        </div>
      </main>

      <BottomNavigation />

      {/* Modals */}
      <ReportIncidentModal
        isOpen={reportModalOpen}
        incidentType={reportType}
        onClose={() => setReportModalOpen(false)}
      />

      <IncidentDetailModal
        isOpen={detailModalOpen}
        incident={selectedIncident}
        onClose={() => setDetailModalOpen(false)}
      />

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
