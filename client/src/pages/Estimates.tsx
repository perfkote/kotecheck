import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Estimate, InsertEstimate, Job } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { canCreateEstimates } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  ArrowRight, 
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  TrendingUp,
  DollarSign,
  Calendar,
  Phone,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstimateForm } from "@/components/EstimateForm";
import { useToast } from "@/hooks/use-toast";

// ============================================
// STATUS CONFIGURATION
// ============================================

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950',
    badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-100',
    border: 'border-l-amber-500',
  },
  sent: {
    label: 'Sent',
    icon: Send,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950',
    badge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100',
    border: 'border-l-purple-500',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
    badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100',
    border: 'border-l-blue-500',
  },
  converted: {
    label: 'Converted',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950',
    badge: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100',
    border: 'border-l-green-500',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950',
    badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100',
    border: 'border-l-red-500',
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

// Age colors for pending estimates
const getAgeColors = (days: number) => {
  if (days <= 3) return { badge: 'bg-green-100 text-green-700 border-green-200' };
  if (days <= 7) return { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  if (days <= 14) return { badge: 'bg-orange-100 text-orange-700 border-orange-200' };
  return { badge: 'bg-red-100 text-red-700 border-red-200' };
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function Estimates() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: estimates = [], isLoading } = useQuery<Estimate[]>({
    queryKey: ["/api/estimates"],
  });

  // ============================================
  // MUTATIONS
  // ============================================

  type EstimateCreationData = InsertEstimate & { serviceIds: string[] };

  const createMutation = useMutation({
    mutationFn: async (estimate: EstimateCreationData) => {
      const estimateResponse = await apiRequest("POST", "/api/estimates", estimate);
      const newEstimate: Estimate = await estimateResponse.json();
      return newEstimate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      toast({ title: "Success", description: "Estimate created successfully" });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Failed to create estimate:", error);
      toast({ title: "Error", description: "Failed to create estimate", variant: "destructive" });
    },
  });

  const convertToJobMutation = useMutation({
    mutationFn: async (estimateId: string) => {
      const response = await apiRequest("POST", `/api/estimates/${estimateId}/convert-to-job`);
      return await response.json() as Job;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ 
        title: "Success", 
        description: "Estimate converted to job successfully" 
      });
      setLocation("/jobs");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to convert estimate to job";
      toast({ 
        title: "Error", 
        description: message, 
        variant: "destructive" 
      });
    },
  });

  // ============================================
  // COMPUTED DATA
  // ============================================

  const stats = useMemo(() => {
    const byStatus = (status: string) => estimates.filter(e => e.status === status);
    const pending = byStatus('pending');
    const sent = byStatus('sent');
    const approved = byStatus('approved');
    const converted = byStatus('converted');
    const rejected = byStatus('rejected');

    const pendingValue = [...pending, ...sent, ...approved].reduce(
      (sum, e) => sum + parseFloat(e.total), 0
    );

    const convertedValue = converted.reduce(
      (sum, e) => sum + parseFloat(e.total), 0
    );

    const totalEstimates = estimates.length;
    const conversionRate = totalEstimates > 0 
      ? Math.round((converted.length / totalEstimates) * 100) 
      : 0;

    const hotLeads = approved.length;

    return {
      pending: pending.length,
      sent: sent.length,
      approved: approved.length,
      converted: converted.length,
      rejected: rejected.length,
      pendingValue,
      convertedValue,
      conversionRate,
      hotLeads,
      total: totalEstimates,
    };
  }, [estimates]);

  const filteredEstimates = useMemo(() => {
    return estimates
      .filter(estimate => {
        const matchesSearch = 
          estimate.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          estimate.phone.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || estimate.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .map(estimate => {
        const ageDays = Math.ceil(
          (Date.now() - new Date(estimate.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return { ...estimate, ageDays };
      })
      .sort((a, b) => {
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (b.status === 'approved' && a.status !== 'approved') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [estimates, searchQuery, statusFilter]);

  const handleSubmit = async (data: EstimateCreationData) => {
    await createMutation.mutateAsync(data);
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading estimates...</div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="space-y-6 pb-8">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Estimates</h1>
              <p className="text-slate-400 mt-1">Create quotes and convert to jobs</p>
            </div>
            {canCreateEstimates(user) && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Estimate
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATS ROW */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => setStatusFilter('approved')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Hot Leads</p>
                <p className="text-2xl font-bold mt-1">{stats.hotLeads}</p>
                <p className="text-xs text-blue-600 mt-1">Ready to convert</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pipeline Value</p>
                <p className="text-2xl font-bold mt-1">${(stats.pendingValue / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.pending + stats.sent + stats.approved} estimates</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Conversion Rate</p>
                <p className="text-2xl font-bold mt-1">{stats.conversionRate}%</p>
                <p className="text-xs text-green-600 mt-1">{stats.converted} converted</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Won</p>
                <p className="text-2xl font-bold mt-1">${(stats.convertedValue / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground mt-1">from estimates</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* SEARCH & FILTERS */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="whitespace-nowrap"
          >
            All ({stats.total})
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className="whitespace-nowrap"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending ({stats.pending})
          </Button>
          <Button
            variant={statusFilter === "sent" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("sent")}
            className="whitespace-nowrap"
          >
            <Send className="w-3 h-3 mr-1" />
            Sent ({stats.sent})
          </Button>
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("approved")}
            className="whitespace-nowrap"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved ({stats.approved})
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* ESTIMATES LIST */}
      {/* ============================================ */}
      {estimates.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No estimates yet</h3>
          <p className="text-muted-foreground mb-4">Create your first estimate to start building your pipeline</p>
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <Link href="/services">
              <Button variant="outline">
                Manage Services
              </Button>
            </Link>
            {canCreateEstimates(user) && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Estimate
              </Button>
            )}
          </div>
        </Card>
      ) : filteredEstimates.length === 0 ? (
        <Card className="p-8 text-center">
          <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No estimates match your filters</p>
        </Card>
      ) : (
        <>
          {/* MOBILE VIEW */}
          <div className="md:hidden space-y-3">
            {filteredEstimates.map((estimate) => {
              const status = STATUS_CONFIG[estimate.status as StatusKey] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const ageColors = getAgeColors(estimate.ageDays);
              const isHotLead = estimate.status === 'approved';

              return (
                <Card 
                  key={estimate.id}
                  className={`overflow-hidden border-l-4 ${status.border} ${
                    isHotLead ? 'ring-2 ring-blue-500/20' : ''
                  }`}
                >
                  <CardContent className="p-3">
                    {/* Top: Name + Hot Lead Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">
                            {estimate.customerName}
                          </h3>
                          {isHotLead && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                              HOT
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{estimate.phone}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold">${parseFloat(estimate.total).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Bottom: Status, Age, Date, Action */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`${status.badge} text-[10px] px-1.5 py-0 h-5`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                        {estimate.status !== 'converted' && estimate.status !== 'rejected' && (
                          <Badge variant="outline" className={`${ageColors.badge} text-[10px] px-1.5 py-0 h-5`}>
                            {estimate.ageDays}d
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(estimate.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {estimate.status !== 'converted' && estimate.status !== 'rejected' && (
                        <Button 
                          onClick={() => convertToJobMutation.mutate(estimate.id)}
                          disabled={convertToJobMutation.isPending}
                          size="sm"
                          className={`h-7 text-xs ${isHotLead 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : ''
                          }`}
                        >
                          {convertToJobMutation.isPending ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Convert
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* DESKTOP VIEW - Table-like rows */}
          <Card className="hidden md:block overflow-hidden">
            <div className="divide-y">
              {filteredEstimates.map((estimate) => {
                const status = STATUS_CONFIG[estimate.status as StatusKey] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;
                const ageColors = getAgeColors(estimate.ageDays);
                const isHotLead = estimate.status === 'approved';

                return (
                  <div 
                    key={estimate.id}
                    className={`p-4 flex items-center gap-6 hover:bg-accent/50 transition-colors border-l-4 ${status.border} ${
                      isHotLead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm">{estimate.customerName}</h3>
                        {isHotLead && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                            HOT LEAD
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {estimate.phone}
                        </span>
                        {estimate.desiredFinishDate && (
                          <span className="text-orange-600">
                            Wants by: {new Date(estimate.desiredFinishDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="w-24 text-sm text-muted-foreground hidden lg:block">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(estimate.date).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="w-28">
                      <Badge variant="outline" className={status.badge}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    {/* Age */}
                    <div className="w-14">
                      {estimate.status !== 'converted' && estimate.status !== 'rejected' ? (
                        <Badge variant="outline" className={ageColors.badge}>
                          {estimate.ageDays}d
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Total */}
                    <div className="w-28 text-right">
                      <p className="text-lg font-bold">${parseFloat(estimate.total).toFixed(2)}</p>
                    </div>

                    {/* Action */}
                    <div className="w-28">
                      {estimate.status !== 'converted' && estimate.status !== 'rejected' ? (
                        <Button 
                          onClick={() => convertToJobMutation.mutate(estimate.id)}
                          disabled={convertToJobMutation.isPending}
                          size="sm"
                          className={`w-full ${isHotLead 
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25' 
                            : ''
                          }`}
                        >
                          {convertToJobMutation.isPending ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <ArrowRight className="w-4 h-4 mr-1" />
                              Convert
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {estimate.status === 'converted' ? '✓ Done' : '✗ Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* ============================================ */}
      {/* CREATE DIALOG */}
      {/* ============================================ */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          createMutation.reset();
        }
      }}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>New Estimate</DialogTitle>
          </DialogHeader>
          <EstimateForm
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
