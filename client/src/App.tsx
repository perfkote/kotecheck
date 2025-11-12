import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { getRoleName } from "@/lib/authUtils";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Jobs from "@/pages/Jobs";
import Services from "@/pages/Services";
import Estimates from "@/pages/Estimates";
import Notes from "@/pages/Notes";
import Users from "@/pages/Users";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/customers" component={Customers} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/services" component={Services} />
      <Route path="/estimates" component={Estimates} />
      <Route path="/notes" component={Notes} />
      <Route path="/users" component={Users} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b gap-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="scale-[2]" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium" data-testid="text-user-name">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground" data-testid="text-user-role">
                  {user?.role ? getRoleName(user.role) : ""}
                </p>
              </div>
              <Avatar data-testid="avatar-user">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                data-testid="button-logout"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-8">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

export default App;
