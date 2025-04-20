import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface AppBarProps {
  onNotificationsClick: () => void;
  onProfileClick: () => void;
}

export function AppBar({ onNotificationsClick, onProfileClick }: AppBarProps) {
  const { user } = useAuth();
  
  return (
    <div className="fixed top-0 left-0 right-0 px-4 pt-4 z-20 pointer-events-none">
      <header className="bg-primary shadow-lg rounded-full mx-auto max-w-md pointer-events-auto">
        <div className="px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-xl font-bold text-white">RoadBlock</h1>
          </div>
          
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="rounded-full text-white hover:bg-primary-light"
              onClick={onNotificationsClick}
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="rounded-full text-white hover:bg-primary-light"
              onClick={onProfileClick}
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}
