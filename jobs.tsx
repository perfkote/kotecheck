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
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      setTimeout(() => {
        setEditingJob(null);
        setViewingJob(null);
      }, 100);
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
    mutationFn: (id: string) => apiRequest("DELETE", `/api/jobs/${id}`),
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
    },
  });

  const jobsWithCustomerNames = jobs.map(job => {
    const customer = customers.find(c => c.id === job.customerId);
    const ageDays = getJobAgeDays(job.receivedDate);
    const ageIndicator = getAgeIndicator(ageDays);
    
    return {
      ...job,
      customerName: customer?.name || `[Deleted Customer]`,
      customerDeleted: !customer,
      ageDays,
      ageIndicator
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
    return <div className="p-4 sm:p-8 text-base">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* MOBILE-OPTIMIZED HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Jobs</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Track and manage all your jobs</p>
        </div>
        {canCreateJobs(user) && (
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            data-testid="button-create-job"
            className="w-full sm:w-auto h-12 sm:h-10 text-base"
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
            Create Job
          </Button>
        )}
      </div>

      {/* MOBILE-OPTIMIZED FILTERS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            className="pl-10 h-12 sm:h-10 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-jobs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-12 sm:h-10 text-base" data-testid="select-filter-status">
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

      {/* MOBILE-OPTIMIZED AGE LEGEND */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-sm sm:text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
        <span className="font-medium col-span-2 sm:col-span-1">Age:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-3 sm:h-3 rounded-sm bg-green-500"></div>
          <span>0-3d</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-3 sm:h-3 rounded-sm bg-yellow-500"></div>
          <span>4-7d</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-3 sm:h-3 rounded-sm bg-orange-500"></div>
          <span>8-14d</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-3 sm:h-3 rounded-sm bg-red-500"></div>
          <span>15+d</span>
        </div>
      </div>

      {/* MOBILE-OPTIMIZED ACTIVE JOBS */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
          Active Jobs ({activeJobs.length})
        </h2>
        {activeJobs.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm sm:text-base text-muted-foreground">
              {searchQuery || statusFilter !== "all" ? "No active jobs match your filters" : "No active jobs"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {activeJobs.map((job) => (
              <Card 
                key={job.id} 
                className={`p-4 sm:p-4 hover:shadow-md transition-all border-l-4 ${job.ageIndicator.color} ${job.ageIndicator.bgColor}`}
                data-testid="job-card"
              >
                <div className="space-y-3">
                  {/* Header Row - Mobile Stacked */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono font-semibold text-lg sm:text-lg" data-testid="job-tracking-id">
                        {job.trackingId}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <StatusBadge status={job.status} type="job" />
                        <Badge 
                          variant="outline" 
                          className={`${job.ageIndicator.bgColor} ${job.ageIndicator.textColor} border-0 font-semibold text-sm`}
                        >
                          {job.ageIndicator.icon && (
                            <job.ageIndicator.icon className="w-3 h-3 mr-1" />
                          )}
                          {job.ageIndicator.label}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Price and Menu - Aligned Right */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-lg sm:text-lg" data-testid="job-price">
                          ${Number(job.price).toFixed(2)}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-10 w-10 sm:h-9 sm:w-9"
                            data-testid="button-job-menu"
                          >
                            <MoreVertical className="w-5 h-5 sm:w-4 sm:h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            data-testid="menu-view"
                            onClick={() => setViewingJob(job)}
                            className="text-base sm:text-sm py-3 sm:py-2"
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            data-testid="menu-edit"
                            onClick={() => setEditingJob(job)}
                            className="text-base sm:text-sm py-3 sm:py-2"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            data-testid="menu-add-note"
                            className="text-base sm:text-sm py-3 sm:py-2"
                          >
                            Add Note
                          </DropdownMenuItem>
                          {canDeleteJobs(user) && (
                            <DropdownMenuItem 
                              className="text-destructive text-base sm:text-sm py-3 sm:py-2" 
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
                  
                  {/* Job Details - Mobile Friendly */}
                  <div className="space-y-2 text-sm sm:text-sm">
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
                      <Badge variant="outline" className="capitalize text-sm">
                        {job.coatingType}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Items Description */}
                  {job.items && (
                    <p className="text-sm sm:text-sm text-muted-foreground line-clamp-2">
                      {job.items}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MOBILE-OPTIMIZED COMPLETED JOBS - Collapsible */}
      {completedJobs.length > 0 && (
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between mb-3 sm:mb-4 text-base sm:text-lg font-semibold h-12 sm:h-auto"
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
                  className="p-4 sm:p-4 hover:shadow-md transition-shadow"
                  data-testid="job-card-completed"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono font-semibold text-lg sm:text-lg mb-2" data-testid="job-tracking-id">
                          {job.trackingId}
                        </h3>
                        <StatusBadge status={job.status} type="job" />
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-lg sm:text-lg" data-testid="job-price">
                            ${Number(job.price).toFixed(2)}
                          </p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-10 w-10 sm:h-9 sm:w-9"
                              data-testid="button-job-menu"
                            >
                              <MoreVertical className="w-5 h-5 sm:w-4 sm:h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              data-testid="menu-view"
                              onClick={() => setViewingJob(job)}
                              className="text-base sm:text-sm py-3 sm:py-2"
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              data-testid="menu-edit"
                              onClick={() => setEditingJob(job)}
                              className="text-base sm:text-sm py-3 sm:py-2"
                            >
                              Edit
                            </DropdownMenuItem>
                            {canDeleteJobs(user) && (
                              <DropdownMenuItem 
                                className="text-destructive text-base sm:text-sm py-3 sm:py-2" 
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
                    
                    <div className="space-y-2 text-sm sm:text-sm">
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
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MOBILE-OPTIMIZED DIALOGS */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl h-[95vh] sm:h-auto max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Create New Job</DialogTitle>
          </DialogHeader>
          <JobForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setIsDialogOpen(false)}
            customers={customers}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl h-[95vh] sm:h-auto max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Edit Job</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <JobForm
              onSubmit={(data) => updateMutation.mutate({ id: editingJob.id, data })}
              onCancel={() => setEditingJob(null)}
              defaultValues={{
                customerId: editingJob.customerId,
                phoneNumber: editingJob.phoneNumber || "",
                receivedDate: new Date(editingJob.receivedDate),
                coatingType: editingJob.coatingType || undefined,
                items: editingJob.items || "",
                detailedNotes: editingJob.detailedNotes || "",
                price: Number(editingJob.price),
                status: editingJob.status,
                serviceIds: editingJob.services?.map(s => s.serviceId) || [],
                inventoryItems: editingJob.inventoryItems?.map(i => ({
                  inventoryId: i.inventoryId,
                  quantity: i.quantity
                })) || [],
              }}
              customers={customers}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl h-[95vh] sm:h-auto max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Job Details</DialogTitle>
          </DialogHeader>
          {viewingJob && (
            <div className="space-y-4 text-base">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Tracking ID</h3>
                <p className="font-mono text-lg">{viewingJob.trackingId}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-lg">Status</h3>
                <StatusBadge status={viewingJob.status} type="job" />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-lg">Customer</h3>
                <p>{customers.find(c => c.id === viewingJob.customerId)?.name || "[Deleted]"}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-lg">Price</h3>
                <p className="text-lg font-semibold">${Number(viewingJob.price).toFixed(2)}</p>
              </div>
              {viewingJob.items && (
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Items</h3>
                  <p className="whitespace-pre-wrap">{viewingJob.items}</p>
                </div>
              )}
              {viewingJob.detailedNotes && (
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Notes</h3>
                  <p className="whitespace-pre-wrap">{viewingJob.detailedNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingJob} onOpenChange={(open) => !open && setDeletingJob(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Job?</AlertDialogTitle>
            <AlertDialogDescription className="text-base sm:text-sm">
              This will permanently delete job {deletingJob?.trackingId}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="h-12 sm:h-10 text-base sm:text-sm m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingJob && deleteMutation.mutate(deletingJob.id)}
              className="h-12 sm:h-10 text-base sm:text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 m-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
