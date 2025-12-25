import { 
  Users, 
  Briefcase, 
  FileText, 
  StickyNote, 
  LayoutDashboard, 
  Settings, 
  Shield, 
  Package,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  canAccessDashboard, 
  canAccessCustomers, 
  canAccessJobs, 
  canAccessServices, 
  canAccessNotes,
  canAccessInventory,
  canAccessUsers 
} from "@/lib/authUtils";
import logoImage from "@assets/D5869495-F57C-4813-B71F-28380A406027_1763252519060.png";

// ============================================
// NAV ITEM COMPONENT
// ============================================

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: number;
  badgeVariant?: 'default' | 'warning' | 'success';
}

function NavItem({ href, icon: Icon, label, isActive, badge, badgeVariant = 'default' }: NavItemProps) {
  const badgeColors = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild 
        isActive={isActive}
        className={`
          group relative transition-all duration-200
          ${isActive 
            ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-[1px]' 
            : 'hover:bg-accent/50'
          }
        `}
      >
        <Link href={href}>
          <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
          <span className="flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <Badge 
              variant="secondary" 
              className={`ml-auto text-[10px] px-1.5 py-0 h-5 ${badgeColors[badgeVariant]}`}
            >
              {badge}
            </Badge>
          )}
          {isActive && (
            <ChevronRight className="w-4 h-4 text-primary opacity-50" />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ============================================
// MAIN SIDEBAR COMPONENT
// ============================================

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Fetch counts for badges
  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
    enabled: canAccessJobs(user),
  });

  const { data: estimates = [] } = useQuery<any[]>({
    queryKey: ["/api/estimates"],
  });

  // Calculate badge counts
  const activeJobsCount = jobs.filter(j => 
    j.status !== 'paid' && j.status !== 'finished'
  ).length;

  const pendingEstimatesCount = estimates.filter(e => 
    e.status === 'pending' || e.status === 'sent' || e.status === 'approved'
  ).length;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarContent className="bg-gradient-to-b from-background to-accent/20">
        {/* ============================================ */}
        {/* LOGO */}
        {/* ============================================ */}
        <SidebarGroup className="pb-0">
          <div className="px-4 py-4">
            <img 
              src={logoImage} 
              alt="Kote Check" 
              className="w-full h-auto max-w-[160px] mx-auto"
            />
          </div>
        </SidebarGroup>

        <SidebarSeparator className="mx-4" />

        {/* ============================================ */}
        {/* MAIN NAVIGATION */}
        {/* ============================================ */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {canAccessDashboard(user) && (
                <NavItem
                  href="/"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  isActive={location === "/"}
                />
              )}
              {canAccessJobs(user) && (
                <NavItem
                  href="/jobs"
                  icon={Briefcase}
                  label="Jobs"
                  isActive={location === "/jobs"}
                  badge={activeJobsCount}
                  badgeVariant={activeJobsCount > 10 ? 'warning' : 'default'}
                />
              )}
              <NavItem
                href="/estimates"
                icon={FileText}
                label="Estimates"
                isActive={location === "/estimates"}
                badge={pendingEstimatesCount}
                badgeVariant="success"
              />
              {canAccessCustomers(user) && (
                <NavItem
                  href="/customers"
                  icon={Users}
                  label="Customers"
                  isActive={location === "/customers"}
                />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ============================================ */}
        {/* MANAGEMENT */}
        {/* ============================================ */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {canAccessServices(user) && (
                <NavItem
                  href="/services"
                  icon={Settings}
                  label="Services"
                  isActive={location === "/services"}
                />
              )}
              {canAccessInventory(user) && (
                <NavItem
                  href="/inventory"
                  icon={Package}
                  label="Inventory"
                  isActive={location === "/inventory"}
                />
              )}
              {canAccessNotes(user) && (
                <NavItem
                  href="/notes"
                  icon={StickyNote}
                  label="Notes"
                  isActive={location === "/notes"}
                />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ============================================ */}
        {/* ADMIN */}
        {/* ============================================ */}
        {canAccessUsers(user) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2">
                <NavItem
                  href="/users"
                  icon={Shield}
                  label="Users"
                  isActive={location === "/users"}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <SidebarFooter className="border-t border-border/50 bg-accent/30">
        <div className="p-3 space-y-3">
          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
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

          {/* Actions Row */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex-1" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
