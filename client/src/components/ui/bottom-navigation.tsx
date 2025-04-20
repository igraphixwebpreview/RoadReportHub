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
    <nav className="bg-white shadow-lg border-t border-gray-200 z-10">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <a className={`flex flex-col items-center py-2 px-4 ${
                isActive ? "text-primary" : "text-gray-500"
              }`}>
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
