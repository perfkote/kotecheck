import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Estimate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Settings } from "lucide-react";
import { Link } from "wouter";

export default function Estimates() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: estimates = [], isLoading } = useQuery<Estimate[]>({
    queryKey: ["/api/estimates"],
  });

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
          <Button data-testid="button-new-estimate">
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
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Estimate
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          filteredEstimates.map((estimate) => (
            <Card key={estimate.id} className="p-6 hover-elevate" data-testid={`card-estimate-${estimate.id}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
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
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${parseFloat(estimate.total).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
