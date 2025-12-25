import { useState, useEffect } from "react";
import { 
  Users, 
  Briefcase, 
  FileText, 
  StickyNote, 
  LayoutDashboard, 
  Settings, 
  Shield, 
  Package,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { 
  canAccessDashboard, 
  canAccessCustomers, 
  canAccessJobs, 
  canAccessServices, 
  canAccessNotes,
  canAccessInventory,
  canAccessUsers 
} from "@/lib/authUtils";

// Import both logo versions
import logoDark from "@assets/Kote_dark.png";
import logoLight from "@assets/Kote_light.png";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Track theme state for logo switching
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDark(document.documentElement.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <Sidebar>
      <SidebarContent>
        {/* Logo - switches based on theme */}
        <SidebarGroup>
          <div className="px-4 py-5">
            <img 
              src={isDark ? logoDark : logoLight} 
              alt="Kote Check" 
              className="w-full h-auto max-w-[160px] mx-auto"
              data-testid="img-logo"
            />
          </div>
        </SidebarGroup>

        {/* Main Navigation */}
        <SidebarGroup>
          <div className="px-4 pb-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Main
            </span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {canAccessDashboard(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/"}>
                    <Link href="/" data-testid="link-dashboard">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessJobs(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/jobs"}>
                    <Link href="/jobs" data-testid="link-jobs">
                      <Briefcase className="w-4 h-4" />
                      <span>Jobs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/estimates"}>
                  <Link href="/estimates" data-testid="link-estimates">
                    <FileText className="w-4 h-4" />
                    <span>Estimates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {canAccessCustomers(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/customers"}>
                    <Link href="/customers" data-testid="link-customers">
                      <Users className="w-4 h-4" />
                      <span>Customers</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup>
          <div className="px-4 pb-2 pt-4">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Manage
            </span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {canAccessServices(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/services"}>
                    <Link href="/services" data-testid="link-services">
                      <Settings className="w-4 h-4" />
                      <span>Services</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessInventory(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/inventory"}>
                    <Link href="/inventory" data-testid="link-inventory">
                      <Package className="w-4 h-4" />
                      <span>Inventory</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessNotes(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/notes"}>
                    <Link href="/notes" data-testid="link-notes">
                      <StickyNote className="w-4 h-4" />
                      <span>Notes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        {canAccessUsers(user) && (
          <SidebarGroup>
            <div className="px-4 pb-2 pt-4">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Admin
              </span>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/users"}>
                    <Link href="/users" data-testid="link-users">
                      <Shield className="w-4 h-4" />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="p-3 border-t">
          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          )}
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
