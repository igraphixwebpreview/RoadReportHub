import { Map, History, Settings, HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export function BottomNavigation() {
  const [location] = useLocation();
  
  const navItems = [
    { icon: Map, label: "Map", path: "/" },
    { icon: History, label: "History", path: "/history" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: HelpCircle, label: "Help", path: "/help" },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 z-20 pointer-events-none">
      <nav className="bg-white shadow-lg rounded-full mx-auto max-w-md pointer-events-auto">
        <div className="flex justify-around px-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <a className={`flex flex-col items-center py-3 px-4 ${
                  isActive 
                    ? "text-primary font-medium" 
                    : "text-gray-500 hover:text-gray-700"
                }`}>
                  <div className={`p-1.5 rounded-full ${isActive ? "bg-primary/10" : ""}`}>
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
  );
}
