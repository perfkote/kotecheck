import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Estimate, Service, InsertEstimate, Job } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Settings, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstimateForm } from "@/components/EstimateForm";
import { useToast } from "@/hooks/use-toast";

export default function Estimates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: estimates = [], isLoading } = useQuery<Estimate[]>({
    queryKey: ["/api/estimates"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const createMutation = useMutation({
    mutationFn: async ({ estimate, services }: { estimate: InsertEstimate; services: any[] }) => {
      // Create the estimate first
      const estimateResponse = await apiRequest("POST", "/api/estimates", estimate);
      const newEstimate: Estimate = await estimateResponse.json();
      
      // Then add all services to it
      for (const service of services) {
        await apiRequest("POST", `/api/estimates/${newEstimate.id}/services`, {
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          servicePrice: service.servicePrice.toString(),
        });
      }
      
      return newEstimate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      toast({ title: "Success", description: "Estimate created successfully" });
      setIsDialogOpen(false);
    },
    onError: () => {
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
      // Navigate to jobs page to see the new job
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

  const handleSubmit = (data: InsertEstimate, selectedServices: any[]) => {
    createMutation.mutate({ estimate: data, services: selectedServices });
  };

  const filteredEstimates = estimates.filter(estimate =>
    estimate.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    estimate.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Estimates</h1>
          <p className="text-muted-foreground mt-1">Create and manage customer estimates</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/services">
            <Button variant="outline" data-testid="button-manage-services">
              <Settings className="w-4 h-4 mr-2" />
              Manage Services
            </Button>
          </Link>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-new-estimate">
            <Plus className="w-4 h-4 mr-2" />
            New Estimate
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search estimates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-estimates"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEstimates.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No estimates yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create your first estimate to get started. Make sure to set up your services first!
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Link href="/services">
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Services
                  </Button>
                </Link>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Estimate
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          filteredEstimates.map((estimate) => (
            <Card key={estimate.id} className="p-6 hover-elevate" data-testid={`card-estimate-${estimate.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div>
                    <h3 className="font-semibold text-lg">{estimate.customerName}</h3>
                    <p className="text-muted-foreground">{estimate.phone}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>Date: {new Date(estimate.date).toLocaleDateString()}</span>
                    {estimate.desiredFinishDate && (
                      <span className="ml-4">
                        Desired Finish: {new Date(estimate.desiredFinishDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className={`inline-block px-2 py-1 rounded-md ${
                      estimate.status === "converted" ? "bg-green-100 text-green-800" :
                      estimate.status === "approved" ? "bg-blue-100 text-blue-800" :
                      estimate.status === "sent" ? "bg-purple-100 text-purple-800" :
                      estimate.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                  <div>
                    <div className="text-2xl font-bold">${parseFloat(estimate.total).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total</div>
                  </div>
                  {estimate.status !== "converted" && (
                    <Button 
                      onClick={() => convertToJobMutation.mutate(estimate.id)}
                      disabled={convertToJobMutation.isPending}
                      data-testid={`button-convert-${estimate.id}`}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Convert to Job
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Estimate</DialogTitle>
          </DialogHeader>
          <EstimateForm
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            services={services}
            onServiceCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/services"] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
