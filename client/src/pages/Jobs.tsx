import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Job, Customer, CreateJobWithCustomer } from "@shared/schema";
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
import { Plus, Search, MoreVertical, Briefcase } from "lucide-react";
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

export default function Jobs() {
  const [location] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Read customer query parameter and set initial search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customerParam = params.get('customer');
    if (customerParam && customerParam !== searchQuery) {
      setSearchQuery(customerParam);
    }
  }, [location, searchQuery]);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateJobWithCustomer) =>
      apiRequest("POST", "/api/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      // Close dialog after toast to ensure proper sequencing
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
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJobWithCustomer> }) =>
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
    return {
      ...job,
      customerName: customer?.name || "Unknown Customer",
      customerDeleted: !customer && job.customerId !== null,
    };
  });

  const filteredJobs = jobsWithCustomerNames
    .filter(job => {
      const matchesSearch = job.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());

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
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-job">
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {filteredJobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No jobs found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card 
              key={job.id}
              className="p-4 hover-elevate cursor-pointer"
              data-testid={`card-job-${job.id}`}
              onClick={() => setEditingJob(job)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEditingJob(job);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className={`font-medium text-base ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                    {job.customerName}
                  </div>
                  <div className="text-sm text-muted-foreground">{job.phoneNumber}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={job.status} type="job" />
                  <div className="font-semibold text-lg">${Number(job.price).toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <Badge variant="outline" className="capitalize text-xs">
                  {job.coatingType}
                </Badge>
                <span>•</span>
                <span>{new Date(job.receivedDate).toLocaleDateString()}</span>
                {job.items && (
                  <>
                    <span>•</span>
                    <span className="truncate">{job.items}</span>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left py-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Customer
                </th>
                <th className="text-left py-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Phone
                </th>
                <th className="text-left py-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Coating Type
                </th>
                <th className="text-left py-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Items
                </th>
                <th className="text-left py-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Price
                </th>
                <th className="text-left py-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Received Date
                </th>
                <th className="text-right py-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No jobs found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className="border-b last:border-b-0 hover-elevate transition-colors cursor-pointer" 
                    data-testid={`row-job-${job.id}`}
                    onClick={() => setEditingJob(job)}
                  >
                    <td className="py-2.5 px-4">
                      <span className={`font-medium ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                        {job.customerName}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-muted-foreground text-sm">{job.phoneNumber}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className="capitalize">
                        {job.coatingType}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-muted-foreground text-sm">
                        {job.items || <span className="text-muted-foreground/50">—</span>}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold">${Number(job.price).toFixed(2)}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={job.status} type="job" />
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-muted-foreground text-sm">
                        {new Date(job.receivedDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-menu-${job.id}`}>
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
                          <DropdownMenuItem 
                            className="text-destructive" 
                            data-testid="menu-delete"
                            onClick={() => setDeletingJob(job)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <JobForm
            customers={customers.map(c => ({ id: c.id, name: c.name }))}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-job">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <JobForm
              customers={customers.map(c => ({ id: c.id, name: c.name }))}
              defaultValues={{
                customerId: editingJob.customerId,
                phoneNumber: editingJob.phoneNumber,
                receivedDate: new Date(editingJob.receivedDate),
                coatingType: editingJob.coatingType as "powder" | "ceramic" | "both",
                items: editingJob.items || "",
                detailedNotes: editingJob.detailedNotes || "",
                price: Number(editingJob.price),
                status: editingJob.status,
              }}
              onSubmit={(data) => updateMutation.mutate({ id: editingJob.id, data })}
              onCancel={() => setEditingJob(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-job-details">
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
                    className={`font-medium ${!customers.find(c => c.id === viewingJob.customerId) && viewingJob.customerId ? 'text-muted-foreground line-through' : ''}`}
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
