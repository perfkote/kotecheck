import type { User } from "@shared/schema";

export function canCreateCustomers(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canCreateJobs(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canUpdateJobs(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canDeleteJobs(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canCreateEstimates(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.role === "employee" || user.isLocalAdmin === 1;
}

export function canUpdateEstimates(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.role === "employee" || user.isLocalAdmin === 1;
}

export function canDeleteEstimates(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.role === "employee" || user.isLocalAdmin === 1;
}

export function canAccessJobs(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canAccessCustomers(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canAccessServices(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canAccessUsers(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.isLocalAdmin === 1;
}

export function canAccessDashboard(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canCreateServices(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canDeleteNotes(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function isAdmin(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.isLocalAdmin === 1;
}

export function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: "Administrator",
    manager: "Manager",
    employee: "Employee",
    "read-only": "Read-Only",
  };
  return roleNames[role] || role;
}
