import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Customer, Job } from "@shared/schema";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ReviewsWidget } from "@/components/ReviewsWidget";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users, Briefcase, CheckCircle2, DollarSign, Plus, Sparkles, Settings, Clock, TrendingUp, Package, LineChart as LineChartIcon } from "lucide-react";
import { Link } from "wouter";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";
import DualTemperatureGauge from "@/components/DualTemperatureGauge";

type TileId = 
  | "total-customers"
  | "active-jobs"
  | "completed-jobs"
  | "total-revenue"
  | "avg-job-length"
  | "avg-job-price"
  | "most-common-product"
  | "most-popular-service";

const DEFAULT_TILES: TileId[] = [
  "total-customers",
  "active-jobs",
  "completed-jobs",
  "total-revenue",
  "most-common-product",
  "most-popular-service",
];

export default function Dashboard() {
  const [visibleTiles, setVisibleTiles] = useState<TileId[]>(DEFAULT_TILES);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);

  useEffect(() => {
    // Migrate old dashboard-tiles to new analytic-center-tiles key
    const oldSaved = localStorage.getItem("dashboard-tiles");
    const newSaved = localStorage.getItem("analytic-center-tiles");
    
    if (oldSaved && !newSaved) {
      // Migrate old preferences to new key
      localStorage.setItem("analytic-center-tiles", oldSaved);
      localStorage.removeItem("dashboard-tiles");
    }
    
    const saved = localStorage.getItem("analytic-center-tiles");
    if (saved) {
      try {
        setVisibleTiles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load tile preferences", e);
      }
    }
  }, []);

  const toggleTile = (tileId: TileId) => {
    const newTiles = visibleTiles.includes(tileId)
      ? visibleTiles.filter(id => id !== tileId)
      : [...visibleTiles, tileId];
    setVisibleTiles(newTiles);
    localStorage.setItem("analytic-center-tiles", JSON.stringify(newTiles));
  };

  interface CustomerWithMetrics extends Customer {
    totalSpent: number;
    activeJobsCount: number;
  }

  const { data: customersWithMetrics = [] } = useQuery<CustomerWithMetrics[]>({
    queryKey: ["/api/customers/metrics"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: popularService } = useQuery<{serviceId: string | null; serviceName: string; usageCount: number} | null>({
    queryKey: ["/api/analytics/most-popular-service"],
  });

  const activeJobs = jobs.filter(j => j.status === "in-progress" || j.status === "pending");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const totalRevenue = jobs
    .filter(j => j.status === "completed")
    .reduce((sum, job) => sum + Number(job.price || 0), 0);

  // Calculate average job length (in days)
  const avgJobLength = (() => {
    const jobsWithCompletion = completedJobs.filter(job => job.completedAt);
    if (jobsWithCompletion.length === 0) return 0;
    const totalDays = jobsWithCompletion.reduce((sum, job) => {
      const received = new Date(job.receivedDate);
      const completed = new Date(job.completedAt!);
      const days = Math.abs(completed.getTime() - received.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    return Math.round(totalDays / jobsWithCompletion.length);
  })();

  // Calculate average job price
  const avgJobPrice = jobs.length > 0
    ? jobs.reduce((sum, job) => sum + Number(job.price || 0), 0) / jobs.length
    : 0;

  // Find top 2 most common coating types
  const topCoatingTypes = (() => {
    const validJobs = jobs.filter(job => job.coatingType);
    if (validJobs.length === 0) return [];
    const counts = validJobs.reduce((acc, job) => {
      acc[job.coatingType] = (acc[job.coatingType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return sorted.slice(0, 2).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
    }));
  })();

  const recentJobs = jobs
    .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
    .slice(0, 10)
    .map(job => {
      const customer = customers.find(c => c.id === job.customerId);
      return {
        ...job,
        customerName: customer?.name || "Unknown Customer",
        customerDeleted: job.customerId === null,
      };
    });

  const tiles = [
    {
      id: "total-customers" as TileId,
      title: "Total Customers",
      value: customers.length,
      icon: Users,
    },
    {
      id: "active-jobs" as TileId,
      title: "Active Jobs",
      value: activeJobs.length,
      icon: Briefcase,
    },
    {
      id: "completed-jobs" as TileId,
      title: "Completed Jobs",
      value: completedJobs.length,
      icon: CheckCircle2,
    },
    {
      id: "total-revenue" as TileId,
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
    },
    {
      id: "avg-job-length" as TileId,
      title: "Avg Job Length",
      value: `${avgJobLength} days`,
      icon: Clock,
    },
    {
      id: "avg-job-price" as TileId,
      title: "Avg Job Price",
      value: `$${avgJobPrice.toFixed(2)}`,
      icon: TrendingUp,
    },
    {
      id: "most-common-product" as TileId,
      title: "Most Common",
      value: topCoatingTypes.length > 0 
        ? topCoatingTypes.map(t => `${t.type} (${t.count})`).join("  •  ")
        : "N/A",
      icon: Package,
    },
    {
      id: "most-popular-service" as TileId,
      title: "Most Popular Service",
      value: popularService
        ? `${popularService.serviceName} (${popularService.usageCount})`
        : "N/A",
      icon: Sparkles,
    },
  ];

  const visibleTileData = tiles.filter(tile => visibleTiles.includes(tile.id));

  // Calculate monthly revenue for the current year
  const currentYear = new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const monthlyRevenueData = monthNames.map((month, index) => {
    // Filter jobs that were received in this month of the current year
    const monthRevenue = jobs
      .filter(job => {
        const jobDate = new Date(job.receivedDate);
        return jobDate.getFullYear() === currentYear && jobDate.getMonth() === index;
      })
      .reduce((sum, job) => sum + Number(job.price || 0), 0);
    
    return {
      month,
      revenue: monthRevenue,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Analytic Center</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome to your coating management hub</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="hidden sm:block">
            <ReviewsWidget />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              data-testid="button-dashboard-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Link href="/jobs">
              <Button data-testid="button-new-job" size="default" className="sm:text-base">
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile reviews widget */}
      <div className="sm:hidden">
        <ReviewsWidget />
      </div>

      {/* Recent Jobs Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Newest Jobs
          </h2>
          <Link href="/jobs">
            <Button variant="outline" size="sm" data-testid="button-view-all-jobs">
              View All
            </Button>
          </Link>
        </div>
        <div className="space-y-2">
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
                className="flex items-center justify-between gap-4 p-2.5 border rounded-lg hover-elevate transition-all cursor-pointer"
                onClick={() => setViewingJob(job)}
                data-testid={`card-job-${job.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium text-sm ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                      {job.customerName}
                    </h3>
                    {job.coatingType && (
                      <Badge variant="outline" className="capitalize text-xs">
                        {job.coatingType}
                      </Badge>
                    )}
                  </div>
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

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-10 gap-3 sm:gap-4 md:gap-6">
        {visibleTileData.map((tile) => (
          <StatsCard 
            key={tile.id}
            title={tile.title} 
            value={tile.value} 
            icon={tile.icon}
            className={tile.id === "most-common-product" ? "col-span-2 md:col-span-3 lg:col-span-5" : "lg:col-span-2"}
            valueClassName={tile.id === "most-common-product" ? "text-lg sm:text-xl whitespace-nowrap" : undefined}
          />
        ))}
      </div>

      {/* Graphs Section */}
      <DualTemperatureGauge jobs={jobs} />

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-6 flex-wrap">
          <LineChartIcon className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-medium">Monthly Revenue - {currentYear}</h2>
          <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">Revenue per month</span>
        </div>
        <ResponsiveContainer width="100%" height={250} className="sm:hidden">
          <AreaChart data={monthlyRevenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-lg">
                    <div className="grid gap-1">
                      <div className="font-medium text-xs">{data.month} {currentYear}</div>
                      <div className="text-sm font-bold text-primary">
                        ${data.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={350} className="hidden sm:block">
          <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <ChartTooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <div className="grid gap-1">
                      <div className="font-medium text-sm">{data.month} {currentYear}</div>
                      <div className="text-lg font-bold text-primary">
                        ${data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-2))"
              strokeWidth={3}
              fill="url(#revenueGradient)"
              dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

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
                    className={`font-medium ${viewingJob.customerId === null ? 'text-muted-foreground line-through' : ''}`}
                    data-testid="detail-customer"
                  >
                    {viewingJob.customerName}
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Analytic Center Tiles</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select which metrics to display in your Analytic Center
            </p>
            {tiles.map((tile) => (
              <div key={tile.id} className="flex items-center space-x-2">
                <Checkbox
                  id={tile.id}
                  checked={visibleTiles.includes(tile.id)}
                  onCheckedChange={() => toggleTile(tile.id)}
                  data-testid={`checkbox-tile-${tile.id}`}
                />
                <Label
                  htmlFor={tile.id}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {tile.title}
                </Label>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
