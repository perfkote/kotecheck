import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Job, JobWithServices, Customer, Estimate, Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Trophy,
  Flame,
  Sparkles,
  ArrowRight,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ============================================
// HELPER FUNCTIONS
// ============================================

const getJobAgeColors = (ageDays: number) => {
  if (ageDays <= 7) return {
    bg: 'bg-green-500/5',
    border: 'border-l-green-500',
    badge: 'bg-green-500/15 text-green-700 border-green-500/30',
    dot: 'bg-green-500'
  };
  if (ageDays <= 10) return {
    bg: 'bg-yellow-500/5',
    border: 'border-l-yellow-500',
    badge: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
    dot: 'bg-yellow-500'
  };
  if (ageDays <= 20) return {
    bg: 'bg-orange-500/5',
    border: 'border-l-orange-500',
    badge: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
    dot: 'bg-orange-500'
  };
  return {
    bg: 'bg-red-500/5',
    border: 'border-l-red-500',
    badge: 'bg-red-500/15 text-red-700 border-red-500/30',
    dot: 'bg-red-500'
  };
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Determine a job's coating category from its attached services.
 * Uses the service records fetched separately for accurate category lookup.
 * Falls back to coatingType field, then "other".
 */
function getJobCoatingCategory(job: JobWithServices, serviceMap: Map<string, Service>): 'powder' | 'ceramic' | 'mixed' | 'other' {
  // Look at actual services attached to the job
  if (job.services && job.services.length > 0) {
    const categories = new Set<string>();
    for (const js of job.services) {
      const svc = serviceMap.get(js.serviceId);
      if (svc) {
        if (svc.category === 'powder' || svc.category === 'ceramic') {
          categories.add(svc.category);
        }
      } else {
        // Fallback: try to infer from service name
        const name = js.serviceName.toLowerCase();
        if (name.includes('powder')) categories.add('powder');
        else if (name.includes('ceramic')) categories.add('ceramic');
      }
    }
    
    if (categories.has('powder') && categories.has('ceramic')) return 'mixed';
    if (categories.has('powder')) return 'powder';
    if (categories.has('ceramic')) return 'ceramic';
  }
  
  // Fallback to coatingType field
  if (job.coatingType === 'powder') return 'powder';
  if (job.coatingType === 'ceramic') return 'ceramic';
  if (job.coatingType === 'misc') return 'mixed';
  
  return 'other';
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [viewingJob, setViewingJob] = useState<JobWithServices | null>(null);

  // Data fetching
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobWithServices[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: estimates = [] } = useQuery<Estimate[]>({
    queryKey: ["/api/estimates"],
  });

  const { data: allServices = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Build a lookup map for services
  const serviceMap = useMemo(() => {
    const map = new Map<string, Service>();
    for (const svc of allServices) {
      map.set(svc.id, svc);
    }
    return map;
  }, [allServices]);

  // ============================================
  // COMPUTED DATA
  // ============================================

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Filter jobs for current year
    const currentYearJobs = jobs.filter(j => {
      const jobDate = new Date(j.receivedDate);
      return jobDate.getFullYear() === currentYear;
    });
    
    // Active jobs (not paid/finished)
    const activeJobs = jobs.filter(j => j.status !== 'paid' && j.status !== 'finished');
    
    // Completed jobs - current year
    const completedJobsCurrentYear = currentYearJobs.filter(j => j.status === 'paid' || j.status === 'finished');
    
    // Coating type breakdown - derived from actual services
    const ceramicJobs = currentYearJobs.filter(j => getJobCoatingCategory(j, serviceMap) === 'ceramic');
    const powderJobs = currentYearJobs.filter(j => getJobCoatingCategory(j, serviceMap) === 'powder');
    const mixedJobs = currentYearJobs.filter(j => getJobCoatingCategory(j, serviceMap) === 'mixed');
    const otherJobs = currentYearJobs.filter(j => getJobCoatingCategory(j, serviceMap) === 'other');
    
    // Revenue calculations
    const ceramicRevenue = ceramicJobs.reduce((sum, j) => sum + Number(j.price), 0);
    const powderRevenue = powderJobs.reduce((sum, j) => sum + Number(j.price), 0);
    const mixedRevenue = mixedJobs.reduce((sum, j) => sum + Number(j.price), 0);
    const otherRevenue = otherJobs.reduce((sum, j) => sum + Number(j.price), 0);
    const totalRevenue = currentYearJobs.reduce((sum, j) => sum + Number(j.price), 0);
    
    // Average completion time
    const completionTimes = completedJobsCurrentYear
      .filter(j => j.receivedDate)
      .map(j => {
        const received = new Date(j.receivedDate);
        const completed = j.updatedAt ? new Date(j.updatedAt) : now;
        return Math.ceil((completed.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
      })
      .filter(days => days > 0 && days < 365);
    
    const avgCompletionDays = completionTimes.length > 0 
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;
    
    // Revenue by month - last 12 months
    const revenueByMonth: { month: string; revenue: number; jobs: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, now.getMonth() - i, 1);
      const monthJobs = jobs.filter(j => {
        const jobDate = new Date(j.receivedDate);
        return jobDate.getMonth() === date.getMonth() && 
               jobDate.getFullYear() === date.getFullYear();
      });
      revenueByMonth.push({
        month: MONTH_NAMES[date.getMonth()],
        revenue: monthJobs.reduce((sum, j) => sum + Number(j.price), 0),
        jobs: monthJobs.length,
      });
    }
    
    // Best month - current year
    const currentYearByMonth: { month: string; revenue: number; jobs: number }[] = [];
    for (let i = 0; i <= now.getMonth(); i++) {
      const monthJobs = currentYearJobs.filter(j => {
        const jobDate = new Date(j.receivedDate);
        return jobDate.getMonth() === i;
      });
      currentYearByMonth.push({
        month: MONTH_NAMES[i],
        revenue: monthJobs.reduce((sum, j) => sum + Number(j.price), 0),
        jobs: monthJobs.length,
      });
    }
    
    const bestMonth = currentYearByMonth.reduce((best, current) => 
      current.revenue > best.revenue ? current : best
    , { month: '', revenue: 0, jobs: 0 });
    
    // Jobs needing attention (over 7 days old and not completed)
    const urgentJobs = activeJobs.filter(j => {
      const ageDays = Math.ceil((now.getTime() - new Date(j.receivedDate).getTime()) / (1000 * 60 * 60 * 24));
      return ageDays > 7;
    });

    return {
      activeJobs,
      completedJobs: completedJobsCurrentYear,
      ceramicJobs,
      powderJobs,
      mixedJobs,
      otherJobs,
      ceramicRevenue,
      powderRevenue,
      mixedRevenue,
      otherRevenue,
      totalRevenue,
      avgCompletionDays,
      revenueByMonth,
      bestMonth,
      urgentJobs,
      totalCustomers: customers.length,
      pendingEstimates: estimates.filter(e => e.status === 'pending').length,
      currentYear,
    };
  }, [jobs, customers, estimates, serviceMap]);

  // Active jobs with customer names, sorted newest first
  const activeJobsWithDetails = useMemo(() => {
    return stats.activeJobs
      .map(job => {
        const customer = customers.find(c => c.id === job.customerId);
        const ageDays = Math.ceil((Date.now() - new Date(job.receivedDate).getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...job,
          customerName: customer?.name || "Unknown Customer",
          customerDeleted: job.customerId === null,
          ageDays,
        };
      })
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }, [stats.activeJobs, customers]);

  // Pie chart data for coating types - now with 4 categories
  const coatingData = [
    { name: 'Powder', value: stats.powderRevenue, count: stats.powderJobs.length, color: '#3b82f6' },
    { name: 'Ceramic', value: stats.ceramicRevenue, count: stats.ceramicJobs.length, color: '#f97316' },
    { name: 'Mixed', value: stats.mixedRevenue, count: stats.mixedJobs.length, color: '#10b981' },
    { name: 'Other', value: stats.otherRevenue, count: stats.otherJobs.length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* ============================================ */}
      {/* HEADER WITH QUICK ACTIONS */}
      {/* ============================================ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Performance Kote at a glance</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Button 
              onClick={() => setLocation("/jobs?action=create")}
              className="h-auto py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02]"
            >
              <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                <Briefcase className="w-5 h-5 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">New Job</span>
              </div>
            </Button>
            <Button 
              onClick={() => setLocation("/estimates?action=create")}
              className="h-auto py-3 sm:py-4 bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                <FileText className="w-5 h-5 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">New Estimate</span>
              </div>
            </Button>
            <Button 
              onClick={() => setLocation("/customers?action=create")}
              className="h-auto py-3 sm:py-4 bg-purple-500 hover:bg-purple-600 text-white border-0 shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:scale-[1.02]"
            >
              <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                <Users className="w-5 h-5 sm:w-5 sm:h-5" />
                <span className="text-xs font-medium">New Customer</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATS CARDS ROW */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">Active Jobs</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats.activeJobs.length}</p>
                {stats.urgentJobs.length > 0 && (
                  <p className="text-[11px] sm:text-xs text-red-500 mt-1 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {stats.urgentJobs.length} need attention
                  </p>
                )}
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">{stats.currentYear} Avg Turn</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats.avgCompletionDays}<span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">days</span></p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">{stats.currentYear} Best Month</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats.bestMonth.month || 'N/A'}</p>
                <p className="text-[11px] sm:text-xs text-green-600 mt-1">
                  ${stats.bestMonth.revenue.toLocaleString()}
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">{stats.currentYear} Revenue</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">${(stats.totalRevenue / 1000).toFixed(1)}k</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                  {stats.ceramicJobs.length + stats.powderJobs.length + stats.mixedJobs.length + stats.otherJobs.length} jobs
                </p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* MAIN CONTENT GRID */}
      {/* ============================================ */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                Active Jobs
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/jobs")}
                className="text-xs h-8"
              >
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> 0-7d</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> 8-10d</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> 11-20d</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> 21+d</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeJobsWithDetails.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No active jobs - time to drum up business!</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {/* MOBILE VIEW */}
                <div className="sm:hidden divide-y">
                  {activeJobsWithDetails.slice(0, 10).map((job) => {
                    const colors = getJobAgeColors(job.ageDays);
                    
                    return (
                      <div
                        key={job.id}
                        className={`p-4 active:bg-accent/70 cursor-pointer transition-colors border-l-4 ${colors.border}`}
                        onClick={() => setViewingJob(job)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className={`font-semibold text-base ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                            {job.customerName}
                          </div>
                          <span className="font-bold text-lg flex-shrink-0">
                            ${Number(job.price).toFixed(0)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-3 line-clamp-1">
                          {job.items || 'No description'}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <StatusBadge status={job.status} type="job" />
                          <Badge variant="outline" className={`text-xs px-2 py-0.5 h-6 font-medium border ${colors.badge}`}>
                            {job.ageDays}d old
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DESKTOP VIEW */}
                <div className="hidden sm:block divide-y">
                  {activeJobsWithDetails.slice(0, 10).map((job) => {
                    const colors = getJobAgeColors(job.ageDays);
                    
                    return (
                      <div
                        key={job.id}
                        className={`p-3 hover:bg-accent/50 cursor-pointer transition-colors border-l-4 ${colors.border}`}
                        onClick={() => setViewingJob(job)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                              {job.customerName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {job.items || 'No description'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={job.status} type="job" />
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium border ${colors.badge}`}>
                              {job.ageDays}d
                            </Badge>
                            <span className="font-bold text-sm">
                              ${Number(job.price).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* COATING TYPE BREAKDOWN */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              Coating Breakdown
              <span className="text-xs sm:text-sm font-normal text-muted-foreground">({stats.currentYear})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            {coatingData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No job data yet
              </div>
            ) : (
              <>
                <div className="h-36 sm:h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={coatingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {coatingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2">
                  {coatingData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">({item.count})</span>
                      </div>
                      <span className="font-medium">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* REVENUE CHART */}
      {/* ============================================ */}
      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            Revenue Trend
            <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-2">(Last 12 Months)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                    return [value, 'Jobs'];
                  }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* QUICK STATS FOOTER */}
      {/* ============================================ */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-3 sm:p-4 text-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-purple-500 mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold">{stats.totalCustomers}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Customers</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-3 sm:p-4 text-center">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-blue-500 mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold">{stats.pendingEstimates}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Pending Est.</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="p-3 sm:p-4 text-center">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-green-500 mb-1 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold">{stats.completedJobs.length}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* JOB DETAILS DIALOG */}
      {/* ============================================ */}
      <Dialog open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {viewingJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tracking ID</p>
                  <p className="font-mono font-semibold">{viewingJob.trackingId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={viewingJob.status} type="job" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {customers.find(c => c.id === viewingJob.customerId)?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-bold text-lg">${Number(viewingJob.price).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Coating Type</p>
                  <Badge variant="outline" className="capitalize mt-1">
                    {getJobCoatingCategory(viewingJob, serviceMap)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Received</p>
                  <p>{new Date(viewingJob.receivedDate).toLocaleDateString()}</p>
                </div>
              </div>

              {viewingJob.items && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Items</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{viewingJob.items}</p>
                </div>
              )}

              {viewingJob.detailedNotes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{viewingJob.detailedNotes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => {
                    setViewingJob(null);
                    setLocation(`/jobs?edit=${viewingJob.id}`);
                  }}
                  className="flex-1 h-11"
                >
                  Edit Job
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setViewingJob(null)}
                  className="h-11"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
