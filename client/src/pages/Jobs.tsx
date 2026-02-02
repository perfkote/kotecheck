import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Job, JobWithServices, Customer, CreateJobInput } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { canCreateJobs, canDeleteJobs, canAccessJobs } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { 
  Plus, 
  Search, 
  Briefcase, 
  ChevronDown, 
  ChevronUp,
  Clock,
  CheckCircle2,
  Flame,
  Phone,
  Calendar,
  Sparkles,
  PauseCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ============================================
// HELPER FUNCTIONS
// ============================================

const getJobAgeColors = (ageDays: number) => {
  if (ageDays <= 7) return {
    bg: 'bg-green-500/5',
    border: 'border-l-green-500',
    badge: 'bg-green-100 text-green-700 border-green-200'
  };
  if (ageDays <= 10) return {
    bg: 'bg-yellow-500/5',
    border: 'border-l-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };
  if (ageDays <= 20) return {
    bg: 'bg-orange-500/5',
    border: 'border-l-orange-500',
    badge: 'bg-orange-100 text-orange-700 border-orange-200'
  };
  return {
    bg: 'bg-red-500/5',
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200'
  };
};

// Ghost jobs - IDs that exist in cache but not in database
const GHOST_JOB_IDS = [
  '94d885a1-fa50-41e0-9752-1da1fa09695b',
  '5c4e40b4-9bc2-4cf6-8418-bcb0260c0082',
  '99f0f3a1-658c-4f39-ad95-f97b51c901c5',
  '87855028-1f0d-4e83-846f-63d66333aab8',
  'a26ff481-ce4b-4bb3-aca4-eb0eb399b15e',
  'd9b68e72-e1a7-455b-aaa1-785ca80a6f7f',
  '8e1c1cf3-cae8-4629-8f38-6e7b589376bd',
  '24f14775-5964-4e3f-9bdd-6454e5ea6041'
];

// ============================================
// MAIN COMPONENT
// ============================================

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
  const [showOnHold, setShowOnHold] = useState(true);
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

  // ============================================
  // MUTATIONS
  // ============================================

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
    onError: (error: any) => {
      if (error?.message?.includes('404')) {
        queryClient.setQueryData(["/api/jobs"], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.filter((job: any) => job.id !== deletingJob?.id);
        });
        setDeletingJob(null);
        toast({
          title: "Ghost Job Removed",
          description: "Job didn't exist in database, removed from display",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete job",
          variant: "destructive",
        });
        setDeletingJob(null);
      }
    },
  });

  // ============================================
  // COMPUTED DATA
  // ============================================

  const jobsWithCustomerNames = useMemo(() => {
    return jobs
      .filter(job => !GHOST_JOB_IDS.includes(job.id))
      .map(job => {
        const customer = customers.find(c => c.id === job.customerId);
        const ageDays = Math.ceil((Date.now() - new Date(job.receivedDate).getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...job,
          customerName: customer?.name || "Unknown Customer",
          customerDeleted: job.customerId === null,
          ageDays,
        };
      });
  }, [jobs, customers]);

  const stats = useMemo(() => {
    const active = jobsWithCustomerNames.filter(j => j.status !== 'paid' && j.status !== 'finished' && j.status !== 'on_hold');
    const completed = jobsWithCustomerNames.filter(j => j.status === 'paid' || j.status === 'finished');
    const onHold = jobsWithCustomerNames.filter(j => j.status === 'on_hold');
    const urgent = active.filter(j => j.ageDays > 20);
    const received = active.filter(j => j.status === 'received');
    const inProgress = active.filter(j => j.status === 'prepped' || j.status === 'coated');
    
    const activeValue = active.reduce((sum, j) => sum + Number(j.price), 0);

    return {
      active: active.length,
      completed: completed.length,
      onHold: onHold.length,
      urgent: urgent.length,
      received: received.length,
      inProgress: inProgress.length,
      activeValue,
    };
  }, [jobsWithCustomerNames]);

  const activeJobs = useMemo(() => {
    return jobsWithCustomerNames
      .filter(job => job.status !== 'paid' && job.status !== 'finished' && job.status !== 'on_hold')
      .filter(job => {
        const matchesSearch = job.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || job.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.ageDays - a.ageDays);
  }, [jobsWithCustomerNames, searchQuery, statusFilter]);

  const onHoldJobs = useMemo(() => {
    return jobsWithCustomerNames
      .filter(job => job.status === 'on_hold')
      .filter(job => {
        const matchesSearch = job.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.customerName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => b.ageDays - a.ageDays);
  }, [jobsWithCustomerNames, searchQuery]);

  const completedJobs = useMemo(() => {
    return jobsWithCustomerNames
      .filter(job => job.status === 'paid' || job.status === 'finished')
      .filter(job => {
        const matchesSearch = job.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.customerName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }, [jobsWithCustomerNames, searchQuery]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading jobs...</div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Jobs</h1>
              <p className="text-slate-400 text-sm sm:text-base mt-1">Track and manage your active work</p>
            </div>
            {canCreateJobs(user) && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] h-11"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATS ROW */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">Active Jobs</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats.active}</p>
                {stats.urgent > 0 && (
                  <p className="text-[11px] sm:text-xs text-red-500 mt-1 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {stats.urgent} need attention
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
                <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">Pipeline Value</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">${(stats.activeValue / 1000).toFixed(1)}k</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">in active jobs</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow cursor-pointer active:bg-accent/50"
              onClick={() => setStatusFilter('received')}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">Received</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats.received}</p>
                <p className="text-[11px] sm:text-xs text-amber-600 mt-1">awaiting prep</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wide">Completed</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stats.completed}</p>
                <p className="text-[11px] sm:text-xs text-green-600 mt-1">total finished</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* SEARCH & FILTERS */}
      {/* ============================================ */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or tracking ID..."
            className="pl-10 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="whitespace-nowrap h-9 px-3 text-sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === "received" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("received")}
            className="whitespace-nowrap h-9 px-3 text-sm"
          >
            Received
          </Button>
          <Button
            variant={statusFilter === "prepped" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("prepped")}
            className="whitespace-nowrap h-9 px-3 text-sm"
          >
            Prepped
          </Button>
          <Button
            variant={statusFilter === "coated" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("coated")}
            className="whitespace-nowrap h-9 px-3 text-sm"
          >
            Coated
          </Button>
        </div>
      </div>

      {/* Age Legend */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="font-medium">Age:</span>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> 0-7d</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> 8-10d</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> 11-20d</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> 21+d</div>
      </div>

      {/* ============================================ */}
      {/* ACTIVE JOBS */}
      {/* ============================================ */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
          Active Jobs ({activeJobs.length})
        </h2>

        {activeJobs.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center">
            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" ? "No jobs match your filters" : "No active jobs"}
            </p>
          </Card>
        ) : (
          <>
            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-3">
              {activeJobs.map((job) => {
                const colors = getJobAgeColors(job.ageDays);
                const isUrgent = job.ageDays > 20;
                
                return (
                  <Card 
                    key={job.id}
                    className={`overflow-hidden border-l-4 ${colors.border} ${isUrgent ? 'ring-2 ring-red-500/30' : ''} active:bg-accent/50`}
                    onClick={() => setEditingJob(job)}
                  >
                    <CardContent className="p-4 cursor-pointer">
                      {/* Row 1: Customer + Price */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold text-base ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                              {job.customerName}
                            </h3>
                            {isUrgent && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs px-2 py-0.5">
                                URGENT
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold">${Number(job.price).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Row 2: Items description */}
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.items || 'No description'}</p>

                      {/* Row 3: Status, Age, Date */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={job.status} type="job" />
                        <Badge variant="outline" className={`text-xs px-2 py-0.5 h-6 ${colors.badge}`}>
                          {job.ageDays}d old
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(job.receivedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* DESKTOP VIEW */}
            <Card className="hidden md:block overflow-hidden">
              <div className="divide-y">
                {activeJobs.map((job) => {
                  const colors = getJobAgeColors(job.ageDays);
                  const isUrgent = job.ageDays > 20;
                  
                  return (
                    <div 
                      key={job.id}
                      className={`p-4 flex items-center gap-6 hover:bg-accent/50 cursor-pointer transition-colors border-l-4 ${colors.border}`}
                      onClick={() => setEditingJob(job)}
                    >
                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={`font-semibold text-sm ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                            {job.customerName}
                          </h3>
                          {isUrgent && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                              URGENT
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="truncate max-w-[200px]">{job.items || 'No description'}</span>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Phone className="w-3 h-3" />
                            {job.phoneNumber}
                          </span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="w-24 text-sm text-muted-foreground hidden lg:flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(job.receivedDate).toLocaleDateString()}
                      </div>

                      {/* Status */}
                      <div className="w-24">
                        <StatusBadge status={job.status} type="job" />
                      </div>

                      {/* Age */}
                      <div className="w-14">
                        <Badge variant="outline" className={colors.badge}>
                          {job.ageDays}d
                        </Badge>
                      </div>

                      {/* Price */}
                      <div className="w-24 text-right">
                        <p className="text-lg font-bold">${Number(job.price).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ============================================ */}
      {/* ON HOLD JOBS */}
      {/* ============================================ */}
      {onHoldJobs.length > 0 && (
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between mb-3 text-base font-semibold h-12"
            onClick={() => setShowOnHold(!showOnHold)}
          >
            <span className="flex items-center gap-2">
              <PauseCircle className="w-5 h-5 text-amber-500" />
              On Hold ({onHoldJobs.length})
            </span>
            {showOnHold ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
          
          {showOnHold && (
            <>
              {/* MOBILE VIEW */}
              <div className="md:hidden space-y-3">
                {onHoldJobs.map((job) => {
                  const colors = getJobAgeColors(job.ageDays);
                  
                  return (
                    <Card 
                      key={job.id}
                      className="overflow-hidden border-l-4 border-l-amber-500 active:bg-accent/50"
                      onClick={() => setEditingJob(job)}
                    >
                      <CardContent className="p-4 cursor-pointer">
                        {/* Row 1: Customer + Price */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className={`font-semibold text-base ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                            {job.customerName}
                          </h3>
                          <p className="text-lg font-bold flex-shrink-0">${Number(job.price).toFixed(2)}</p>
                        </div>
                        
                        {/* Row 2: Items */}
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.items || 'No description'}</p>
                        
                        {/* Row 3: Status + Age */}
                        <div className="flex items-center gap-2">
                          <StatusBadge status={job.status} type="job" />
                          <Badge variant="outline" className={`text-xs px-2 py-0.5 h-6 ${colors.badge}`}>
                            {job.ageDays}d old
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(job.receivedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* DESKTOP VIEW */}
              <Card className="hidden md:block overflow-hidden">
                <div className="divide-y">
                  {onHoldJobs.map((job) => {
                    const colors = getJobAgeColors(job.ageDays);
                    
                    return (
                      <div 
                        key={job.id}
                        className="p-4 flex items-center gap-6 hover:bg-accent/50 cursor-pointer transition-colors border-l-4 border-l-amber-500"
                        onClick={() => setEditingJob(job)}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-sm ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                            {job.customerName}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="truncate max-w-[200px]">{job.items || 'No description'}</span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Phone className="w-3 h-3" />
                              {job.phoneNumber}
                            </span>
                          </div>
                        </div>
                        <div className="w-24 text-sm text-muted-foreground hidden lg:flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(job.receivedDate).toLocaleDateString()}
                        </div>
                        <div className="w-24">
                          <StatusBadge status={job.status} type="job" />
                        </div>
                        <div className="w-14">
                          <Badge variant="outline" className={colors.badge}>
                            {job.ageDays}d
                          </Badge>
                        </div>
                        <div className="w-24 text-right">
                          <p className="text-lg font-bold">${Number(job.price).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* COMPLETED JOBS */}
      {/* ============================================ */}
      {completedJobs.length > 0 && (
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between mb-3 text-base font-semibold h-12"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Completed Jobs ({completedJobs.length})
            </span>
            {showCompleted ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
          
          {showCompleted && (
            <>
              {/* MOBILE VIEW */}
              <div className="md:hidden space-y-3 opacity-75">
                {completedJobs.slice(0, 20).map((job) => (
                  <Card 
                    key={job.id}
                    className="overflow-hidden border-l-4 border-l-green-500 active:bg-accent/50"
                    onClick={() => setEditingJob(job)}
                  >
                    <CardContent className="p-4 cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-base ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                            {job.customerName}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{job.items || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={job.status} type="job" />
                          <span className="font-bold text-base">${Number(job.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* DESKTOP VIEW */}
              <Card className="hidden md:block overflow-hidden opacity-75">
                <div className="divide-y">
                  {completedJobs.slice(0, 20).map((job) => (
                    <div 
                      key={job.id}
                      className="p-4 flex items-center gap-6 hover:bg-accent/50 cursor-pointer transition-colors border-l-4 border-l-green-500"
                      onClick={() => setEditingJob(job)}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm ${job.customerDeleted ? 'text-muted-foreground line-through' : ''}`}>
                          {job.customerName}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{job.items || 'No description'}</p>
                      </div>
                      <div className="w-24 text-sm text-muted-foreground hidden lg:block">
                        {new Date(job.receivedDate).toLocaleDateString()}
                      </div>
                      <div className="w-24">
                        <StatusBadge status={job.status} type="job" />
                      </div>
                      <div className="w-24 text-right">
                        <p className="text-lg font-bold">${Number(job.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* CREATE DIALOG */}
      {/* ============================================ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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

      {/* ============================================ */}
      {/* EDIT DIALOG */}
      {/* ============================================ */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
              onDelete={canDeleteJobs(user) ? () => setDeletingJob(editingJob) : undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* VIEW DIALOG */}
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

              {viewingJob.items && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Items</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{viewingJob.items}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => {
                    setViewingJob(null);
                    setEditingJob(viewingJob);
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

      {/* ============================================ */}
      {/* DELETE CONFIRMATION */}
      {/* ============================================ */}
      <AlertDialog open={!!deletingJob} onOpenChange={(open) => !open && setDeletingJob(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete job <span className="font-mono font-semibold">{deletingJob?.trackingId}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingJob) {
                  deleteMutation.mutate(deletingJob.id);
                  setEditingJob(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
