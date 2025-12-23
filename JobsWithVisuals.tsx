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
import { Plus, Search, MoreVertical, Briefcase, ChevronDown, ChevronUp, Clock, AlertCircle } from "lucide-react";
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

// Helper function to get job age in days
function getJobAgeDays(receivedDate: string): number {
  const received = new Date(receivedDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - received.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper function to get age indicator
function getAgeIndicator(days: number) {
  if (days <= 3) {
    return {
      color: "border-green-500",
      bgColor: "bg-green-500/10",
      label: "New",
      icon: null,
      textColor: "text-green-700"
    };
  } else if (days <= 7) {
    return {
      color: "border-yellow-500",
      bgColor: "bg-yellow-500/10",
      label: `${days}d`,
      icon: Clock,
      textColor: "text-yellow-700"
    };
  } else if (days <= 14) {
    return {
      color: "border-orange-500",
      bgColor: "bg-orange-500/10",
      label: `${days}d`,
      icon: Clock,
      textColor: "text-orange-700"
    };
  } else {
    return {
      color: "border-red-500",
      bgColor: "bg-red-500/10",
      label: `${days}d!`,
      icon: AlertCircle,
      textColor: "text-red-700"
    };
  }
}

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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
      setDeletingJob(null);
    },
  });

  const jobsWithCustomerNames = jobs.map(job => {
    const customer = customers.find(c => c.id === job.customerId);
    const ageDays = getJobAgeDays(job.receivedDate);
    return {
      ...job,
      customerName: customer?.name || "Unknown Customer",
      customerDeleted: job.customerId === null,
      ageDays,
      ageIndicator: getAgeIndicator(ageDays),
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
      <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
        <span className="font-medium">Age Indicators:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          <span>0-3 days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
          <span>4-7 days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
          <span>8-14 days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500"></div>
          <span>15+ days</span>
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
          <div className="grid gap-3">
            {activeJobs.map((job) => (
              <Card 
                key={job.id} 
                className={`p-4 hover:shadow-md transition-all border-l-4 ${job.ageIndicator.color} ${job.ageIndicator.bgColor}`}
                data-testid="job-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-mono font-semibold text-lg" data-testid="job-tracking-id">
                        {job.trackingId}
                      </h3>
                      <StatusBadge status={job.status} type="job" />
                      
                      {/* Age Badge */}
                      <Badge 
                        variant="outline" 
                        className={`${job.ageIndicator.bgColor} ${job.ageIndicator.textColor} border-0 font-semibold`}
                      >
                        {job.ageIndicator.icon && (
                          <job.ageIndicator.icon className="w-3 h-3 mr-1" />
                        )}
                        {job.ageIndicator.label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p 
                        className={job.customerDeleted ? 'text-muted-foreground line-through' : ''}
                        data-testid="job-customer-name"
                      >
                        <span className="font-medium">Customer:</span> {job.customerName}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium">Received:</span>{" "}
                        {new Date(job.receivedDate).toLocaleDateString()}
                      </p>
                      {job.coatingType && (
                        <Badge variant="outline" className="capitalize">
                          {job.coatingType}
                        </Badge>
                      )}
                    </div>
                    
                    {job.items && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {job.items}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-lg" data-testid="job-price">
                        ${Number(job.price).toFixed(2)}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid="button-job-menu">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          data-testid="menu-view"
                          onClick={() => setViewingJob(job)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          data-testid="menu-edit"
                          onClick={() => setEditingJob(job)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem data-testid="menu-add-note">Add Note</DropdownMenuItem>
                        {canDeleteJobs(user) && (
                          <DropdownMenuItem 
                            className="text-destructive" 
                            data-testid="menu-delete"
                            onClick={() => setDeletingJob(job)}
                          >
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
            <div className="grid gap-3 opacity-75">
              {completedJobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="p-4 hover:shadow-md transition-shadow"
                  data-testid="job-card-completed"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-mono font-semibold text-lg" data-testid="job-tracking-id">
                          {job.trackingId}
                        </h3>
                        <StatusBadge status={job.status} type="job" />
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p 
                          className={job.customerDeleted ? 'text-muted-foreground line-through' : ''}
                          data-testid="job-customer-name"
                        >
                          <span className="font-medium">Customer:</span> {job.customerName}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium">Received:</span>{" "}
                          {new Date(job.receivedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-lg" data-testid="job-price">
                          ${Number(job.price).toFixed(2)}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid="button-job-menu">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            data-testid="menu-view"
                            onClick={() => setViewingJob(job)}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            data-testid="menu-edit"
                            onClick={() => setEditingJob(job)}
                          >
                            Edit
                          </DropdownMenuItem>
                          {canDeleteJobs(user) && (
                            <DropdownMenuItem 
                              className="text-destructive" 
                              data-testid="menu-delete"
                              onClick={() => setDeletingJob(job)}
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
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
