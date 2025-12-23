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
import { Plus, Search, MoreVertical, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  // UPDATED: Search now includes phone numbers
  const filteredCustomers = customers
    .filter(customer => {
      const query = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) || // ADDED: phone search
        customer.phone?.replace(/\D/g, '').includes(query.replace(/\D/g, '')) // ADDED: numeric phone search
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "spending-desc":
          return b.totalSpent - a.totalSpent;
        case "spending-asc":
          return a.totalSpent - b.totalSpent;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  if (isLoading) {
    return <div className="p-4 sm:p-8 text-base">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* MOBILE-OPTIMIZED HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Customers</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your customer database</p>
        </div>
        {canCreateCustomers(user) && (
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            data-testid="button-add-customer"
            className="w-full sm:w-auto h-12 sm:h-10 text-base"
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
            Add Customer
          </Button>
        )}
      </div>

      {/* MOBILE-OPTIMIZED SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-10 h-12 sm:h-10 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-customers"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48 h-12 sm:h-10 text-base" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc" data-testid="sort-name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc" data-testid="sort-name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="spending-desc">Highest Spending</SelectItem>
            <SelectItem value="spending-asc">Lowest Spending</SelectItem>
            <SelectItem value="newest" data-testid="sort-newest">Newest First</SelectItem>
            <SelectItem value="oldest" data-testid="sort-oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* MOBILE-OPTIMIZED CUSTOMER CARDS */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <Card className="p-6 sm:p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">No customers found</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Try adjusting your search</p>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card 
              key={customer.id}
              className="p-4 hover-elevate cursor-pointer"
              data-testid={`card-customer-${customer.id}`}
              onClick={() => setEditingCustomer(customer)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEditingCustomer(customer);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base sm:text-base">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">{customer.phone || '—'}</div>
                  {customer.email && (
                    <div className="text-xs text-muted-foreground truncate">{customer.email}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="font-semibold text-lg">${customer.totalSpent.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Total Spent</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {customer.activeJobsCount} active
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {customer.totalJobsCount} total
                </Badge>
                <span>•</span>
                <span>Since {new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* MOBILE-OPTIMIZED DIALOGS */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-md h-[95vh] sm:h-auto max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Add Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="max-w-full sm:max-w-md h-[95vh] sm:h-auto max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Edit Customer</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              onSubmit={(data) => updateMutation.mutate({ id: editingCustomer.id, data })}
              onCancel={() => setEditingCustomer(null)}
              defaultValues={editingCustomer}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
