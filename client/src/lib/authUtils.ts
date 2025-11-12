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
  return user.role !== "read-only";
}

export function canDeleteJobs(user: User | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "manager" || user.isLocalAdmin === 1;
}

export function canCreateEstimates(user: User | undefined): boolean {
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
