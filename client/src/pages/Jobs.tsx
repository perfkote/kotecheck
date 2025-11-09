import { useState } from "react";
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
import { PriorityIndicator } from "@/components/PriorityIndicator";
import { Plus, Search, MoreVertical } from "lucide-react";
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

//todo: remove mock functionality
const mockJobs = [
  { id: "1", title: "Engine Repair", customer: "Acme Corp", customerId: "1", status: "in-progress", priority: "high", date: "2024-03-15" },
  { id: "2", title: "Oil Change", customer: "Tech Solutions", customerId: "2", status: "pending", priority: "medium", date: "2024-03-16" },
  { id: "3", title: "Brake Service", customer: "Global Industries", customerId: "3", status: "completed", priority: "low", date: "2024-03-14" },
  { id: "4", title: "Transmission Fix", customer: "Smith Auto", customerId: "4", status: "in-progress", priority: "urgent", date: "2024-03-15" },
  { id: "5", title: "Tire Replacement", customer: "Acme Corp", customerId: "1", status: "pending", priority: "medium", date: "2024-03-17" },
];

const mockCustomers = [
  { id: "1", name: "Acme Corp" },
  { id: "2", name: "Tech Solutions Inc" },
  { id: "3", name: "Global Industries" },
  { id: "4", name: "Smith Auto" },
];

export default function Jobs() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Job Title
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Priority
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className="border-b hover-elevate" data-testid={`row-job-${job.id}`}>
                  <td className="py-4 px-4 font-medium">{job.title}</td>
                  <td className="py-4 px-4 text-muted-foreground">{job.customer}</td>
                  <td className="py-4 px-4">
                    <StatusBadge status={job.status} type="job" />
                  </td>
                  <td className="py-4 px-4">
                    <PriorityIndicator priority={job.priority} />
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">{job.date}</td>
                  <td className="py-4 px-4 text-right">
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
                        <DropdownMenuItem className="text-destructive" data-testid="menu-delete">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
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
            customers={mockCustomers}
            onSubmit={(data) => {
              console.log("Job created:", data);
              setIsDialogOpen(false);
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
