import { useQuery } from "@tanstack/react-query";
import type { Customer, Job } from "@shared/schema";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, CheckCircle2, DollarSign, Plus, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const activeJobs = jobs.filter(j => j.status === "in-progress" || j.status === "pending");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const totalRevenue = jobs
    .filter(j => j.status === "completed")
    .reduce((sum, job) => sum + Number(job.price || 0), 0);

  const recentJobs = jobs
    .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
    .slice(0, 5)
    .map(job => ({
      ...job,
      customerName: customers.find(c => c.id === job.customerId)?.name || "Unknown",
    }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to your coating management hub</p>
        </div>
        <Link href="/jobs">
          <Button data-testid="button-new-job" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
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
          title="Completed Jobs" 
          value={completedJobs.length} 
          icon={CheckCircle2}
        />
        <StatsCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(2)}`} 
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Recent Jobs
            </h2>
            <Link href="/jobs">
              <Button variant="outline" size="sm" data-testid="button-view-all-jobs">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No jobs yet</p>
                <p className="text-sm text-muted-foreground">Create your first job to get started</p>
              </div>
            ) : (
              recentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between gap-4 p-4 border rounded-lg hover-elevate transition-all"
                  data-testid={`card-job-${job.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium font-mono text-sm">{job.trackingId}</h3>
                      <Badge variant="outline" className="capitalize text-xs">
                        {job.coatingType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{job.customerName}</p>
                    <p className="text-xs text-muted-foreground">{job.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-semibold">${Number(job.price).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.receivedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={job.status} type="job" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-medium mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/jobs">
              <Button className="w-full justify-start" variant="outline" data-testid="button-create-job">
                <Plus className="w-4 h-4 mr-2" />
                Create Job
              </Button>
            </Link>
            <Link href="/customers">
              <Button className="w-full justify-start" variant="outline" data-testid="button-add-customer">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </Link>
            <Link href="/estimates">
              <Button className="w-full justify-start" variant="outline" data-testid="button-new-estimate">
                <Plus className="w-4 h-4 mr-2" />
                New Estimate
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-medium mb-4">Coating Types</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Powder</span>
                <Badge variant="secondary">{jobs.filter(j => j.coatingType === "powder").length}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ceramic</span>
                <Badge variant="secondary">{jobs.filter(j => j.coatingType === "ceramic").length}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Both</span>
                <Badge variant="secondary">{jobs.filter(j => j.coatingType === "both").length}</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
