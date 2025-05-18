import { createContext, useContext, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string | Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  refresh: () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    // Normalize timestamps
    const normalized = data.map((n: any) => ({
      ...n,
      timestamp: typeof n.timestamp === "string"
        ? n.timestamp
        : n.timestamp?.toDate
          ? n.timestamp.toDate().toISOString()
          : new Date().toISOString()
    }));
    setNotifications(normalized);
    setUnreadCount(normalized.length);
    console.log("All notifications:", normalized);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, refresh: fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
} 