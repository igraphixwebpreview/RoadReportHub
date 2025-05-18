import { Menu, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "wouter";
import { useState } from "react";
import { NotificationsModal } from "@/components/notifications-modal";
import { useNotifications } from "@/hooks/use-notifications";

export function AppBar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-center relative">
        {/* Burger menu on the left */}
        <div className="absolute left-0 flex items-center h-full">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 text-gray-700 hover:text-primary focus:outline-none">
                <Menu className="h-7 w-7" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 p-4">
                <Link href="/">
                  <a className="block px-4 py-3 rounded-lg text-gray-800 hover:bg-primary/10 font-medium transition">Map</a>
                </Link>
                <Link href="/timeline">
                  <a className="block px-4 py-3 rounded-lg text-gray-800 hover:bg-primary/10 font-medium transition">Timeline</a>
                </Link>
                <Link href="/settings">
                  <a className="block px-4 py-3 rounded-lg text-gray-800 hover:bg-primary/10 font-medium transition">Settings</a>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        {/* Centered logo */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-xl font-bold text-gray-900 select-none">Road Report Hub</h1>
        </div>
        {/* Notifications bell on the right */}
        <div className="absolute right-0 flex items-center h-full">
          <button
            className="relative p-2 text-gray-700 hover:text-primary focus:outline-none"
            onClick={() => setShowNotifications(true)}
            aria-label="Show notifications"
          >
            <Bell className="h-7 w-7" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      </div>
    </div>
  );
}
