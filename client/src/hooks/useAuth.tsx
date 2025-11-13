import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import type { SessionUser, LoginCredentials } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<SessionUser>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest("POST", "/api/login", credentials);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
  };
}

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === "admin";
}

export function useIsManager() {
  const { user } = useAuth();
  return user?.role === "manager";
}

export function useIsManagerOrAbove() {
  const { user } = useAuth();
  return user?.role === "admin" || user?.role === "manager";
}

// General edit permission: Admin only (for most features)
// For estimates, use canManageEstimates() from authUtils instead
export function useCanEdit() {
  const { user } = useAuth();
  return user?.role === "admin";
}
