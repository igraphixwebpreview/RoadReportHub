import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import TimelinePage from "@/pages/timeline-page";
import SettingsPage from "@/pages/settings-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { NotificationsProvider } from "@/hooks/use-notifications";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/timeline" component={TimelinePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/help">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Help & Support</h1>
          <p>This page is under construction.</p>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
