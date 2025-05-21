import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MapPin, Check, HardHat, Car } from "lucide-react";
import { Incident } from "@/shared/schema";
import { useIncidents } from "@/hooks/use-incidents";
import { formatDistanceToNow } from "date-fns";

interface IncidentDetailModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentDetailModal({ incident, isOpen, onClose }: IncidentDetailModalProps) {
  const { verifyIncidentMutation } = useIncidents();

  if (!incident) return null;

  const handleConfirm = () => {
    verifyIncidentMutation.mutate({
      incidentId: Number(incident.id),
      action: 'confirm'
    });
  };

  const handleDismiss = () => {
    verifyIncidentMutation.mutate({
      incidentId: Number(incident.id),
      action: 'dismiss'
    });
  };

  const formatReportTime = (dateString: string | Date | { seconds: number; nanoseconds: number }) => {
    try {
      let date: Date;
      
      if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else if (dateString instanceof Date) {
        date = dateString;
      } else if (dateString && typeof dateString === 'object' && 'seconds' in dateString) {
        // Handle Firebase Timestamp
        date = new Date(dateString.seconds * 1000);
      } else {
        return 'Unknown time';
      }

      if (isNaN(date.getTime())) {
        return 'Unknown time';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown time';
    }
  };

  const isRoadblock = incident.type === "roadblock";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Incident Details
          </DialogTitle>
        </DialogHeader>

        {incident && (
          <div className="space-y-4">
            {/* Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img
                src={incident.imageUrl}
                alt={incident.type}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-4 pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center">
                    {isRoadblock ? (
                      <HardHat className="h-5 w-5 text-red-600 mr-1" />
                    ) : (
                      <Car className="h-5 w-5 text-orange-500 mr-1" />
                    )}
                    <h2 className="text-xl font-semibold">
                      {isRoadblock ? "Roadblock" : "Accident"}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500">
                    Reported {formatReportTime(incident.reportedAt)}
                  </p>
                </div>
              </div>
              
              {/* Location */}
              <div className="bg-gray-50/80 backdrop-blur-sm p-4 rounded-xl mb-4 border border-gray-100/50">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p className="text-sm text-gray-500">
                      {incident.locationName || `${incident.latitude}, ${incident.longitude}`}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              {incident.notes && (
                <div className="bg-gray-50/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100/50">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{incident.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
