import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Customer, InsertCustomer, JobWithServices } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { canCreateCustomers, canAccessCustomers, canDeleteCustomers } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomerForm } from "@/components/CustomerForm";
import { StatusBadge } from "@/components/StatusBadge";
import { 
  Plus, 
  Search, 
  Users,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Briefcase,
  TrendingUp,
  Clock,
  FileText,
  ChevronRight,
  Sparkles,
  Star,
  Trash2,
  Edit3,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ============================================
// TYPES
// ============================================

interface CustomerWithMetrics extends Customer {
  totalSpent: number;
  activeJobsCount: number;
  totalJobsCount: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number) => {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(2)}`;
};

const getCustomerTier = (totalSpent: number) => {
  if (totalSpent >= 5000) return { label: 'VIP', color: 'bg-purple-100 text-purple-700 border-purple-200' };
  if (totalSpent >= 2000) return { label: 'Gold', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (totalSpent >= 500) return { label: 'Regular', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  return { label: 'New', color: 'bg-green-100 text-green-700 border-green-200' };
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function Customers() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithMetrics | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerWithMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const { toast } = useToast();

  // Redirect employees away from this page
  useEffect(() => {
    if (user && !canAccessCustomers(user)) {
      setLocation("/estimates");
    }
  }, [user, setLocation]);

  // ============================================
  // QUERIES
  // ============================================

  const { data: customers = [], isLoading } = useQuery<CustomerWithMetrics[]>({
    queryKey: ["/api/customers/metrics"],
  });

  const { data: allJobs = [] } = useQuery<JobWithServices[]>({
    queryKey: ["/api/jobs"],
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const createMutation = useMutation({
    mutationFn: (data: InsertCustomer) =>
      apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/metrics"] });
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Customer created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create customer", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCustomer> }) =>
      apiRequest("PATCH", `/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/metrics"] });
      toast({ title: "Success", description: "Customer updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update customer", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/metrics"] });
      setDeletingCustomer(null);
      setSelectedCustomer(null);
      toast({ title: "Success", description: "Customer deleted successfully" });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to delete customer";
      if (error?.message) {
        try {
          const jsonPart = error.message.split(': ').slice(1).join(': ');
          const parsed = JSON.parse(jsonPart);
          errorMessage = parsed.error || errorMessage;
        } catch {
          errorMessage = error.message;
        }
      }
      toast({ title: "Cannot Delete", description: errorMessage, variant: "destructive" });
      setDeletingCustomer(null);
    },
  });

  // ============================================
  // COMPUTED DATA
  // ============================================

  const stats = useMemo(() => {
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const activeJobs = customers.reduce((sum, c) => sum + c.activeJobsCount, 0);
    const vipCount = customers.filter(c => c.totalSpent >= 5000).length;
    
    return {
      total: customers.length,
      totalRevenue,
      activeJobs,
      vipCount,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(customer => {
        const query = searchQuery.toLowerCase();
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query) ||
          customer.phone?.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
        );
      })
      .sort((a, b) => {
        // Sort by active jobs first, then by total spent
        if (a.activeJobsCount !== b.activeJobsCount) {
          return b.activeJobsCount - a.activeJobsCount;
        }
        return b.totalSpent - a.totalSpent;
      });
  }, [customers, searchQuery]);

  // Get jobs for selected customer
  const customerJobs = useMemo(() => {
    if (!selectedCustomer) return [];
    return allJobs
      .filter(job => job.customerId === selectedCustomer.id)
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }, [selectedCustomer, allJobs]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    
    await updateMutation.mutateAsync({
      id: selectedCustomer.id,
      data: { notes: editedNotes }
    });
    
    // Update local state
    setSelectedCustomer({ ...selectedCustomer, notes: editedNotes });
    setIsEditingNotes(false);
  };

  const handleOpenCustomer = (customer: CustomerWithMetrics) => {
    setSelectedCustomer(customer);
    setEditedNotes(customer.notes || "");
    setIsEditingNotes(false);
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading customers...</div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="space-y-6 pb-8">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customers</h1>
              <p className="text-slate-400 mt-1">Manage relationships and track history</p>
            </div>
            {canCreateCustomers(user) && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATS ROW */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Customers</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Jobs</p>
                <p className="text-2xl font-bold mt-1">{stats.activeJobs}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">VIP Customers</p>
                <p className="text-2xl font-bold mt-1">{stats.vipCount}</p>
                <p className="text-xs text-purple-600 mt-0.5">$5k+ spent</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* SEARCH */}
      {/* ============================================ */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ============================================ */}
      {/* CUSTOMER LIST */}
      {/* ============================================ */}
      {filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term" : "Add your first customer to get started"}
          </p>
          {!searchQuery && canCreateCustomers(user) && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* MOBILE VIEW */}
          <div className="md:hidden space-y-2">
            {filteredCustomers.map((customer) => {
              const tier = getCustomerTier(customer.totalSpent);
              
              return (
                <Card 
                  key={customer.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenCustomer(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">{customer.name}</h3>
                          <Badge variant="outline" className={`text-[10px] ${tier.color}`}>
                            {tier.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{customer.phone || '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold">${customer.totalSpent.toFixed(0)}</p>
                        <p className="text-[10px] text-muted-foreground">total</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {customer.activeJobsCount > 0 && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">
                          {customer.activeJobsCount} active
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {customer.totalJobsCount} jobs
                      </Badge>
                      {customer.notes && (
                        <Badge variant="outline" className="text-[10px]">
                          <FileText className="w-3 h-3 mr-1" />
                          Notes
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* DESKTOP VIEW */}
          <Card className="hidden md:block overflow-hidden">
            <div className="divide-y">
              {filteredCustomers.map((customer) => {
                const tier = getCustomerTier(customer.totalSpent);
                
                return (
                  <div 
                    key={customer.id}
                    className="p-4 flex items-center gap-6 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleOpenCustomer(customer)}
                  >
                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold">{customer.name}</h3>
                        <Badge variant="outline" className={`text-xs ${tier.color}`}>
                          {tier.label}
                        </Badge>
                        {customer.notes && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Notes
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Jobs */}
                    <div className="w-32 hidden lg:block">
                      <div className="flex items-center gap-2">
                        {customer.activeJobsCount > 0 && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                            {customer.activeJobsCount} active
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {customer.totalJobsCount} total
                        </span>
                      </div>
                    </div>

                    {/* Since */}
                    <div className="w-28 text-sm text-muted-foreground hidden lg:flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </div>

                    {/* Total Spent */}
                    <div className="w-28 text-right">
                      <p className="text-lg font-bold">${customer.totalSpent.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">total spent</p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* ============================================ */}
      {/* CREATE CUSTOMER DIALOG */}
      {/* ============================================ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* CUSTOMER DETAIL DIALOG */}
      {/* ============================================ */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedCustomer && (
            <>
              <DialogHeader className="pb-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl">{selectedCustomer.name}</DialogTitle>
                      <Badge variant="outline" className={getCustomerTier(selectedCustomer.totalSpent).color}>
                        {getCustomerTier(selectedCustomer.totalSpent).label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {selectedCustomer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedCustomer.phone}
                        </span>
                      )}
                      {selectedCustomer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {selectedCustomer.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${selectedCustomer.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">lifetime value</p>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="notes" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="notes">
                    <FileText className="w-4 h-4 mr-2" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="jobs">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Jobs ({customerJobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="edit">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </TabsTrigger>
                </TabsList>

                {/* NOTES TAB */}
                <TabsContent value="notes" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Project Notes</h3>
                    {!isEditingNotes ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditingNotes(true)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditedNotes(selectedCustomer.notes || "");
                            setIsEditingNotes(false);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {isEditingNotes ? (
                    <Textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Add notes about this customer's projects, preferences, reminders..."
                      className="min-h-[200px]"
                    />
                  ) : (
                    <Card className="p-4">
                      {selectedCustomer.notes ? (
                        <p className="whitespace-pre-wrap text-sm">{selectedCustomer.notes}</p>
                      ) : (
                        <p className="text-muted-foreground text-sm italic">
                          No notes yet. Click Edit to add project notes, preferences, or reminders.
                        </p>
                      )}
                    </Card>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <Card className="p-3 text-center">
                      <p className="text-2xl font-bold">{selectedCustomer.totalJobsCount}</p>
                      <p className="text-xs text-muted-foreground">Total Jobs</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <p className="text-2xl font-bold">{selectedCustomer.activeJobsCount}</p>
                      <p className="text-xs text-muted-foreground">Active Jobs</p>
                    </Card>
                    <Card className="p-3 text-center">
                      <p className="text-2xl font-bold">
                        ${selectedCustomer.totalJobsCount > 0 
                          ? (selectedCustomer.totalSpent / selectedCustomer.totalJobsCount).toFixed(0)
                          : '0'}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Job</p>
                    </Card>
                  </div>
                </TabsContent>

                {/* JOBS TAB */}
                <TabsContent value="jobs" className="mt-4">
                  {customerJobs.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Briefcase className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No jobs yet</p>
                    </Card>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {customerJobs.map((job) => (
                        <Card 
                          key={job.id}
                          className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setLocation(`/jobs?customer=${encodeURIComponent(selectedCustomer.name)}`);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {job.trackingId}
                                </span>
                                <StatusBadge status={job.status} type="job" />
                              </div>
                              <p className="text-sm truncate">{job.items || 'No description'}</p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold">${Number(job.price).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(job.receivedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* EDIT TAB */}
                <TabsContent value="edit" className="mt-4">
                  <CustomerForm
                    onSubmit={(data) => {
                      updateMutation.mutate({ 
                        id: selectedCustomer.id, 
                        data 
                      });
                      // Update local state to reflect changes
                      setSelectedCustomer({ ...selectedCustomer, ...data });
                    }}
                    onCancel={() => setSelectedCustomer(null)}
                    defaultValues={selectedCustomer}
                  />
                  
                  {canDeleteCustomers && canDeleteCustomers(user) && (
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingCustomer(selectedCustomer)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Customer
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DELETE CONFIRMATION */}
      {/* ============================================ */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{deletingCustomer?.name}</span>.
              {deletingCustomer?.activeJobsCount ? (
                <span className="block mt-2 text-destructive">
                  Warning: This customer has {deletingCustomer.activeJobsCount} active job(s).
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCustomer && deleteMutation.mutate(deletingCustomer.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
