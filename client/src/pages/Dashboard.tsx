import { useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityIndicator } from "@/components/PriorityIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, FileText, DollarSign, Plus } from "lucide-react";
import { Link } from "wouter";

//todo: remove mock functionality
const mockRecentJobs = [
  { id: "1", title: "Engine Repair", customer: "Acme Corp", status: "in-progress", priority: "high" },
  { id: "2", title: "Oil Change", customer: "Tech Solutions", status: "pending", priority: "medium" },
  { id: "3", title: "Brake Service", customer: "Global Industries", status: "completed", priority: "low" },
  { id: "4", title: "Transmission Fix", customer: "Smith Auto", status: "in-progress", priority: "urgent" },
];

export default function Dashboard() {
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
          value={42} 
          icon={Users}
          trend="+12% from last month"
        />
        <StatsCard 
          title="Active Jobs" 
          value={15} 
          icon={Briefcase}
          trend="3 completed today"
        />
        <StatsCard 
          title="Pending Estimates" 
          value={8} 
          icon={FileText}
          trend="2 sent this week"
        />
        <StatsCard 
          title="Revenue (MTD)" 
          value="$12,450" 
          icon={DollarSign}
          trend="+8% vs last month"
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
            {mockRecentJobs.map((job) => (
              <div 
                key={job.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                data-testid={`card-job-${job.id}`}
              >
                <div className="flex-1">
                  <h3 className="font-medium">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">{job.customer}</p>
                </div>
                <div className="flex items-center gap-4">
                  <PriorityIndicator priority={job.priority} />
                  <StatusBadge status={job.status} type="job" />
                </div>
              </div>
            ))}
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
