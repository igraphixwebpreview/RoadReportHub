import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MapPin, Check, HardHat, Car } from "lucide-react";
import { Incident } from "@shared/schema";
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
      incidentId: incident.id,
      action: 'confirm'
    });
  };

  const handleDismiss = () => {
    verifyIncidentMutation.mutate({
      incidentId: incident.id,
      action: 'dismiss'
    });
  };

  const formatReportTime = (dateString: Date) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const isRoadblock = incident.type === "roadblock";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="relative">
          {/* Incident Image */}
          <img 
            src={incident.imageUrl} 
            alt={incident.type} 
            className="w-full h-48 object-cover"
          />
          
          <div className="p-4 pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center">
                  {isRoadblock ? (
                    <HardHat className="h-5 w-5 text-primary mr-1" />
                  ) : (
                    <Car className="h-5 w-5 text-orange-500 mr-1" />
                  )}
                  <h2 className="text-xl font-medium">
                    {isRoadblock ? "Roadblock" : "Accident"}
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Reported {formatReportTime(incident.reportedAt)}
                </p>
              </div>
              
              {/* Verification Status */}
              <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Verified ({incident.verifiedCount})
              </div>
            </div>
            
            {/* Location */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
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
              <div className="mb-6">
                <h3 className="font-medium mb-1">Notes</h3>
                <p className="text-sm text-gray-600">{incident.notes}</p>
              </div>
            )}
            
            {/* Verification Actions */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium mb-3">Is this still accurate?</h3>
              <div className="flex space-x-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleConfirm}
                  disabled={verifyIncidentMutation.isPending}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleDismiss}
                  disabled={verifyIncidentMutation.isPending}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Cleared
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
