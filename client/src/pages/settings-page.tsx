import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppBar } from "@/components/ui/app-bar";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { BellRing, Volume2, Vibrate, Bell, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { InsertSettings, Settings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  // Fetch user settings
  const { 
    data: settings, 
    isLoading: isSettingsLoading 
  } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  // State for local settings
  const [localSettings, setLocalSettings] = useState<Partial<InsertSettings>>({
    sirenEnabled: true,
    vibrationEnabled: true,
    popupAlertsEnabled: true,
    alertDistanceMeters: 500,
  });

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        sirenEnabled: settings.sirenEnabled,
        vibrationEnabled: settings.vibrationEnabled,
        popupAlertsEnabled: settings.popupAlertsEnabled,
        alertDistanceMeters: settings.alertDistanceMeters,
      });
    }
  }, [settings]);

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<InsertSettings>) => {
      const res = await apiRequest("PUT", "/api/settings", updatedSettings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (
    key: keyof InsertSettings,
    value: boolean | number
  ) => {
    const updatedSettings = {
      ...localSettings,
      [key]: value,
    };
    setLocalSettings(updatedSettings);
    
    // Throttle API calls by waiting a bit before saving
    setTimeout(() => {
      updateSettingsMutation.mutate(updatedSettings);
    }, 500);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen">
      <AppBar 
        onNotificationsClick={() => {}}
        onProfileClick={() => {}}
      />

      <main className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <h1 className="text-2xl font-bold">Settings</h1>

          {isSettingsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure how you want to be alerted</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BellRing className="h-5 w-5 text-gray-500" />
                      <Label htmlFor="popup-alerts">Popup Alerts</Label>
                    </div>
                    <Switch
                      id="popup-alerts"
                      checked={localSettings.popupAlertsEnabled}
                      onCheckedChange={(checked) => handleSettingChange("popupAlertsEnabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-5 w-5 text-gray-500" />
                      <Label htmlFor="sound-alerts">Sound Alerts</Label>
                    </div>
                    <Switch
                      id="sound-alerts"
                      checked={localSettings.sirenEnabled}
                      onCheckedChange={(checked) => handleSettingChange("sirenEnabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Vibrate className="h-5 w-5 text-gray-500" />
                      <Label htmlFor="vibration">Vibration</Label>
                    </div>
                    <Switch
                      id="vibration"
                      checked={localSettings.vibrationEnabled}
                      onCheckedChange={(checked) => handleSettingChange("vibrationEnabled", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alert Distance</CardTitle>
                  <CardDescription>Set how far ahead you want to be alerted</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="alert-distance">Distance (meters)</Label>
                      <span className="text-sm font-medium">
                        {localSettings.alertDistanceMeters} m
                      </span>
                    </div>
                    <Slider
                      id="alert-distance"
                      min={100}
                      max={2000}
                      step={100}
                      value={[localSettings.alertDistanceMeters || 500]}
                      onValueChange={(values) => handleSettingChange("alertDistanceMeters", values[0])}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email || "No email provided"}</p>
                    </div>
                    <Button variant="destructive" onClick={handleLogout}>
                      {logoutMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging out...
                        </>
                      ) : "Log Out"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
