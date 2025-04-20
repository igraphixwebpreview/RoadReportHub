import { useRef, useState, useEffect } from "react";
import { Camera, X, MapPin } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useIncidents } from "@/hooks/use-incidents";
import { IncidentType } from "@shared/schema";

interface ReportIncidentModalProps {
  isOpen: boolean;
  incidentType: IncidentType | null;
  onClose: () => void;
}

export function ReportIncidentModal({ isOpen, incidentType, onClose }: ReportIncidentModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { latitude, longitude, isLoading: isLocationLoading } = useGeolocation();
  const { reportIncidentMutation } = useIncidents();

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !photo) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const resetPhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const handleSubmit = () => {
    if (!latitude || !longitude || !photo || !incidentType) return;
    
    reportIncidentMutation.mutate({
      type: incidentType,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      imageUrl: photo,
      notes: notes,
      locationName: "Current Location", // This would be replaced with reverse geocoding
    });
    
    // Close modal and reset state
    onClose();
    setPhoto(null);
    setNotes("");
  };

  const getTitle = () => {
    if (!incidentType) return "Report Incident";
    return incidentType === "roadblock" ? "Report Roadblock" : "Report Accident";
  };

  const isSubmitDisabled = !photo || !latitude || !longitude || reportIncidentMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Camera/Preview */}
          <div className="rounded-lg overflow-hidden bg-gray-100 aspect-video relative">
            {!photo ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                {!streamRef.current && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Camera className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500">Take a photo of the incident</p>
                  </div>
                )}
              </>
            ) : (
              <img 
                src={photo} 
                alt="Captured" 
                className="w-full h-full object-cover" 
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera button */}
          <div className="flex justify-center">
            {!photo ? (
              <Button 
                onClick={takePhoto} 
                variant="secondary" 
                className="rounded-full h-12 w-12"
              >
                <Camera className="h-6 w-6" />
              </Button>
            ) : (
              <Button 
                onClick={resetPhoto} 
                variant="outline" 
                className="rounded-full"
              >
                Retake Photo
              </Button>
            )}
          </div>

          {/* Location */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium">Current Location</h3>
                {isLocationLoading ? (
                  <p className="text-sm text-gray-500">Getting your location...</p>
                ) : latitude && longitude ? (
                  <p className="text-sm text-gray-500">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Unable to get location</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="notes">
              Additional Notes (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Describe the situation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitDisabled}
            className={isSubmitDisabled ? "opacity-50" : ""}
          >
            {reportIncidentMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
