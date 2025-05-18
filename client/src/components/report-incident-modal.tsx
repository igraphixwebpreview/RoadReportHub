import { useRef, useState, useEffect } from "react";
import { Camera, X, MapPin, Video, Image, Loader2 } from "lucide-react";
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
import { toast } from "react-hot-toast";

export interface ReportIncidentModalProps {
  isOpen: boolean;
  incidentType: IncidentType | null;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number } | null;
}

export function ReportIncidentModal({ 
  isOpen, 
  incidentType, 
  onClose,
  initialLocation 
}: ReportIncidentModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(30);
  const [recordingTimer, setRecordingTimer] = useState<number | null>(null);
  const [mediaMode, setMediaMode] = useState<"photo" | "video">("photo");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { latitude, longitude, isLoading: isLocationLoading } = useGeolocation();
  const { reportIncidentMutation } = useIncidents();

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !photo && !video) {
      startCamera();
    }
    
    return () => {
      stopCamera();
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [isOpen]);

  // Update the useEffect for location
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get your location. Please enable location services.");
        }
      );
    }
  }, [initialLocation]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" },
        audio: mediaMode === "video" 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Unable to access camera. Please make sure you have granted camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const startRecording = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for better quality
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setVideo(url);
        stopCamera();
        setIsRecording(false);
        setRecordingTime(30);
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
      };

      // Request data every second to ensure we get the video data
      const timer = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Stop recording when we reach 0 seconds
            stopRecording();
            return 0;
          }
          return newTime;
        });
      }, 1000);
      setRecordingTimer(timer);

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
      } catch (err) {
        console.error('Error stopping recording:', err);
        toast.error('Failed to stop recording. Please try again.');
      }
    }
  };

  const resetMedia = () => {
    setPhoto(null);
    setVideo(null);
    setCameraError(null);
    startCamera();
  };

  const handleSubmit = () => {
    if (!latitude || !longitude || (!photo && !video) || !incidentType) return;
    
    reportIncidentMutation.mutate({
      type: incidentType,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      imageUrl: photo || video || "",
      notes: notes,
      locationName: "Current Location",
    }, {
      onSuccess: () => {
        onClose();
        setPhoto(null);
        setVideo(null);
        setNotes("");
        toast.success("Report submitted successfully!");
      },
      onError: () => {
        toast.error("Failed to submit report. Please try again.");
      }
    });
  };

  const getTitle = () => {
    if (!incidentType) return "Report Incident";
    return incidentType === "roadblock" ? "Report Roadblock" : "Report Accident";
  };

  const isSubmitDisabled = (!photo && !video) || !latitude || !longitude || reportIncidentMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Capture */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">Media</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMediaMode("photo");
                    resetMedia();
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    mediaMode === "photo" ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Image className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setMediaMode("video");
                    resetMedia();
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    mediaMode === "video" ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Video className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div 
              className={`relative aspect-video rounded-xl overflow-hidden border-2 border-dashed ${
                (photo || video) ? 'border-transparent' : 'border-gray-300'
              } bg-gray-50/50 backdrop-blur-sm`}
            >
              {photo ? (
                <>
                  <img 
                    src={photo} 
                    alt="Incident" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={resetMedia}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/60 transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : video ? (
                <>
                  <video 
                    src={video} 
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      setCameraError('Failed to play video. Please try recording again.');
                    }}
                  />
                  <button
                    onClick={resetMedia}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/60 transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                      <p className="mb-4">{cameraError}</p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <>
                      {isRecording && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
                          {recordingTime}s
                        </div>
                      )}
                      <button
                        onClick={mediaMode === "video" ? (isRecording ? stopRecording : startRecording) : takePhoto}
                        className={`absolute bottom-4 left-1/2 -translate-x-1/2 p-3 ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-white/90 hover:bg-white'
                        } backdrop-blur-md rounded-full shadow-lg transition-all duration-200`}
                      >
                        {mediaMode === "video" ? (
                          isRecording ? (
                            <div className="h-6 w-6 rounded-sm bg-white" />
                          ) : (
                            <Video className="h-6 w-6 text-gray-700" />
                          )
                        ) : (
                          <Camera className="h-6 w-6 text-gray-700" />
                        )}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-50/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100/50">
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
              className="bg-gray-50/80 backdrop-blur-sm border-gray-200/50 rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full"
          >
            {reportIncidentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
