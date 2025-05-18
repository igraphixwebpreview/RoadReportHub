import { useState } from "react";
import { Map, History, Settings, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { NotificationsModal } from "@/components/notifications-modal";
import { useNotifications } from "@/hooks/use-notifications";

export function BottomNavigation() {
  const [location] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();
  
  const navItems = [
    { icon: Map, label: "Map", path: "/" },
    { icon: History, label: "Timeline", path: "/timeline" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: Bell, label: "Updates", action: () => setShowNotifications(true) },
  ];
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 z-20 pointer-events-none">
        <nav className="bg-white/80 backdrop-blur-md shadow-lg rounded-2xl mx-auto max-w-md pointer-events-auto border border-white/20">
          <div className="flex justify-around px-2">
            {navItems.map((item) => {
              const isActive = item.path && location === item.path;
              return item.action ? (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`flex flex-col items-center py-3 px-4 transition-all duration-200 ${
                    isActive 
                      ? "text-primary font-medium" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-gray-100/50"
                  }`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs mt-1">{item.label}</span>
                  {unreadCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center border-2 border-white">{unreadCount}</span>)}
                </button>
              ) : (
                <Link key={item.path} href={item.path!}>
                  <a className={`flex flex-col items-center py-3 px-4 transition-all duration-200 ${
                    isActive 
                      ? "text-primary font-medium" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}>
                    <div className={`p-2 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-gray-100/50"
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-1">{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
}
