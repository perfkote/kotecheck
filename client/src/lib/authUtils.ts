import type { SessionUser } from "@shared/schema";

// Permission Model:
// - Admin: Full access to everything
// - Manager: Estimates only (create/update/delete) + Services (read-only)

export function isAdmin(user: SessionUser | undefined | null): boolean {
  if (!user) return false;
  return user.role === "admin";
}

export function isManager(user: SessionUser | undefined | null): boolean {
  if (!user) return false;
  return user.role === "manager";
}

// Dashboard Access: Admin only
export function canAccessDashboard(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

// Estimates: Admin and Manager can manage
export function canAccessEstimates(user: SessionUser | undefined | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager";
}

export function canCreateEstimates(user: SessionUser | undefined | null): boolean {
  return canAccessEstimates(user);
}

export function canUpdateEstimates(user: SessionUser | undefined | null): boolean {
  return canAccessEstimates(user);
}

export function canDeleteEstimates(user: SessionUser | undefined | null): boolean {
  return canAccessEstimates(user);
}

// Services: Admin and Manager can read, only Admin can manage
export function canAccessServices(user: SessionUser | undefined | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager";
}

export function canCreateServices(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canUpdateServices(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canDeleteServices(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

// Customers: Admin only
export function canAccessCustomers(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canCreateCustomers(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canUpdateCustomers(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canDeleteCustomers(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

// Jobs: Admin only
export function canAccessJobs(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canCreateJobs(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canUpdateJobs(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canDeleteJobs(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

// Notes: Admin only
export function canAccessNotes(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canCreateNotes(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canUpdateNotes(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canDeleteNotes(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

// Users: Admin only
export function canAccessUsers(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canCreateUsers(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canUpdateUsers(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function canDeleteUsers(user: SessionUser | undefined | null): boolean {
  return isAdmin(user);
}

export function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
  };
  return roleNames[role] || role;
}
