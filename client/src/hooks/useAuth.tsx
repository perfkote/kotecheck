import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
    staleTime: Infinity,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      window.location.href = "/api/logout";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout: logoutMutation.mutate,
  };
}

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === "admin" || user?.isLocalAdmin === 1;
}

export function useIsManagerOrAbove() {
  const { user } = useAuth();
  return user?.role === "admin" || user?.role === "manager" || user?.isLocalAdmin === 1;
}

export function useCanEdit() {
  const { user } = useAuth();
  return user?.role !== "read-only";
}
