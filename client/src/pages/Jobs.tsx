import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { JobForm } from "@/components/JobForm";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const jobsWithCustomerNames = jobs.map(job => ({
    ...job,
    customerName: customers.find(c => c.id === job.customerId)?.name || "Unknown",
  }));

  const filteredJobs = jobsWithCustomerNames.filter(job => {
    const matchesSearch = job.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
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

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tracking ID
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Customer
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Phone
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Coating Type
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Price
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Received Date
                </th>
                <th className="text-right py-4 px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                  <tr key={job.id} className="border-b last:border-b-0 hover-elevate transition-colors" data-testid={`row-job-${job.id}`}>
                    <td className="py-4 px-6">
                      <span className="font-mono font-medium text-sm">{job.trackingId}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium">{job.customerName}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground">{job.phoneNumber}</span>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="capitalize">
                        {job.coatingType}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold">${Number(job.price).toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={job.status} type="job" />
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-muted-foreground text-sm">
                        {new Date(job.receivedDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-menu-${job.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem data-testid="menu-view">View Details</DropdownMenuItem>
                          <DropdownMenuItem data-testid="menu-edit">Edit</DropdownMenuItem>
                          <DropdownMenuItem data-testid="menu-add-note">Add Note</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive" 
                            data-testid="menu-delete"
                            onClick={() => deleteMutation.mutate(job.id)}
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
    </div>
  );
}
