import { useQuery, useMutation } from "@tanstack/react-query";
import { Incident, IncidentType, InsertIncident } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useIncidents() {
  const { toast } = useToast();

  // Get all active incidents
  const {
    data: incidents = [],
    isLoading,
    error,
  } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  // Get nearby incidents based on location
  const getNearbyIncidents = (lat: number, lng: number, radius: number = 5000) => {
    return useQuery<Incident[]>({
      queryKey: [`/api/incidents/nearby?lat=${lat}&lon=${lng}&radius=${radius}`],
    });
  };

  // Get user's reported incidents
  const getUserIncidents = () => {
    return useQuery<Incident[]>({
      queryKey: ["/api/user/incidents"],
    });
  };

  // Report a new incident
  const reportIncidentMutation = useMutation({
    mutationFn: async (newIncident: Omit<InsertIncident, "userId" | "reportedAt">) => {
      const res = await apiRequest("POST", "/api/incidents", newIncident);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/incidents"] });
      toast({
        title: "Report submitted",
        description: "Thank you for your contribution!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify an incident (confirm or dismiss)
  const verifyIncidentMutation = useMutation({
    mutationFn: async ({ incidentId, action }: { incidentId: number; action: 'confirm' | 'dismiss' }) => {
      const res = await apiRequest("POST", `/api/incidents/${incidentId}/verify`, { action });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      toast({
        title: "Verification submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to verify incident",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    incidents,
    isLoading,
    error,
    getNearbyIncidents,
    getUserIncidents,
    reportIncidentMutation,
    verifyIncidentMutation,
  };
}
