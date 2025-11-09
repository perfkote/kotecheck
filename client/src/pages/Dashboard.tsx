import { useQuery } from "@tanstack/react-query";
import type { Customer, Job } from "@shared/schema";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityIndicator } from "@/components/PriorityIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, FileText, DollarSign, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const activeJobs = jobs.filter(j => j.status === "in-progress" || j.status === "pending");
  const recentJobs = jobs.slice(0, 4).map(job => ({
    ...job,
    customerName: customers.find(c => c.id === job.customerId)?.name || "Unknown",
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your shop operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Customers" 
          value={customers.length} 
          icon={Users}
        />
        <StatsCard 
          title="Active Jobs" 
          value={activeJobs.length} 
          icon={Briefcase}
        />
        <StatsCard 
          title="Total Jobs" 
          value={jobs.length} 
          icon={FileText}
        />
        <StatsCard 
          title="Completed Jobs" 
          value={jobs.filter(j => j.status === "completed").length} 
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium">Recent Jobs</h2>
            <Link href="/jobs">
              <Button variant="outline" size="sm" data-testid="button-view-all-jobs">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentJobs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No jobs yet</p>
            ) : (
              recentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`card-job-${job.id}`}
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.customerName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <PriorityIndicator priority={job.priority} />
                    <StatusBadge status={job.status} type="job" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-medium mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <Link href="/customers">
              <Button className="w-full justify-start" variant="outline" data-testid="button-add-customer">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </Link>
            <Link href="/jobs">
              <Button className="w-full justify-start" variant="outline" data-testid="button-create-job">
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </Link>
            <Link href="/estimates">
              <Button className="w-full justify-start" variant="outline" data-testid="button-new-estimate">
                <Plus className="w-4 h-4 mr-2" />
                New Estimate
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
