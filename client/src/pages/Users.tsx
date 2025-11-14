import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { canAccessUsers } from "@/lib/authUtils";
import type { User, InsertUser } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getRoleName } from "@/lib/authUtils";
import { Badge } from "@/components/ui/badge";
import { Shield, Users as UsersIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserForm } from "@/components/UserForm";

export default function Users() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Redirect non-admins away from this page
  useEffect(() => {
    if (user && !canAccessUsers(user)) {
      setLocation("/estimates");
    }
  }, [user, setLocation]);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: canAccessUsers(user),
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      return await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      toast({
        title: "User Created",
        description: "New user has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to update role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = async (data: InsertUser) => {
    await createUserMutation.mutateAsync(data);
  };

  if (!canAccessUsers(user)) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          Only administrators can access user management.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">User Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          data-testid="button-new-user"
        >
          <Plus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {users.length === 0 ? (
          <Card className="p-12 text-center">
            <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No users found</p>
          </Card>
        ) : (
          users.map((user) => (
            <Card 
              key={user.id}
              className="p-4"
              data-testid={`card-user-${user.id}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-base" data-testid={`text-user-name-mobile-${user.id}`}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid={`text-user-email-mobile-${user.id}`}>
                    {user.email}
                  </div>
                </div>
                <div>
                  {user.isLocalAdmin === 1 ? (
                    <Badge variant="secondary" data-testid={`badge-type-mobile-${user.id}`}>
                      Local Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" data-testid={`badge-type-mobile-${user.id}`}>
                      OAuth User
                    </Badge>
                  )}
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-2">
                  Role {updateRoleMutation.isPending && user.id === updateRoleMutation.variables?.userId && "(updating...)"}
                </div>
                {user.isLocalAdmin === 1 ? (
                  <Badge variant="default" data-testid={`badge-role-mobile-${user.id}`}>
                    {getRoleName(user.role)}
                  </Badge>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(role) =>
                        updateRoleMutation.mutate({ userId: user.id, role })
                      }
                      disabled={updateRoleMutation.isPending && user.id === updateRoleMutation.variables?.userId}
                    >
                      <SelectTrigger className="w-full min-h-[44px]" data-testid={`select-role-mobile-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                  <TableCell className="font-medium" data-testid={`text-user-name-${user.id}`}>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell data-testid={`text-user-email-${user.id}`}>{user.email}</TableCell>
                  <TableCell>
                    {user.isLocalAdmin === 1 ? (
                      <Badge variant="default" data-testid={`badge-role-${user.id}`}>
                        {getRoleName(user.role)}
                      </Badge>
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(role) =>
                          updateRoleMutation.mutate({ userId: user.id, role })
                        }
                        disabled={updateRoleMutation.isPending && user.id === updateRoleMutation.variables?.userId}
                      >
                        <SelectTrigger className="w-40" data-testid={`select-role-${user.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isLocalAdmin === 1 ? (
                      <Badge variant="secondary" data-testid={`badge-type-${user.id}`}>Local Admin</Badge>
                    ) : (
                      <Badge variant="outline" data-testid={`badge-type-${user.id}`}>OAuth User</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreateUser}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
