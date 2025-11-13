import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Customer, InsertCustomer } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { canCreateCustomers, canAccessCustomers } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerForm } from "@/components/CustomerForm";
import { Plus, Search, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface CustomerWithMetrics extends Customer {
  totalSpent: number;
  activeJobsCount: number;
  totalJobsCount: number;
}

export default function Customers() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const { toast } = useToast();

  // Redirect employees away from this page
  useEffect(() => {
    if (user && !canAccessCustomers(user)) {
      setLocation("/estimates");
    }
  }, [user, setLocation]);

  const { data: customers = [], isLoading } = useQuery<CustomerWithMetrics[]>({
    queryKey: ["/api/customers/metrics"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCustomer) =>
      apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/metrics"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertCustomer }) =>
      apiRequest("PATCH", `/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/metrics"] });
      setEditingCustomer(null);
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/metrics"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to delete customer";
      
      // Parse error message from API response
      if (error?.message) {
        try {
          // Error format is "STATUS_CODE: {json}"
          const jsonPart = error.message.split(': ').slice(1).join(': ');
          const parsed = JSON.parse(jsonPart);
          errorMessage = parsed.error || errorMessage;
        } catch {
          // If parsing fails, use the raw message
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Cannot Delete Customer",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers
    .filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database</p>
        </div>
        {canCreateCustomers(user) && (
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-customer">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-customers"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc" data-testid="sort-name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc" data-testid="sort-name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="newest" data-testid="sort-newest">Newest First</SelectItem>
            <SelectItem value="oldest" data-testid="sort-oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        {/* Header Row */}
        <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 p-4 bg-muted/50 border-b font-medium text-sm">
          <div>Name</div>
          <div>Contact</div>
          <div>Customer Since</div>
          <div>Total Spent</div>
          <div>Active Jobs</div>
          <div>Total Jobs</div>
          <div className="w-12"></div>
        </div>

        {/* Customer Rows */}
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 p-4 border-b last:border-b-0 hover-elevate cursor-pointer transition-all"
            data-testid={`row-customer-${customer.id}`}
            onClick={() => setEditingCustomer(customer)}
          >
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-muted-foreground">
              <div>{customer.phone || '—'}</div>
              {customer.email && <div className="text-xs">{customer.email}</div>}
            </div>
            <div className="text-sm">
              {new Date(customer.createdAt).toLocaleDateString()}
            </div>
            <div className="text-sm font-medium">
              ${customer.totalSpent.toFixed(2)}
            </div>
            <div className="text-sm">
              {customer.activeJobsCount}
            </div>
            <div className="text-sm">
              {customer.totalJobsCount || 0}
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" data-testid={`button-menu-${customer.id}`}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    data-testid="menu-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCustomer(customer);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    data-testid="menu-view-jobs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/jobs?customer=${encodeURIComponent(customer.name)}`);
                    }}
                  >
                    View Jobs
                  </DropdownMenuItem>
                  {canCreateCustomers(user) && (
                    <DropdownMenuItem 
                      className="text-destructive" 
                      data-testid="menu-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(customer.id);
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              defaultValues={{
                name: editingCustomer.name,
                email: editingCustomer.email || "",
                phone: editingCustomer.phone || "",
                address: editingCustomer.address || "",
                projectList: editingCustomer.projectList || "",
              }}
              onSubmit={(data) => updateMutation.mutate({ id: editingCustomer.id, data })}
              onCancel={() => setEditingCustomer(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
