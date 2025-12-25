
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Job, JobWithServices, Customer, CreateJobInput } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { canCreateJobs, canDeleteJobs, canAccessJobs } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { JobForm } from "@/components/JobForm";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Search, MoreVertical, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Color coding for job age - visual urgency indicators
const getJobAgeColors = (ageDays: number) => {
  if (ageDays <= 3) return {
    bg: 'bg-green-500/5',
    border: 'border-l-green-500/30',
    badge: 'bg-green-500/15 text-green-800 border-green-500/30'
  };
  if (ageDays <= 7) return {
    bg: 'bg-yellow-500/5',
    border: 'border-l-yellow-500/30',
    badge: 'bg-yellow-500/15 text-yellow-800 border-yellow-500/30'
  };
  if (ageDays <= 14) return {
    bg: 'bg-orange-500/5',
    border: 'border-l-orange-500/30',
    badge: 'bg-orange-500/15 text-orange-800 border-orange-500/30'
  };
  return {
    bg: 'bg-red-500/5',
    border: 'border-l-red-500/30',
    badge: 'bg-red-500/15 text-red-800 border-red-500/30'
  };
};

// Ghost jobs - IDs that exist in cache but not in database
const GHOST_JOB_IDS = [
  '94d885a1-fa50-41e0-9752-1da1fa09695b',
  '5c4e40b4-9bc2-4cf6-8418-bcb0260c0082',
  '99f0f3a1-658c-4f39-ad95-f97b51c901c5',
  '87855028-1f0d-4e83-846f-63d66333aab8',
  'a26ff481-ce4b-4bb3-aca4-eb0eb399b15e',
  'd9b68e72-e1a7-455b-aaa1-785ca80a6f7f',
  '8e1c1cf3-cae8-4629-8f38-6e7b589376bd',
  '24f14775-5964-4e3f-9bdd-6454e5ea6041'
];

export default function Jobs() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWithServices | null>(null);
  const [viewingJob, setViewingJob] = useState<JobWithServices | null>(null);
  const [deletingJob, setDeletingJob] = useState<JobWithServices | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  // Redirect employees away from this page
  useEffect(() => {
    if (user && !canAccessJobs(user)) {
      setLocation("/estimates");
    }
  }, [user, setLocation]);

  // Read customer query parameter and set initial search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customerParam = params.get('customer');
    if (customerParam && customerParam !== searchQuery) {
      setSearchQuery(customerParam);
    }
  }, [location, searchQuery]);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobWithServices[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateJobInput) =>
      apiRequest("POST", "/api/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      setTimeout(() => setIsDialogOpen(false), 100);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJobInput> }) =>
      apiRequest("PATCH", `/api/jobs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      setTimeout(() => setEditingJob(null), 100);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      setDeletingJob(null);
    },
    onError: (error: any) => {
      // Check if it's a 404 (ghost job)
      if (error?.message?.includes('404')) {
        console.log('Ghost job detected, removing from cache:', deletingJob?.id);
        
        // Remove the ghost job from React Query cache
        queryClient.setQueryData(["/api/jobs"], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.filter((job: any) => job.id !== deletingJob?.id);
        });
        
        setDeletingJob(null);
        
        toast({
          title: "Ghost Job Removed",
          description: "Job didn't exist in database, removed from display",
        });
      } else {
        // Real error
        toast({
          title: "Error",
          description: "Failed to delete job",
          variant: "destructive",
        });
        setDeletingJob(null);
      }
    },
  });

  const jobsWithCustomerNames = jobs
    .filter(job => !GHOST_JOB_IDS.includes(job.id))  // Filter out ghosts
    .map(job => {
      const customer = customers.find(c => c.id === job.customerId);
      const ageDays = Math.ceil((Date.now() - new Date(job.receivedDate).getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...job,
        customerName: customer?.name || "Unknown Customer",
        customerDeleted: job.customerId === null,
        ageDays,
      };
    });

  // Split jobs into active and completed
  const activeJobs = jobsWithCustomerNames
    .filter(job => job.status !== 'paid' && job.status !== 'finished')
    .filter(job => {
      const matchesSearch = job.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by age (oldest first for urgency)
      return b.ageDays - a.ageDays;
    });

  const completedJobs = jobsWithCustomerNames
    .filter(job => job.status === 'paid' || job.status === 'finished')
    .filter(job => {
      const matchesSearch = job.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort completed by newest first
      const aDate = new Date(a.receivedDate).getTime();
      const bDate = new Date(b.receivedDate).getTime();
      return bDate - aDate;
    });

  if (jobsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Jobs</h1>
          <p className="text-muted-foreground mt-1">Track and manage all your jobs</p>
        </div>
        {canCreateJobs(user) && (
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-job">
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-jobs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="prepped">Prepped</SelectItem>
            <SelectItem value="coated">Coated</SelectItem>
            <SelectItem value="finished">Finished</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Age Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md flex-wrap">
        <span className="font-medium">Age:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          <span>0-3d</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
          <span>4-7d</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
          <span>8-14d</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500"></div>
          <span>15+d</span>
        </div>
      </div>

      {/* Active Jobs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Active Jobs ({activeJobs.length})
        </h2>
        {activeJobs.length === 0 ? (
          <Card className="p-8 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" ? "No active jobs match your filters" : "No active jobs"}
            </p>
          </Card>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden border rounded-lg overflow-hidden divide-y">
              {activeJobs.map((job) => {
                const colors = getJobAgeColors(job.ageDays);
                
                return (
                  <div
                    key={job.id}
                    className={`p-2.5 hover:bg-accent/50 cursor-pointer transition-colors border-l-2 ${colors.bg} ${colors.border}`}
                    data-testid={`list-job-${job.id}`}
                    onClick={() => setEditingJob(job)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEditingJob(job);
                      }
                    }}
                  >
                    {/* Top row: Customer name + Price */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className={`font-semibold text-sm ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                        {job.customerName}
                      </div>
                      <div className="font-bold text-base flex-shrink-0">
                        ${Number(job.price).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Bottom row: Items + Status + Age */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground truncate flex-1">
                        {job.items || 'No description'}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <StatusBadge status={job.status} type="job" />
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium border ${colors.badge}`}>
                          {job.ageDays}d
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block border rounded-lg overflow-hidden divide-y">
              {activeJobs.map((job) => {
                const colors = getJobAgeColors(job.ageDays);
                
                return (
                  <div
                    key={job.id}
                    className={`p-2.5 hover:bg-accent/50 cursor-pointer transition-colors border-l-2 ${colors.bg} ${colors.border}`}
                    data-testid={`row-job-${job.id}`}
                    onClick={() => setEditingJob(job)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEditingJob(job);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Customer + Items */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm mb-0.5 ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                          {job.customerName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {job.items || 'No description'}
                        </div>
                      </div>
                      
                      {/* Phone */}
                      <div className="text-xs text-muted-foreground flex-shrink-0 hidden lg:block">
                        {job.phoneNumber}
                      </div>
                      
                      {/* Status + Age */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={job.status} type="job" />
                        <Badge variant="outline" className={`text-xs px-2 py-0.5 font-medium border ${colors.badge}`}>
                          {job.ageDays}d
                        </Badge>
                      </div>
                      
                      {/* Price */}
                      <div className="font-bold text-base flex-shrink-0">
                        ${Number(job.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Completed Jobs - Collapsible */}
      {completedJobs.length > 0 && (
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between mb-4 text-lg font-semibold"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <span>Completed Jobs ({completedJobs.length})</span>
            {showCompleted ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
          
          {showCompleted && (
            <div className="border rounded-lg overflow-hidden divide-y opacity-75">
              {completedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-2.5 hover:bg-accent/50 cursor-pointer transition-colors"
                  data-testid="job-card-completed"
                  onClick={() => setEditingJob(job)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setEditingJob(job);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm mb-0.5 ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                        {job.customerName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {job.items || 'No description'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={job.status} type="job" />
                    </div>
                    
                    <div className="font-bold text-base flex-shrink-0">
                      ${Number(job.price).toFixed(2)}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" data-testid="button-job-menu">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          data-testid="menu-view"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingJob(job);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          data-testid="menu-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingJob(job);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        {canDeleteJobs(user) && (
                          <DropdownMenuItem 
                            className="text-destructive" 
                            data-testid="menu-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingJob(job);
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
          )}
        </div>
      )}

      {/* Dialogs remain the same */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          {isDialogOpen && (
            <JobForm
              customers={customers.map(c => ({ id: c.id, name: c.name, phone: c.phone }))}
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setIsDialogOpen(false)}
              isSubmitting={createMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl p-4 sm:p-6" data-testid="dialog-edit-job">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <JobForm
              customers={customers.map(c => ({ id: c.id, name: c.name, phone: c.phone }))}
              defaultValues={{
                customerId: editingJob.customerId || undefined,
                phoneNumber: editingJob.phoneNumber,
                receivedDate: new Date(editingJob.receivedDate),
                serviceIds: editingJob.serviceIds || [],
                inventoryItems: editingJob.inventoryItems || [],
                coatingType: editingJob.coatingType as "powder" | "ceramic" | "misc" | undefined,
                items: editingJob.items || "",
                detailedNotes: editingJob.detailedNotes || "",
                price: Number(editingJob.price),
                status: editingJob.status,
              }}
              onSubmit={(data) => updateMutation.mutate({ id: editingJob.id, data })}
              onCancel={() => setEditingJob(null)}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl p-4 sm:p-6" data-testid="dialog-job-details">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {viewingJob && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tracking ID</p>
                  <p className="font-mono font-semibold" data-testid="detail-tracking-id">{viewingJob.trackingId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <StatusBadge status={viewingJob.status} type="job" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer</p>
                  <p 
                    className={`font-medium ${viewingJob.customerId === null ? 'text-muted-foreground line-through' : ''}`}
                    data-testid="detail-customer"
                  >
                    {customers.find(c => c.id === viewingJob.customerId)?.name || "Unknown Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                  <p data-testid="detail-phone">{viewingJob.phoneNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Coating Type</p>
                  <Badge variant="outline" className="capitalize">
                    {viewingJob.coatingType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="font-semibold text-lg" data-testid="detail-price">
                    ${Number(viewingJob.price).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Received Date</p>
                  <p data-testid="detail-received-date">
                    {new Date(viewingJob.receivedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {viewingJob.items && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Items</p>
                  <p className="text-sm bg-muted/50 p-4 rounded-md" data-testid="detail-items">
                    {viewingJob.items}
                  </p>
                </div>
              )}

              {viewingJob.detailedNotes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Detailed Notes</p>
                  <p className="text-sm bg-muted/50 p-4 rounded-md" data-testid="detail-notes">
                    {viewingJob.detailedNotes}
                  </p>
                </div>
              )}

              {viewingJob.inventoryItems && viewingJob.inventoryItems.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Inventory Items</p>
                  <div className="space-y-2" data-testid="detail-inventory-list">
                    {viewingJob.inventoryItems.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                        data-testid={`inventory-item-${index}`}
                      >
                        <span className="font-medium">{item.inventoryName}</span>
                        <span className="text-muted-foreground">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setViewingJob(null)} data-testid="button-close-details">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingJob} onOpenChange={(open) => !open && setDeletingJob(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete job <span className="font-mono font-semibold">{deletingJob?.trackingId}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() => deletingJob && deleteMutation.mutate(deletingJob.id)}
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
