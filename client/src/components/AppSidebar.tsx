import { Users, Briefcase, FileText, StickyNote, LayoutDashboard, Settings, Shield } from "lucide-react";
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
  canAccessUsers 
} from "@/lib/authUtils";
import logoImage from "@assets/Wordpress Transparent_1762832579683.png";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6">
            <img 
              src={logoImage} 
              alt="Coat Check" 
              className="w-full h-auto"
              data-testid="img-logo"
            />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {canAccessDashboard(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/"}>
                    <Link href="/" data-testid="link-analytic center">
                      <LayoutDashboard />
                      <span>Analytic Center</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessCustomers(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/customers"}>
                    <Link href="/customers" data-testid="link-customers">
                      <Users />
                      <span>Customers</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessJobs(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/jobs"}>
                    <Link href="/jobs" data-testid="link-jobs">
                      <Briefcase />
                      <span>Jobs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessServices(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/services"}>
                    <Link href="/services" data-testid="link-services">
                      <Settings />
                      <span>Services</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/estimates"}>
                  <Link href="/estimates" data-testid="link-estimates">
                    <FileText />
                    <span>Estimates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {canAccessNotes(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/notes"}>
                    <Link href="/notes" data-testid="link-notes">
                      <StickyNote />
                      <span>Notes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {canAccessUsers(user) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/users"}>
                    <Link href="/users" data-testid="link-users">
                      <Shield />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-center p-2">
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
