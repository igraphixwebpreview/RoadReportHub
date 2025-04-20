import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bell, HardHat, Car } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  type: "roadblock" | "accident" | "verification";
  title: string;
  description: string;
  timestamp: Date;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  // In a real app, this would come from an API call
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "roadblock",
      title: "Roadblock Reported",
      description: "New roadblock reported near your location",
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    },
    {
      id: 2,
      type: "accident",
      title: "Accident Cleared",
      description: "Your reported accident has been marked as cleared",
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    },
  ]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-200 mt-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="py-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex">
                  {notification.type === "roadblock" ? (
                    <Construction className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  ) : notification.type === "accident" ? (
                    <Car className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />
                  ) : (
                    <Bell className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm text-gray-600">{notification.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40">
            <Bell className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-gray-500">No notifications</p>
          </div>
        )}
        
        {notifications.length > 0 && (
          <div className="py-4 text-center text-gray-500 text-sm">
            No more notifications
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
