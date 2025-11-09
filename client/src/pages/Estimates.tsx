import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Estimate, Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, Eye, Send, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Estimates() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: estimates = [], isLoading } = useQuery<Estimate[]>({
    queryKey: ["/api/estimates"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const estimatesWithCustomers = estimates.map(estimate => ({
    ...estimate,
    customerName: customers.find(c => c.id === estimate.customerId)?.name || "Unknown",
  }));

  const filteredEstimates = estimatesWithCustomers.filter(estimate =>
    estimate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    estimate.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Estimates</h1>
          <p className="text-muted-foreground mt-1">Create and manage customer estimates</p>
        </div>
        <Button data-testid="button-new-estimate">
          <Plus className="w-4 h-4 mr-2" />
          New Estimate
        </Button>
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
          <Card className="p-8">
            <p className="text-muted-foreground text-center">No estimates yet</p>
          </Card>
        ) : (
          filteredEstimates.map((estimate) => (
            <Card key={estimate.id} className="p-6" data-testid={`card-estimate-${estimate.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-medium">{estimate.title}</h3>
                    <StatusBadge status={estimate.status} type="estimate" />
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>{estimate.customerName}</span>
                    <span>{new Date(estimate.createdAt).toLocaleDateString()}</span>
                    <span className="font-medium text-foreground">${estimate.total}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" data-testid={`button-view-${estimate.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  {estimate.status === "draft" && (
                    <Button size="sm" data-testid={`button-send-${estimate.id}`}>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-menu-${estimate.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem data-testid="menu-edit">Edit</DropdownMenuItem>
                      <DropdownMenuItem data-testid="menu-duplicate">Duplicate</DropdownMenuItem>
                      <DropdownMenuItem data-testid="menu-download">Download PDF</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" data-testid="menu-delete">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
