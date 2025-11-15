import { Switch, Route, Link, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { 
  getRoleName, 
  canAccessDashboard, 
  canAccessCustomers, 
  canAccessJobs, 
  canAccessServices, 
  canAccessEstimates, 
  canAccessNotes, 
  canAccessInventory,
  canAccessUsers 
} from "@/lib/authUtils";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Jobs from "@/pages/Jobs";
import Services from "@/pages/Services";
import Estimates from "@/pages/Estimates";
import Notes from "@/pages/Notes";
import Inventory from "@/pages/Inventory";
import Users from "@/pages/Users";
import Profile from "@/pages/Profile";
import AccessDenied from "@/pages/AccessDenied";

// Route guard component
function ProtectedRoute({ 
  component: Component, 
  canAccess 
}: { 
  component: React.ComponentType; 
  canAccess: (user: any) => boolean;
}) {
  const { user } = useAuth();
  
  if (!canAccess(user)) {
    return <AccessDenied />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} canAccess={canAccessDashboard} />}
      </Route>
      <Route path="/customers">
        {() => <ProtectedRoute component={Customers} canAccess={canAccessCustomers} />}
      </Route>
      <Route path="/jobs">
        {() => <ProtectedRoute component={Jobs} canAccess={canAccessJobs} />}
      </Route>
      <Route path="/services">
        {() => <ProtectedRoute component={Services} canAccess={canAccessServices} />}
      </Route>
      <Route path="/estimates" component={Estimates} />
      <Route path="/notes">
        {() => <ProtectedRoute component={Notes} canAccess={canAccessNotes} />}
      </Route>
      <Route path="/inventory">
        {() => <ProtectedRoute component={Inventory} canAccess={canAccessInventory} />}
      </Route>
      <Route path="/users">
        {() => <ProtectedRoute component={Users} canAccess={canAccessUsers} />}
      </Route>
      <Route path="/profile" component={Profile} />
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
    ? user.username.substring(0, 2).toUpperCase()
    : "U";

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b gap-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="scale-[2]" />
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <div className="flex items-center gap-3 cursor-pointer hover-elevate rounded-md p-2" data-testid="link-profile">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium" data-testid="text-user-name">
                      {user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-user-role">
                      {user?.role ? getRoleName(user.role) : ""}
                    </p>
                  </div>
                  <Avatar data-testid="avatar-user">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
              </Link>
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
  const { isAuthenticated, isLoading, error } = useAuth();

  // Only show loading if we're actually loading and haven't received a 401 error
  if (isLoading && !error) {
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
    return <Login />;
  }

  return <AuthenticatedApp />;
}

export default App;
