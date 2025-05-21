import { useState, useEffect } from "react";
import { MapView } from "@/components/ui/map-view";
import { Button } from "@/components/ui/button";
import { AppBar } from "@/components/ui/app-bar";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { IncidentDetailModal } from "@/components/incident-detail-modal";
import { ReportIncidentModal } from "@/components/report-incident-modal";
import { useIncidents } from "@/hooks/use-incidents";
import { Incident, IncidentType } from "@/shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, Car, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const { user } = useAuth();
  const { incidents, isLoading } = useIncidents();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedIncidentType, setSelectedIncidentType] = useState<IncidentType | null>(null);
  const [showAddReportLabel, setShowAddReportLabel] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAddReportLabel(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (pulse) {
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [pulse]);

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailModalOpen(true);
  };

  const handleReportTypeSelect = (type: IncidentType) => {
    setSelectedIncidentType(type);
    setReportModalOpen(true);
  };

  const handleReportClose = () => {
    setReportModalOpen(false);
    setSelectedLocation(null);
    setSelectedIncidentType(null);
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    setPulse(true);
    // Let the dropdown open as usual
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen">
      <AppBar />
      
      <main className="flex-1 relative">
        <MapView 
          incidents={incidents} 
          onIncidentClick={handleIncidentClick}
        >
          {/* Report Button */}
          <div className="absolute bottom-32 right-4 flex flex-row items-center">
            {showAddReportLabel && (
              <span
                className="mr-3 text-sm text-gray-700 bg-white/80 px-3 py-1 rounded-full shadow backdrop-blur-md border border-gray-200/50 font-medium"
              >
                Add report
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={`w-14 h-14 rounded-full bg-primary/90 hover:bg-primary text-white shadow-lg backdrop-blur-md border border-primary/20 flex items-center justify-center transition-transform duration-150 active:scale-95 ${pulse ? 'pulse-once' : ''}`}
                  title="Report Incident"
                  onClick={handlePlusClick}
                >
                  <Plus className="h-7 w-7" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 p-2 rounded-xl shadow-lg"
                side="top"
                sideOffset={8}
              >
                <DropdownMenuItem
                  onClick={() => handleReportTypeSelect("accident")}
                  className="flex items-center gap-3 text-orange-500 focus:text-orange-500 p-3 rounded-lg hover:bg-orange-50 focus:bg-orange-50 transition-transform duration-150 active:scale-95"
                >
                  <Car className="h-5 w-5" />
                  <span className="text-base font-medium">Report Accident</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleReportTypeSelect("roadblock")}
                  className="flex items-center gap-3 text-primary focus:text-primary p-3 rounded-lg hover:bg-primary/10 focus:bg-primary/10 transition-transform duration-150 active:scale-95"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-base font-medium">Report Roadblock</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </MapView>

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />

      {/* Modals */}
      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />

      <ReportIncidentModal
        isOpen={reportModalOpen}
        incidentType={selectedIncidentType}
        onClose={handleReportClose}
        initialLocation={selectedLocation}
      />
    </div>
  );
}
